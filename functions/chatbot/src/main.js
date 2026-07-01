/* global process */
import { Client, Databases, ID } from 'node-appwrite';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DATABASE_ID = process.env.DATABASE_ID || '69c1cfaf003a710f1232';
const COLLECTION_ID = 'chat_messages';
const USERS_COLLECTION_ID = 'users';
const VENDORS_COLLECTION_ID = 'vendors';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';
const COMPLAINTS_COLLECTION_ID = 'complaints';
const REVIEWS_COLLECTION_ID = 'reviews';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_CANDIDATES = [
  String(process.env.GEMINI_MODEL || '').trim(),
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro',
].filter(Boolean);

const SYSTEM_PROMPTS = {
  Customer: `You are a helpful customer service assistant for an online marketplace. Your role is to help customers with:
- Finding and recommending products based on their needs
- Explaining how to use the auction system
- Tracking orders and checking order status
- Resolving account and login issues
- Filing complaints and feedback
- Explaining shipping and return policies

Be friendly, concise, and helpful. If a customer asks about a specific product, provide recommendations with product names. For auctions, explain how bidding works, end times, and how to place bids.`,

  Vendor: `You are a helpful assistant for vendors/sellers on the marketplace. Your role is to help vendors with:
- Managing their product listings and inventory
- Understanding auction dashboard features
- Setting up retail vs auction listings
- Monitoring bids and auction status
- Shipping and fulfillment guidance
- Account and profile management
- Understanding seller policies and commission structures

Be professional and technical. Help vendors optimize their listings and understand platform features.`,

  Admin: `You are an administrative assistant for marketplace administrators. Your role is to help admins with:
- User and vendor management
- Dispute and complaint resolution procedures
- System monitoring and health checks
- Escalation procedures for critical issues
- Policy enforcement and moderation
- Analytics and reporting guidance
- Database and collection management

Provide clear, technical guidance and escalation pathways.`,
};

const CUSTOMER_CONTEXT_PROMPT = `You have access to the customer's current context:
- Recent orders (if any)
- Wishlist items (if any)
- Current auctions they're bidding on (if any)

When relevant, reference this information to provide personalized recommendations.`;

const VENDOR_CONTEXT_PROMPT = `You have access to the vendor's current context:
- Active listings count
- Active auctions count
- Recent order volume
- Customer rating

Use this information to provide relevant guidance on inventory management and sales optimization.`;

const RESPONSE_CONTRACT_PROMPT = `You must always output strict JSON only, with no markdown and no extra text.
Response schema:
{
  "action": "search" | "chat" | "navigate",
  "query": string | null,
  "route": string | null,
  "reply": string
}

Rules:
- If the user intent is to find, browse, buy, compare, or discover products, set action to "search" and set query to a short product-focused search phrase.
- If the user intent is to open a page in the app (example: auction page, settings, profile, orders, category page), set action to "navigate" and set route to the matching app path.
- If the user intent is regular conversation or help text, set action to "chat" and set query to null.
- For "navigate" action set query to null.
- If conversation history exists, never repeat the introductory greeting. Respond directly to the user input.
- Keep reply concise and useful.`;

const REVIEW_ANALYSIS_SYSTEM_PROMPT = `You are provided with product reviews. Perform a sentiment analysis (classify as positive, negative, or neutral) and summarize the pros/cons. If no reviews are provided, state that.`;

const VENDOR_TRUST_SYSTEM_PROMPT = `You are provided with deterministic vendor trust metrics computed by the backend.
- Keep the trust class and honor score exactly as given.
- Explain in 2-4 concise lines why the vendor is categorized this way.
- Mention key factors: rating quality, review sentiment, and complaints.
- If confidence is low, clearly mention data is limited.
- Do not invent extra scores or change numeric values.`;

const json = (res, statusCode, body) => res.json(body, statusCode, {
  'Content-Type': 'application/json',
});

const equalQuery = (key, value) => JSON.stringify({
  method: 'equal',
  attribute: key,
  values: [String(value || '')],
});

const orderDescQuery = (key) => JSON.stringify({
  method: 'orderDesc',
  attribute: key,
});

const limitQuery = (value) => JSON.stringify({
  method: 'limit',
  values: [Number(value) || 10],
});

const cursorAfterQuery = (documentId) => JSON.stringify({
  method: 'cursorAfter',
  values: [String(documentId || '')],
});

const parseRequestBody = (req) => {
  if (req?.bodyJson && typeof req.bodyJson === 'object') {
    return req.bodyJson;
  }

  const text = String(req?.bodyText || req?.body || '').trim();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const parseUserMessage = (text) => {
  if (!text) return '';
  return String(text).trim();
};

const toGeminiRole = (rawSender, rawRole) => {
  const sender = String(rawSender || '').trim().toLowerCase();
  if (sender === 'model' || sender === 'assistant' || sender === 'bot') {
    return 'model';
  }

  const role = String(rawRole || '').trim().toLowerCase();
  if (role === 'model' || role === 'assistant' || role === 'bot') {
    return 'model';
  }

  return 'user';
};

const normalizeGeminiHistory = (rows = []) => {
  const expandedRows = rows.flatMap((row) => {
    const timestamp = String(row?.timestamp || row?.$createdAt || '');
    const message = String(row?.message || row?.text || '').trim();

    if (message) {
      return [{
        role: toGeminiRole(row?.sender, row?.role),
        text: message,
        timestamp,
      }];
    }

    // Legacy schema support: one document stores both user and model turns.
    const legacyUser = String(row?.user_message || '').trim();
    const legacyModel = String(row?.ai_response || '').trim();
    const list = [];

    if (legacyUser) {
      list.push({ role: 'user', text: legacyUser, timestamp });
    }
    if (legacyModel) {
      list.push({ role: 'model', text: legacyModel, timestamp });
    }

    return list;
  });

  const mapped = expandedRows.filter((item) => item.text);

  // Ensure chronological order if source rows are not already sorted.
  mapped.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Gemini history must start with user turn and alternate logically.
  while (mapped.length && mapped[0].role !== 'user') {
    mapped.shift();
  }

  const cleaned = [];
  for (const item of mapped) {
    const prev = cleaned[cleaned.length - 1];
    if (!prev || prev.role !== item.role) {
      cleaned.push(item);
    }
  }

  if (cleaned.length && cleaned[cleaned.length - 1].role === 'user') {
    cleaned.pop();
  }

  return cleaned.map((item) => ({
    role: item.role,
    parts: [{ text: item.text }],
  }));
};

const createDatabasesClient = () => {
  const appwriteClient = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2')
    .setKey(process.env.APPWRITE_API_KEY || '');

  return new Databases(appwriteClient);
};

const deleteUserChatMessages = async (databases, userId) => {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return 0;
  }

  let deletedCount = 0;

  while (true) {
    const page = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      equalQuery('user_id', normalizedUserId),
      limitQuery(100),
    ]);

    const documents = page?.documents || [];
    if (!documents.length) {
      break;
    }

    for (const doc of documents) {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
      deletedCount += 1;
    }
  }

  return deletedCount;
};

const fetchUserHistoryForGemini = async (databases, userId) => {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    equalQuery('user_id', String(userId).trim()),
    orderDescQuery('timestamp'),
    limitQuery(10),
  ]);

  const docs = response?.documents || [];
  return normalizeGeminiHistory(docs);
};

const writeChatTurns = async ({ databases, userId, roleKey, userText, modelText, modelName }) => {
  const now = new Date();
  const userTimestamp = now.toISOString();
  const modelTimestamp = new Date(now.getTime() + 1).toISOString();

  try {
    // Write user message as its own document.
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      user_id: String(userId).trim(),
      role: roleKey,
      message: String(userText).trim(),
      sender: 'user',
      timestamp: userTimestamp,
      metadata: JSON.stringify({ source: 'chatbot-function' }),
    });

    // Write AI/model response as a separate document.
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      user_id: String(userId).trim(),
      role: roleKey,
      message: String(modelText).trim(),
      sender: 'model',
      timestamp: modelTimestamp,
      metadata: JSON.stringify({ model: modelName || 'unknown' }),
    });
    return;
  } catch (err) {
    const message = String(err?.message || '');
    const legacyMissingAttr = message.includes('Missing required attribute "user_message"')
      || message.includes('Missing required attribute "ai_response"');

    if (!legacyMissingAttr) {
      throw err;
    }
  }

  // Legacy schema fallback: store both turns in one document.
  await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    user_id: String(userId).trim(),
    role: roleKey,
    user_message: String(userText).trim(),
    ai_response: String(modelText).trim(),
    timestamp: modelTimestamp,
    metadata_json: JSON.stringify({ model: modelName || 'unknown', schema: 'legacy' }),
  });
};

const isModelNotFoundError = (err) => {
  const message = String(err?.message || '').toLowerCase();
  return message.includes('404') || message.includes('not found') || message.includes('models/');
};

const generateAiResponse = async ({ genAI, systemInstruction, history, message }) => {
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(message);
      const text = String(result?.response?.text?.() || '').trim();

      if (!text) {
        throw new Error('Model returned an empty response.');
      }

      return {
        text,
        modelName,
      };
    } catch (err) {
      lastError = err;
      if (!isModelNotFoundError(err)) {
        throw err;
      }
    }
  }

  throw lastError || new Error('No compatible Gemini model found for this API key.');
};

const buildFallbackReply = (roleKey, userMessage) => {
  const text = String(userMessage || '').toLowerCase();

  const navigationRoute = isNavigationIntent(text) ? resolveNavigationRoute(text, roleKey) : null;
  if (navigationRoute) {
    return `Sure, opening ${navigationRoute} now.`;
  }
  if (isNavigationIntent(text)) {
    return 'Sure. Tell me the page name, for example: auctions, settings, profile, orders, category electronics, or dashboard.';
  }

  if (/^(hi|hello|hey|yo|salam|assalam|good\s*(morning|afternoon|evening))\b/i.test(text.trim())) {
    return 'Hi! I can help you find products, track orders, explain auctions, or file complaints. Tell me what you are looking for.';
  }

  if (detectSearchIntent(text)) {
    const query = toSearchQuery(text);
    return `Got it. I am searching products for "${query}" now.`;
  }

  if (text.includes('phone') || text.includes('case')) {
    return 'I can help with that. Try searching in Electronics with keywords: phone case, silicone case, shockproof case, and clear cover. If you want, tell me your phone model and budget and I will narrow it down.';
  }

  if (text.includes('order')) {
    return 'You can track your order from Orders page. Open Orders, select the latest order, and check its status (pending, shipped, delivered).';
  }

  if (text.includes('auction') || text.includes('bid')) {
    return 'For auctions: open Auctions page, choose a live item, place a bid above current price, and monitor end time. Highest valid bid at end wins.';
  }

  if (text.includes('complaint') || text.includes('issue') || text.includes('problem')) {
    return 'You can submit a complaint from the Complaints page. Include order id, product name, and a short issue summary for faster resolution.';
  }

  if (String(roleKey || '') === 'Vendor') {
    return 'I can help with vendor tasks like listing setup, auction scheduling, and inventory updates. Tell me what you want to do.';
  }

  if (String(roleKey || '') === 'Admin') {
    return 'I can help with admin workflows like user management, complaint handling, and policy checks. Tell me the task you want to perform.';
  }

  return 'I can help with product suggestions, orders, auctions, and complaints. Tell me what you need and I will guide you step by step.';
};

const detectSearchIntent = (text) => {
  const value = String(text || '').toLowerCase();
  const searchSignals = [
    'buy', 'find', 'search', 'show me', 'looking for', 'i want', 'need', 'recommend', 'suggest',
    'price of', 'best', 'cheap', 'compare', 'home decor', 'phone case', 'laptop', 'shoes', 'watch',
    'clothing', 'apparel', 'fashion', 'outfit',
  ];

  return searchSignals.some((token) => value.includes(token));
};

const normalizeRouteText = (text) => {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toSlug = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const isNavigationIntent = (text) => {
  const value = normalizeRouteText(text);
  const hasDestination = /\b(page|screen|tab|section|settings|profile|auction|category|dashboard|orders|cart|inventory|complaints|users|home|store|marketplace|checkout)\b/.test(value);
  const triggerPatterns = [
    /\btake\s+me\s+to\b/,
    /\bgo\s+to\b/,
    /\bnavigate\s+to\b/,
    /\bbring\s+me\s+to\b/,
    /\bmove\s+to\b/,
    /\broute\s+me\s+to\b/,
    /\bopen\b/,
    /\bo+pen\b/,
    /\bshow\b.*\b(page|screen|tab|section)\b/,
    /\bswitch\s+to\b/,
    /\bredirect\s+me\b/,
  ];

  return hasDestination && triggerPatterns.some((pattern) => pattern.test(value));
};

const resolveNavigationRoute = (text, roleKey) => {
  const value = normalizeRouteText(text);
  const role = String(roleKey || '').trim();

  const categoryMatch = value.match(/(?:category|categories)(?:\s+page)?\s+([a-z0-9\s-]{2,})$/);
  if (categoryMatch?.[1]) {
    const slug = toSlug(categoryMatch[1]);
    if (slug && !['page', 'pages'].includes(slug)) {
      return `/category/${slug}`;
    }
  }

  if (/\bcategory|categories\b/.test(value)) return '/store-home';
  if (/\bauction|auctions|bid|bidding\b/.test(value)) return '/auctions';
  if (/\bsettings|setting\b/.test(value)) return '/settings';
  if (/\bprofile|account\b/.test(value)) return role === 'Vendor' ? '/vendor-profile' : '/profile';
  if (/\borders|order\b/.test(value)) return '/orders';
  if (/\bcart\b/.test(value)) return '/cart';
  if (/\bcheckout\b/.test(value)) return '/checkout';
  if (/\binventory|stock|listing|listings\b/.test(value)) return '/inventory';
  if (/\badmin\s+users|manage\s+users|users\s+page\b/.test(value)) return '/admin/users';
  if (/\bcomplaint|complaints\b/.test(value)) {
    return role === 'Admin' ? '/admin/complaints' : '/orders';
  }
  if (/\badmin\s+dashboard\b/.test(value)) return '/admin-dashboard';
  if (/\bvendor\s+dashboard|seller\s+dashboard\b/.test(value)) return '/vendor-dashboard';
  if (/\bdashboard\b/.test(value)) {
    if (role === 'Admin') return '/admin-dashboard';
    if (role === 'Vendor') return '/vendor-dashboard';
    return '/store-home';
  }
  if (/\bhome|store|marketplace\b/.test(value)) return '/store-home';

  return null;
};

const ALLOWED_ROUTES_BY_ROLE = {
  Customer: [
    '/store-home', '/search', '/auctions', '/category/', '/cart', '/checkout', '/orders', '/profile', '/settings', '/product/',
  ],
  Vendor: [
    '/store-home', '/search', '/auctions', '/category/', '/orders', '/vendor-dashboard', '/inventory', '/vendor-profile', '/settings', '/product/',
  ],
  Admin: [
    '/store-home', '/search', '/auctions', '/category/', '/settings', '/profile', '/admin-dashboard', '/admin/users', '/admin/complaints', '/product/',
  ],
};

const isAllowedRouteForRole = (route, roleKey) => {
  const normalizedRoute = String(route || '').trim();
  if (!normalizedRoute) {
    return false;
  }

  const normalizedRole = ['Customer', 'Vendor', 'Admin'].includes(String(roleKey || '').trim())
    ? String(roleKey || '').trim()
    : 'Customer';

  const allowList = ALLOWED_ROUTES_BY_ROLE[normalizedRole] || ALLOWED_ROUTES_BY_ROLE.Customer;
  return allowList.some((allowedPrefix) => normalizedRoute.startsWith(allowedPrefix));
};

const getAllowedPageSuggestions = (roleKey) => {
  const normalizedRole = ['Customer', 'Vendor', 'Admin'].includes(String(roleKey || '').trim())
    ? String(roleKey || '').trim()
    : 'Customer';

  if (normalizedRole === 'Admin') {
    return 'Try: admin dashboard, manage users, complaints, settings, auctions, or store home.';
  }
  if (normalizedRole === 'Vendor') {
    return 'Try: vendor dashboard, inventory, orders, profile, settings, auctions, or store home.';
  }

  return 'Try: store home, search, categories, auctions, orders, cart, profile, or settings.';
};

const enforceRouteAccess = (payload, roleKey) => {
  if (payload?.action !== 'navigate') {
    return payload;
  }

  const route = String(payload?.route || '').trim();
  if (!route) {
    return {
      action: 'chat',
      query: null,
      route: null,
      reply: 'Tell me which page you want to open. For example: settings, profile, auctions, orders, or dashboard.',
    };
  }

  if (isAllowedRouteForRole(route, roleKey)) {
    return payload;
  }

  return {
    action: 'chat',
    query: null,
    route: null,
    reply: `You do not have access to ${route}. ${getAllowedPageSuggestions(roleKey)}`,
  };
};

const SEARCH_SYNONYMS = {
  clothing: 'fashion apparels',
  clothes: 'fashion apparels',
  cloths: 'fashion apparels',
  apparel: 'fashion apparels',
  apparels: 'fashion apparels',
  outfit: 'fashion apparels',
  outfits: 'fashion apparels',
  sneakers: 'shoes',
  trainers: 'shoes',
  cellphone: 'phone',
  mobile: 'phone',
};

const SEARCH_STOP_TOKENS = new Set([
  'i', 'me', 'my', 'want', 'wanna', 'to', 'buy', 'find', 'search', 'show', 'help', 'please',
  'need', 'looking', 'for', 'a', 'an', 'the', 'some', 'any', 'product', 'products',
]);

const normalizeSearchText = (text) => {
  let value = String(text || '').toLowerCase();

  value = value
    .replace(/\byoga\s*ma\b/g, 'yoga mat')
    .replace(/\bcloths\b/g, 'clothes')
    .replace(/\bi\s*want\s*to\s*but\b/g, 'i want to buy')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return value;
};

const isReviewAnalysisRequest = (text) => {
  const value = String(text || '').toLowerCase();
  return /\b(summarize|summarise|summary|analyze|analyse|sentiment|pros\s*(and|&)\s*cons|positive|negative|neutral)\b/.test(value);
};

const extractReviewText = (reviewDoc = {}) => {
  const candidates = [
    reviewDoc.comment,
    reviewDoc.review,
    reviewDoc.text,
    reviewDoc.content,
    reviewDoc.message,
  ];

  const best = candidates.find((item) => String(item || '').trim());
  return String(best || '').trim();
};

const extractReviewRating = (reviewDoc = {}) => {
  const value = Number(reviewDoc.rating);
  return Number.isFinite(value) ? value : 0;
};

const fetchLatestReviewEntries = async (databases, productId, limit = 15) => {
  const normalizedProductId = String(productId || '').trim();
  if (!normalizedProductId) {
    return [];
  }

  const maxReviews = Math.max(10, Math.min(20, Number(limit) || 15));
  const fieldCandidates = ['product_id', 'productId'];
  const orderCandidates = ['timestamp', '$createdAt'];

  for (const fieldName of fieldCandidates) {
    for (const orderField of orderCandidates) {
      try {
        const response = await databases.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, [
          equalQuery(fieldName, normalizedProductId),
          orderDescQuery(orderField),
          limitQuery(maxReviews),
        ]);

        const entries = (response?.documents || [])
          .map((doc) => ({
            text: extractReviewText(doc),
            rating: extractReviewRating(doc),
          }))
          .filter((item) => item.text)
          .slice(0, maxReviews);

        if (entries.length) {
          return entries;
        }
      } catch {
        // Continue trying fallback attribute/order combinations.
      }
    }
  }

  return [];
};

const isVendorTrustRequest = (text) => {
  const value = String(text || '').toLowerCase();
  const trustSignal = /\b(trustworthy|trust|trusted|fraud|fraudulent|scam|suspicious|reliable|reputation|honor\s*score|honour\s*score|seller\s*score|vendor\s*score|safe\s*seller)\b/.test(value);
  const vendorSignal = /\b(vendor|seller|shop|store)\b/.test(value);
  const thisSellerSignal = /\b(this\s+(vendor|seller|shop)|vendor\s+of\s+this\s+product|seller\s+of\s+this\s+product)\b/.test(value);
  return (trustSignal && (vendorSignal || thisSellerSignal)) || thisSellerSignal;
};

const normalizeComparableText = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenizeComparable = (value) => {
  return normalizeComparableText(value)
    .split(' ')
    .filter((token) => token.length > 1);
};

const diceCoefficient = (a, b) => {
  const left = normalizeComparableText(a);
  const right = normalizeComparableText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftBigrams = new Map();
  for (let i = 0; i < left.length - 1; i += 1) {
    const pair = left.slice(i, i + 2);
    leftBigrams.set(pair, (leftBigrams.get(pair) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < right.length - 1; i += 1) {
    const pair = right.slice(i, i + 2);
    const count = leftBigrams.get(pair) || 0;
    if (count > 0) {
      leftBigrams.set(pair, count - 1);
      intersection += 1;
    }
  }

  return (2 * intersection) / (left.length + right.length - 2);
};

const extractVendorHintFromMessage = (text) => {
  const value = String(text || '').trim();
  if (!value) {
    return '';
  }

  const quotedMatch = value.match(/['"]([^'"]{2,60})['"]/);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim();
  }

  const pattern = /(?:vendor|seller|shop|store)\s*(?:named|name is|is|:)?\s*([a-z0-9_\-\s]{2,60})/i;
  const match = value.match(pattern);
  if (!match?.[1]) {
    return '';
  }

  const candidate = match[1]
    .replace(/\b(trustworthy|trusted|fraud|fraudulent|scam|suspicious|reliable|honor|honour|score|safe)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (/\bthis\s+(product|item|vendor|seller|shop|store)\b/i.test(candidate) || /^of\s+this\s+(product|item)$/i.test(candidate)) {
    return '';
  }

  return candidate;
};

const isCurrentProductVendorReference = (text) => {
  const value = String(text || '').toLowerCase();
  return /\b(vendor|seller|shop|store)\s+of\s+this\s+(product|item)\b/.test(value)
    || /\bthis\s+(product|item)\s+(vendor|seller|shop|store)\b/.test(value)
    || /\bthis\s+(vendor|seller|shop|store)\b/.test(value)
    || /\bvendor\s+for\s+this\s+(product|item)\b/.test(value)
    || /\bseller\s+for\s+this\s+(product|item)\b/.test(value);
};

const fetchAllDocuments = async (databases, collectionId, baseQueries = [], pageSize = 100, maxRows = 1200) => {
  const rows = [];
  let cursor = '';

  while (rows.length < maxRows) {
    const queries = [...baseQueries, limitQuery(pageSize)];
    if (cursor) {
      queries.push(cursorAfterQuery(cursor));
    }

    const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    const documents = response?.documents || [];
    rows.push(...documents);

    if (!documents.length || documents.length < pageSize) {
      break;
    }

    cursor = documents[documents.length - 1]?.$id || '';
    if (!cursor) {
      break;
    }
  }

  return rows.slice(0, maxRows);
};

const readFirstNonEmpty = (obj, fields = []) => {
  for (const field of fields) {
    const value = String(obj?.[field] || '').trim();
    if (value) {
      return value;
    }
  }
  return '';
};

const resolveVendorTarget = async (databases, message, vendorContext = null) => {
  const contextVendorId = String(vendorContext?.vendorId || '').trim();
  const referencesCurrentProductVendor = isCurrentProductVendorReference(message);
  const explicitHint = extractVendorHintFromMessage(message);

  if (contextVendorId && (referencesCurrentProductVendor || !explicitHint)) {
    return {
      status: 'resolved',
      vendorId: contextVendorId,
      vendorName: String(vendorContext?.vendorName || vendorContext?.vendorUsername || contextVendorId),
      source: 'product-context',
    };
  }

  if (!explicitHint) {
    return {
      status: 'missing',
      message: 'Please provide a vendor username or open a product page and ask again so I can evaluate that vendor.',
    };
  }

  const [vendorDocs, userDocs] = await Promise.all([
    fetchAllDocuments(databases, VENDORS_COLLECTION_ID, []),
    fetchAllDocuments(databases, USERS_COLLECTION_ID, []),
  ]);

  const userById = new Map(userDocs.map((doc) => [String(doc?.$id || ''), doc]));
  const candidates = vendorDocs
    .map((vendorDoc) => {
      const vendorId = String(vendorDoc?.vendorId || vendorDoc?.$id || '').trim();
      if (!vendorId) {
        return null;
      }

      const userDoc = userById.get(vendorId);
      const username = readFirstNonEmpty(userDoc, ['username', 'userName']);
      const shopName = readFirstNonEmpty(vendorDoc, ['shopName', 'shop_name']);
      const personName = readFirstNonEmpty(userDoc, ['name', 'fullName', 'vendor_name']);
      const searchable = [vendorId, username, shopName, personName].filter(Boolean);

      return {
        vendorId,
        vendorName: shopName || personName || username || vendorId,
        username,
        shopName,
        personName,
        searchable,
      };
    })
    .filter(Boolean);

  const normalizedHint = normalizeComparableText(explicitHint);
  const exact = candidates.filter((candidate) => {
    return candidate.searchable.some((entry) => normalizeComparableText(entry) === normalizedHint);
  });

  if (exact.length === 1) {
    return {
      status: 'resolved',
      vendorId: exact[0].vendorId,
      vendorName: exact[0].vendorName,
      source: 'exact',
    };
  }

  if (exact.length > 1) {
    return {
      status: 'ambiguous',
      hint: explicitHint,
      options: exact.slice(0, 4).map((candidate) => candidate.vendorName),
    };
  }

  const scored = candidates
    .map((candidate) => {
      let score = 0;

      for (const entry of candidate.searchable) {
        const normalizedEntry = normalizeComparableText(entry);
        if (!normalizedEntry) continue;

        if (normalizedEntry.includes(normalizedHint) || normalizedHint.includes(normalizedEntry)) {
          score = Math.max(score, 0.88);
        }

        score = Math.max(score, diceCoefficient(normalizedHint, normalizedEntry));

        const hintTokens = tokenizeComparable(normalizedHint);
        const entryTokens = tokenizeComparable(normalizedEntry);
        if (hintTokens.length && entryTokens.length) {
          const overlap = hintTokens.filter((token) => entryTokens.includes(token)).length;
          score = Math.max(score, overlap / Math.max(hintTokens.length, entryTokens.length));
        }
      }

      return {
        ...candidate,
        score,
      };
    })
    .filter((candidate) => candidate.score >= 0.45)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return {
      status: 'missing',
      message: `I could not find a vendor matching "${explicitHint}". Please provide the exact username or shop name.`,
    };
  }

  if (scored.length > 1 && Math.abs(scored[0].score - scored[1].score) <= 0.08) {
    return {
      status: 'ambiguous',
      hint: explicitHint,
      options: scored.slice(0, 4).map((candidate) => candidate.vendorName),
    };
  }

  return {
    status: 'resolved',
    vendorId: scored[0].vendorId,
    vendorName: scored[0].vendorName,
    source: 'fuzzy',
  };
};

const toOrderIdValue = (orderDoc = {}) => {
  return String(orderDoc?.orderId || orderDoc?.$id || '').trim();
};

const toProductIdValue = (productDoc = {}) => {
  return String(productDoc?.productId || productDoc?.$id || '').trim();
};

const classifyReviewSentiment = (entry = {}) => {
  const text = String(entry?.text || '').toLowerCase();
  const rating = Number(entry?.rating || 0);
  const positiveWords = ['good', 'great', 'excellent', 'love', 'best', 'amazing', 'fast', 'quality', 'satisfied', 'recommend'];
  const negativeWords = ['bad', 'poor', 'worst', 'hate', 'slow', 'broken', 'cheap', 'issue', 'problem', 'disappointed'];
  const posHits = positiveWords.filter((word) => text.includes(word)).length;
  const negHits = negativeWords.filter((word) => text.includes(word)).length;

  if (rating >= 4) return 'positive';
  if (rating > 0 && rating <= 2) return 'negative';
  if (posHits > negHits) return 'positive';
  if (negHits > posHits) return 'negative';
  return 'neutral';
};

const complaintCategoryWeight = (category) => {
  const normalized = String(category || '').trim().toLowerCase();
  if (['damaged', 'defective', 'missing item', 'wrong item'].includes(normalized)) return 1;
  if (['quality', 'late'].includes(normalized)) return 0.7;
  return 0.45;
};

const complaintStatusWeight = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (['open', 'pending'].includes(normalized)) return 1;
  if (['in progress', 'processing'].includes(normalized)) return 0.8;
  if (['resolved', 'closed'].includes(normalized)) return 0.45;
  return 0.7;
};

const computeVendorTrustReport = async (databases, vendorTarget = {}) => {
  const vendorId = String(vendorTarget?.vendorId || '').trim();
  if (!vendorId) {
    return null;
  }

  const [products, orders, allComplaints] = await Promise.all([
    fetchAllDocuments(databases, PRODUCTS_COLLECTION_ID, [equalQuery('vendorId', vendorId)]).catch(() => []),
    fetchAllDocuments(databases, ORDERS_COLLECTION_ID, [equalQuery('vendorId', vendorId)]).catch(() => []),
    fetchAllDocuments(databases, COMPLAINTS_COLLECTION_ID, []).catch(() => []),
  ]);

  const productIds = products.map(toProductIdValue).filter(Boolean);

  const reviewRows = [];
  for (const productId of productIds.slice(0, 60)) {
    const rows = await fetchLatestReviewEntries(databases, productId, 20);
    if (rows.length) {
      reviewRows.push(...rows);
    }
  }

  const orderIds = new Set(orders.map(toOrderIdValue).filter(Boolean));
  const complaintRows = allComplaints.filter((complaintDoc) => {
    const orderId = String(complaintDoc?.orderId || '').trim();
    return orderId && orderIds.has(orderId);
  });

  let ratingSum = 0;
  let ratingCount = 0;
  let positiveReviews = 0;
  let negativeReviews = 0;
  let neutralReviews = 0;

  for (const review of reviewRows) {
    const rating = Number(review?.rating || 0);
    if (rating > 0) {
      ratingSum += rating;
      ratingCount += 1;
    }

    const sentiment = classifyReviewSentiment(review);
    if (sentiment === 'positive') positiveReviews += 1;
    else if (sentiment === 'negative') negativeReviews += 1;
    else neutralReviews += 1;
  }

  const complaintsWeighted = complaintRows.reduce((sum, complaintDoc) => {
    const categoryWeight = complaintCategoryWeight(complaintDoc?.category);
    const statusWeight = complaintStatusWeight(complaintDoc?.status);
    return sum + (categoryWeight * statusWeight);
  }, 0);

  const averageRating = ratingCount ? ratingSum / ratingCount : 0;
  const sentimentScore = reviewRows.length
    ? ((positiveReviews + (0.5 * neutralReviews)) / reviewRows.length) * 100
    : 55;
  const complaintRate = orders.length ? complaintRows.length / orders.length : 0;
  const weightedComplaintRate = orders.length ? complaintsWeighted / orders.length : 0;

  const ratingComponent = (Math.min(5, Math.max(0, averageRating)) / 5) * 100;
  const complaintPenaltyBasis = Math.min(100, (weightedComplaintRate * 100) * 2.6);
  const complaintComponent = 100 - complaintPenaltyBasis;
  const volumeComponent = Math.min(100, ((reviewRows.length + orders.length) / 40) * 100);

  let honorScore = (ratingComponent * 0.45)
    + (sentimentScore * 0.25)
    + (complaintComponent * 0.25)
    + (volumeComponent * 0.05);

  if (complaintRate > 0.18) {
    honorScore -= 10;
  } else if (complaintRate > 0.12) {
    honorScore -= 6;
  }

  honorScore = Math.max(0, Math.min(100, Math.round(honorScore)));

  let trustClass = 'Fraudulent';
  if (honorScore >= 75) trustClass = 'Trustworthy';
  else if (honorScore >= 55) trustClass = 'Neutral';
  else if (honorScore >= 35) trustClass = 'Risky';

  const sampleSize = reviewRows.length + orders.length;
  let confidence = 'High';
  let caveat = '';
  if (sampleSize < 8) {
    confidence = 'Low';
    caveat = 'Confidence is low because this vendor has limited review and order history.';
  } else if (sampleSize < 20) {
    confidence = 'Medium';
    caveat = 'Confidence is moderate due to limited sample size.';
  }

  const reasons = [];
  reasons.push(`Average rating ${averageRating.toFixed(1)}/5 from ${ratingCount} rated reviews.`);
  reasons.push(`Sentiment mix: ${positiveReviews} positive, ${negativeReviews} negative, ${neutralReviews} neutral.`);
  reasons.push(`Complaints: ${complaintRows.length} linked complaints across ${orders.length} orders (${(complaintRate * 100).toFixed(1)}%).`);

  return {
    vendorId,
    vendorName: String(vendorTarget?.vendorName || vendorId),
    trustClass,
    honorScore,
    confidence,
    caveat,
    reasonSummary: reasons.join(' '),
    metrics: {
      averageRating: Number(averageRating.toFixed(2)),
      ratingCount,
      reviewCount: reviewRows.length,
      positiveReviews,
      negativeReviews,
      neutralReviews,
      orderCount: orders.length,
      complaintCount: complaintRows.length,
      complaintRate: Number((complaintRate * 100).toFixed(2)),
      weightedComplaintRate: Number((weightedComplaintRate * 100).toFixed(2)),
    },
  };
};

const buildVendorTrustContextBlock = (report) => {
  if (!report) {
    return 'Vendor trust context: no data.';
  }

  return [
    `Vendor trust context for ${report.vendorName}:`,
    `- Honor score: ${report.honorScore}/100`,
    `- Class: ${report.trustClass}`,
    `- Confidence: ${report.confidence}`,
    `- Avg rating: ${report.metrics.averageRating}/5 (${report.metrics.ratingCount} rated reviews)`,
    `- Review sentiment counts: +${report.metrics.positiveReviews}, -${report.metrics.negativeReviews}, =${report.metrics.neutralReviews}`,
    `- Complaints: ${report.metrics.complaintCount} of ${report.metrics.orderCount} orders (${report.metrics.complaintRate}%)`,
    `- Deterministic reason summary: ${report.reasonSummary}`,
  ].join('\n');
};

const buildVendorTrustDeterministicReply = (report, llmExplanation = '') => {
  if (!report) {
    return 'I could not compute vendor trust metrics right now. Please try again.';
  }

  const lines = [
    `Vendor: ${report.vendorName}`,
    `Honor score: ${report.honorScore}/100`,
    `Classification: ${report.trustClass}`,
    `Summary: ${report.reasonSummary}`,
  ];

  if (llmExplanation) {
    lines.push(`Explanation: ${llmExplanation}`);
  }

  if (report.caveat) {
    lines.push(`Confidence: ${report.confidence} - ${report.caveat}`);
  } else {
    lines.push(`Confidence: ${report.confidence}`);
  }

  return lines.join('\n');
};

const buildReviewContextBlock = (reviewEntries = []) => {
  if (!reviewEntries.length) {
    return 'Product reviews provided: none.';
  }

  const lines = reviewEntries.map((item, index) => {
    const ratingPart = item.rating > 0 ? ` (rating: ${item.rating}/5)` : '';
    return `${index + 1}. ${item.text}${ratingPart}`;
  });
  return `Product reviews provided:\n${lines.join('\n')}`;
};

const REVIEW_THEMES = [
  {
    key: 'performance',
    label: 'Performance and responsiveness',
    tokens: ['performance', 'responsive', 'smooth', 'fast', 'lag', 'fps', 'speed'],
  },
  {
    key: 'quality',
    label: 'Build quality and durability',
    tokens: ['quality', 'build', 'durable', 'solid', 'premium', 'cheap', 'broken', 'stiff'],
  },
  {
    key: 'comfort',
    label: 'Comfort and usability',
    tokens: ['comfortable', 'comfort', 'ergonomic', 'weight', 'grip', 'easy', 'hard'],
  },
  {
    key: 'value',
    label: 'Value for money',
    tokens: ['price', 'value', 'worth', 'expensive', 'cheap', 'cost'],
  },
  {
    key: 'delivery',
    label: 'Delivery and packaging',
    tokens: ['delivery', 'shipping', 'packaging', 'arrived', 'late', 'damaged'],
  },
];

const toTopThemeLine = (themeMap, fallbackText) => {
  const ranked = Array.from(themeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (!ranked.length) {
    return fallbackText;
  }

  return ranked
    .map(([label, count], index) => `${index + 1}) ${label} (${count} mention${count > 1 ? 's' : ''})`)
    .join(' ; ');
};

const buildLocalReviewAnalysisReply = (reviewEntries = []) => {
  if (!reviewEntries.length) {
    return 'No reviews are provided for this product, so I cannot analyze sentiment or summarize pros and cons yet.';
  }

  const positiveWords = ['good', 'great', 'excellent', 'love', 'best', 'amazing', 'fast', 'quality', 'satisfied', 'recommend'];
  const negativeWords = ['bad', 'poor', 'worst', 'hate', 'slow', 'broken', 'cheap', 'issue', 'problem', 'disappointed'];

  let positive = 0;
  let negative = 0;
  let neutral = 0;

  const prosThemes = new Map();
  const consThemes = new Map();
  let ratingsSum = 0;
  let ratingsCount = 0;

  for (const entry of reviewEntries) {
    const rawText = String(entry?.text || '').trim();
    const text = rawText.toLowerCase();
    const rating = Number(entry?.rating || 0);
    const posHits = positiveWords.filter((word) => text.includes(word)).length;
    const negHits = negativeWords.filter((word) => text.includes(word)).length;

    if (rating > 0) {
      ratingsSum += rating;
      ratingsCount += 1;
    }

    let sentiment = 'neutral';

    if (rating >= 4) {
      positive += 1;
      sentiment = 'positive';
    } else if (rating > 0 && rating <= 2) {
      negative += 1;
      sentiment = 'negative';
    } else if (rating === 3) {
      neutral += 1;
      sentiment = 'neutral';
    } else if (posHits > negHits) {
      positive += 1;
      sentiment = 'positive';
    } else if (negHits > posHits) {
      negative += 1;
      sentiment = 'negative';
    } else {
      neutral += 1;
      sentiment = 'neutral';
    }

    for (const theme of REVIEW_THEMES) {
      const matched = theme.tokens.some((token) => text.includes(token));
      if (!matched) {
        continue;
      }

      if (sentiment === 'positive') {
        prosThemes.set(theme.label, (prosThemes.get(theme.label) || 0) + 1);
      } else if (sentiment === 'negative') {
        consThemes.set(theme.label, (consThemes.get(theme.label) || 0) + 1);
      }
    }
  }

  let label = 'neutral';
  if (positive > negative) {
    label = 'positive';
  } else if (negative > positive) {
    label = 'negative';
  }

  const averageRating = ratingsCount ? (ratingsSum / ratingsCount).toFixed(1) : null;
  const prosLine = toTopThemeLine(
    prosThemes,
    positive > 0 ? 'Customers are generally satisfied, but positives are not concentrated in one repeated theme.' : 'No clear recurring pros found.'
  );
  const consLine = toTopThemeLine(
    consThemes,
    negative > 0 ? 'Some negative feedback exists, but issues are scattered and not strongly recurring.' : 'No major recurring complaints found.'
  );

  const lines = [
    `Review summary (${reviewEntries.length} reviews)`,
    `Overall sentiment: ${label}`,
  ];

  if (averageRating) {
    lines.push(`Average rating: ${averageRating}/5`);
  }

  lines.push(`Distribution: positive ${positive}, negative ${negative}, neutral ${neutral}`);
  lines.push(`Top pros: ${prosLine}`);
  lines.push(`Top cons: ${consLine}`);

  return lines.join('\n');
};

const toSearchQuery = (text) => {
  const normalized = normalizeSearchText(text);
  const rawTokens = normalized.split(' ').filter(Boolean);

  const tokens = rawTokens
    .filter((token) => !SEARCH_STOP_TOKENS.has(token))
    .map((token) => SEARCH_SYNONYMS[token] || token)
    .join(' ')
    .split(' ')
    .filter(Boolean);

  const deduped = Array.from(new Set(tokens));
  if (deduped.length) {
    return deduped.join(' ');
  }

  return normalized || String(text || '').trim();
};

const parseAssistantJsonResponse = (rawText, userText, roleKey = 'Customer') => {
  const fallbackRoute = isNavigationIntent(userText) ? resolveNavigationRoute(userText, roleKey) : null;
  const fallbackAction = fallbackRoute
    ? 'navigate'
    : (detectSearchIntent(userText) ? 'search' : 'chat');
  const fallbackQuery = fallbackAction === 'search' ? toSearchQuery(userText) : null;

  const raw = String(rawText || '').trim();
  if (!raw) {
    return enforceRouteAccess({
      action: fallbackAction,
      query: fallbackQuery,
      route: fallbackAction === 'navigate' ? fallbackRoute : null,
      reply: buildFallbackReply(roleKey, userText),
    }, roleKey);
  }

  const fenced = raw.replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  const jsonChunkMatch = fenced.match(/\{[\s\S]*\}/);
  const candidate = jsonChunkMatch ? jsonChunkMatch[0] : fenced;

  try {
    const parsed = JSON.parse(candidate);
    const action = ['search', 'navigate'].includes(String(parsed?.action || '')) ? String(parsed.action) : 'chat';
    const reply = String(parsed?.reply || '').trim() || buildFallbackReply(roleKey, userText);
    const query = action === 'search'
      ? String(parsed?.query || '').trim() || fallbackQuery
      : null;
    const route = action === 'navigate'
      ? String(parsed?.route || '').trim() || fallbackRoute
      : null;

    return enforceRouteAccess({ action, query, route, reply }, roleKey);
  } catch {
    return enforceRouteAccess({
      action: fallbackAction,
      query: fallbackQuery,
      route: fallbackAction === 'navigate' ? fallbackRoute : null,
      reply: raw,
    }, roleKey);
  }
};

const resolveInvocation = (contextOrReq, maybeRes, maybeCtx) => {
  if (contextOrReq && contextOrReq.req && contextOrReq.res) {
    return {
      req: contextOrReq.req,
      res: contextOrReq.res,
      log: contextOrReq.log || console.log,
      error: contextOrReq.error || console.error,
    };
  }

  return {
    req: contextOrReq,
    res: maybeRes,
    log: maybeCtx?.log || console.log,
    error: maybeCtx?.error || console.error,
  };
};

export default async (contextOrReq, maybeRes, maybeCtx) => {
  const { req, res, log, error } = resolveInvocation(contextOrReq, maybeRes, maybeCtx);

  log('Chatbot function invoked');

  const method = String(req?.method || 'POST').toUpperCase();
  if (method !== 'POST') {
    return json(res, 405, { ok: false, message: 'Only POST requests are supported.' });
  }

  const payload = parseRequestBody(req);

  const { user_id, role, message, action, productId, vendorContext } = payload;

  if (String(action || '').trim().toLowerCase() === 'clear') {
    if (!user_id) {
      return json(res, 400, {
        ok: false,
        message: 'Required field for clear action: user_id.',
      });
    }

    try {
      const databases = createDatabasesClient();
      const deleted = await deleteUserChatMessages(databases, user_id);
      return json(res, 200, {
        ok: true,
        action: 'clear',
        deleted,
      });
    } catch (clearError) {
      const clearMessage = String(clearError?.message || 'Failed to clear chat.');
      error(`Chat clear failed: ${clearMessage}`);
      return json(res, 500, {
        ok: false,
        message: clearMessage,
      });
    }
  }

  if (!user_id || !role || !message) {
    return json(res, 400, {
      ok: false,
      message: 'Required fields: user_id, role, message.',
    });
  }

  if (!GEMINI_API_KEY) {
    return json(res, 500, {
      ok: false,
      message: 'Gemini API key not configured.',
    });
  }

  const cleanMessage = parseUserMessage(message);
  if (!cleanMessage) {
    return json(res, 400, { ok: false, message: 'Message cannot be empty.' });
  }

  const requestedProductId = String(productId || '').trim();
  const requestedVendorContext = (vendorContext && typeof vendorContext === 'object') ? vendorContext : null;
  const shouldAnalyzeVendorTrust = isVendorTrustRequest(cleanMessage);
  const shouldAnalyzeReviews = !shouldAnalyzeVendorTrust && isReviewAnalysisRequest(cleanMessage);

  const roleKey = String(role || 'Customer').trim();
  const systemPrompt = SYSTEM_PROMPTS[roleKey] || SYSTEM_PROMPTS.Customer;
  const contextNote = roleKey === 'Vendor' ? VENDOR_CONTEXT_PROMPT : roleKey === 'Admin' ? '' : CUSTOMER_CONTEXT_PROMPT;
  let fullSystemPrompt = `${systemPrompt}\n\n${contextNote}\n\n${RESPONSE_CONTRACT_PROMPT}`.trim();

  try {
    const databases = createDatabasesClient();
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const formattedHistory = await fetchUserHistoryForGemini(databases, user_id);

    let vendorTrustReport = null;
    if (shouldAnalyzeVendorTrust) {
      const target = await resolveVendorTarget(databases, cleanMessage, requestedVendorContext);

      if (target.status === 'ambiguous') {
        const options = (target.options || []).map((name, index) => `${index + 1}) ${name}`).join(' ; ');
        const clarification = `I found multiple vendor matches for "${target.hint}". Please clarify which one you mean: ${options}`;

        await writeChatTurns({
          databases,
          userId: user_id,
          roleKey,
          userText: cleanMessage,
          modelText: clarification,
          modelName: 'vendor-trust-clarification',
        });

        return json(res, 200, {
          ok: true,
          action: 'chat',
          query: null,
          route: null,
          reply: clarification,
          message: clarification,
          timestamp: new Date().toISOString(),
          role: roleKey,
        });
      }

      if (target.status === 'missing') {
        const missingReply = String(target.message || 'Please share a valid vendor username so I can compute trust metrics.');

        await writeChatTurns({
          databases,
          userId: user_id,
          roleKey,
          userText: cleanMessage,
          modelText: missingReply,
          modelName: 'vendor-trust-missing',
        });

        return json(res, 200, {
          ok: true,
          action: 'chat',
          query: null,
          route: null,
          reply: missingReply,
          message: missingReply,
          timestamp: new Date().toISOString(),
          role: roleKey,
        });
      }

      vendorTrustReport = await computeVendorTrustReport(databases, target);
      fullSystemPrompt = `${fullSystemPrompt}\n\n${VENDOR_TRUST_SYSTEM_PROMPT}\n\n${buildVendorTrustContextBlock(vendorTrustReport)}`.trim();
    }

    const reviewEntries = requestedProductId
      ? await fetchLatestReviewEntries(databases, requestedProductId, 15)
      : [];

    if (shouldAnalyzeReviews && requestedProductId) {
      fullSystemPrompt = `${fullSystemPrompt}\n\n${REVIEW_ANALYSIS_SYSTEM_PROMPT}\n\n${buildReviewContextBlock(reviewEntries)}`.trim();
    } else if (shouldAnalyzeReviews) {
      fullSystemPrompt = `${fullSystemPrompt}\n\n${REVIEW_ANALYSIS_SYSTEM_PROMPT}\n\nProduct reviews provided: none.`.trim();
    }

    const aiResult = await generateAiResponse({
      genAI,
      systemInstruction: fullSystemPrompt,
      history: formattedHistory,
      message: cleanMessage,
    });

    const parsedAssistant = parseAssistantJsonResponse(aiResult.text, cleanMessage, roleKey);
    const llmExplanation = String(parsedAssistant?.reply || '').trim();
    const finalPayload = shouldAnalyzeVendorTrust
      ? {
        action: 'chat',
        query: null,
        route: null,
        reply: buildVendorTrustDeterministicReply(vendorTrustReport, llmExplanation),
      }
      : parsedAssistant;

    await writeChatTurns({
      databases,
      userId: user_id,
      roleKey,
      userText: cleanMessage,
      modelText: finalPayload.reply,
      modelName: aiResult.modelName,
    });
    log(`Chat turns stored for user ${user_id}`);

    return json(res, 200, {
      ok: true,
      action: finalPayload.action,
      query: finalPayload.action === 'search' ? finalPayload.query : null,
      route: finalPayload.action === 'navigate' ? finalPayload.route : null,
      reply: finalPayload.reply,
      message: finalPayload.reply,
      timestamp: new Date().toISOString(),
      role: roleKey,
    });
  } catch (err) {
    const errorMessage = String(err?.message || 'Unexpected chatbot error.');

    if (isModelNotFoundError(err)) {
      log(`Gemini model unavailable. Using local fallback reply. Details: ${errorMessage}`);
      let reviewEntries = [];
      if (shouldAnalyzeReviews && requestedProductId) {
        try {
          const databasesForReviews = createDatabasesClient();
          reviewEntries = await fetchLatestReviewEntries(databasesForReviews, requestedProductId, 15);
        } catch (reviewError) {
          log(`Warning: Failed to fetch reviews for local analysis: ${reviewError?.message || reviewError}`);
        }
      }

      if (shouldAnalyzeVendorTrust) {
        let vendorTrustReport = null;

        try {
          const databasesForTrust = createDatabasesClient();
          const target = await resolveVendorTarget(databasesForTrust, cleanMessage, requestedVendorContext);

          if (target.status === 'ambiguous') {
            const options = (target.options || []).map((name, index) => `${index + 1}) ${name}`).join(' ; ');
            const clarification = `I found multiple vendor matches for "${target.hint}". Please clarify which one you mean: ${options}`;
            return json(res, 200, {
              ok: true,
              action: 'chat',
              query: null,
              route: null,
              reply: clarification,
              message: clarification,
              fallback: true,
              timestamp: new Date().toISOString(),
              role: roleKey,
            });
          }

          if (target.status === 'missing') {
            const missingReply = String(target.message || 'Please share a valid vendor username so I can compute trust metrics.');
            return json(res, 200, {
              ok: true,
              action: 'chat',
              query: null,
              route: null,
              reply: missingReply,
              message: missingReply,
              fallback: true,
              timestamp: new Date().toISOString(),
              role: roleKey,
            });
          }

          vendorTrustReport = await computeVendorTrustReport(databasesForTrust, target);
        } catch (trustError) {
          log(`Warning: Failed to fetch vendor trust data for local analysis: ${trustError?.message || trustError}`);
        }

        const fallbackMessage = buildVendorTrustDeterministicReply(vendorTrustReport);

        try {
          const databases = createDatabasesClient();
          await writeChatTurns({
            databases,
            userId: user_id,
            roleKey,
            userText: cleanMessage,
            modelText: fallbackMessage,
            modelName: 'fallback-vendor-trust',
          });
        } catch (dbError) {
          log(`Warning: Failed to store fallback vendor trust message: ${dbError?.message || dbError}`);
        }

        return json(res, 200, {
          ok: true,
          action: 'chat',
          query: null,
          route: null,
          reply: fallbackMessage,
          message: fallbackMessage,
          fallback: true,
          timestamp: new Date().toISOString(),
          role: roleKey,
        });
      }

      const fallbackMessage = shouldAnalyzeReviews
        ? buildLocalReviewAnalysisReply(reviewEntries)
        : buildFallbackReply(roleKey, cleanMessage);
      const fallbackRoute = isNavigationIntent(cleanMessage) ? resolveNavigationRoute(cleanMessage, roleKey) : null;
      const fallbackAction = fallbackRoute
        ? 'navigate'
        : (detectSearchIntent(cleanMessage) ? 'search' : 'chat');
      const fallbackQuery = fallbackAction === 'search' ? toSearchQuery(cleanMessage) : null;

      try {
        const databases = createDatabasesClient();

        await writeChatTurns({
          databases,
          userId: user_id,
          roleKey,
          userText: cleanMessage,
          modelText: fallbackMessage,
          modelName: 'fallback-local',
        });
      } catch (dbError) {
        log(`Warning: Failed to store fallback chat message: ${dbError?.message || dbError}`);
      }

      const guardedFallback = enforceRouteAccess({
        action: fallbackAction,
        query: fallbackQuery,
        route: fallbackAction === 'navigate' ? fallbackRoute : null,
        reply: fallbackMessage,
      }, roleKey);

      return json(res, 200, {
        ok: true,
        action: guardedFallback.action,
        query: guardedFallback.action === 'search' ? guardedFallback.query : null,
        route: guardedFallback.action === 'navigate' ? guardedFallback.route : null,
        reply: guardedFallback.reply,
        message: guardedFallback.reply,
        fallback: true,
        timestamp: new Date().toISOString(),
        role: roleKey,
      });
    }

    error(`Chatbot failed: ${errorMessage}`);

    return json(res, 500, {
      ok: false,
      message: errorMessage,
    });
  }
};
