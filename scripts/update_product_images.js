import { Client, Databases, Query } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const PRODUCTS_COLLECTION_ID = 'products';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'set', 'kit', 'pro', 'premium', 'official',
  'digital', 'smart', 'inch', 'pack', 'pk', 'ct', 'plus', 'ultra', 'new',
  'x', 'hd'
]);

const CATEGORY_HINTS = {
  'sports and fitness': ['fitness equipment', 'workout gear'],
  'books and media': ['book cover', 'books'],
  'baby and kids': ['baby products', 'kids toys'],
  'beauty and personal care': ['beauty product', 'skincare'],
  'health and wellness': ['health product', 'wellness'],
  gaming: ['gaming accessory', 'computer gaming'],
  automotive: ['car accessory', 'auto tool'],
  'pet supplies': ['pet accessory', 'pet product'],
  'musical instruments': ['musical instrument'],
  'art and craft': ['art supplies', 'craft tools'],
  'kitchen and dinning': ['kitchen appliance', 'cookware'],
  'kitchen and dining': ['kitchen appliance', 'cookware'],
  'watch and jewellery': ['wrist watch', 'jewelry'],
  'watches and jewelry': ['wrist watch', 'jewelry'],
  electronics: ['electronics device'],
  fashion: ['fashion accessory'],
  grocery: ['grocery item', 'food product'],
  groceries: ['grocery item', 'food product'],
  'home decor': ['home decor item']
};

const MANUAL_HINTS = {
  mouse: ['computer mouse'],
  keyboard: ['computer keyboard'],
  gpu: ['graphics card'],
  monitor: ['computer monitor'],
  charger: ['phone charger'],
  earbuds: ['wireless earbuds'],
  sleeve: ['laptop sleeve'],
  scarf: ['fashion scarf'],
  kurta: ['kurta clothing'],
  onesie: ['baby onesie'],
  tricycle: ['kids tricycle'],
  lipstick: ['lipstick product'],
  serum: ['face serum bottle'],
  cleanser: ['facial cleanser device'],
  diffuser: ['aromatherapy diffuser'],
  dash: ['dash cam'],
  inflator: ['tire inflator'],
  frother: ['milk frother'],
  chronograph: ['wrist watch chronograph'],
  cah: ['fashion accessory']
};

const normalize = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toKeywords = (value) => normalize(value)
  .split(' ')
  .filter(Boolean)
  .filter((token) => token.length > 2)
  .filter((token) => !STOP_WORDS.has(token))
  .slice(0, 6);

const unique = (list) => {
  const seen = new Set();
  const result = [];

  for (const item of list) {
    const trimmed = String(item || '').trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
};

const buildQueries = (product) => {
  const name = String(product?.name || '').trim();
  const category = normalize(product?.category);
  const nameKeywords = toKeywords(name);
  const nameText = nameKeywords.join(' ');
  const hints = CATEGORY_HINTS[category] || [];

  const manual = [];
  for (const [needle, values] of Object.entries(MANUAL_HINTS)) {
    if (nameText.includes(needle)) {
      manual.push(...values);
    }
  }

  return unique([
    ...manual,
    nameText,
    `${nameText} product`,
    ...hints.map((hint) => `${nameText} ${hint}`),
    ...hints,
    `${category} product`
  ]);
};

const scoreResult = (productKeywords, result) => {
  const haystack = normalize([
    result?.description,
    result?.alt_description,
    result?.slug,
    result?.tags?.map((tag) => tag?.title || '').join(' ')
  ].join(' '));

  let score = 0;
  for (const token of productKeywords) {
    if (haystack.includes(token)) {
      score += 2;
    }
  }

  if (!result?.premium && !result?.plus) {
    score += 2;
  }

  const regular = String(result?.urls?.regular || '');
  if (regular.includes('images.unsplash.com')) {
    score += 2;
  }

  return score;
};

const searchUnsplash = async (query) => {
  const params = new URLSearchParams({
    query,
    per_page: '30',
    page: '1',
    orientation: 'landscape'
  });

  const response = await fetch(`https://unsplash.com/napi/search/photos?${params.toString()}`);
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
};

const buildFinalImageUrl = (result) => {
  const regular = String(result?.urls?.regular || '').trim();
  if (!regular) {
    return '';
  }

  return `${regular}&w=1200&h=800&fit=crop`;
};

const resolveImageForProduct = async (product) => {
  const queries = buildQueries(product);
  const productKeywords = toKeywords(`${product?.name || ''} ${product?.category || ''}`);

  for (const query of queries) {
    const results = await searchUnsplash(query);
    if (!results.length) {
      continue;
    }

    const best = results
      .map((result) => ({ result, score: scoreResult(productKeywords, result) }))
      .sort((a, b) => b.score - a.score)[0]?.result;

    const imageUrl = buildFinalImageUrl(best);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return '';
};

const fetchAllProducts = async () => {
  const all = [];
  let cursor = null;

  while (true) {
    const queries = [Query.limit(100)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, queries);
    const batch = response?.documents || [];

    if (!batch.length) {
      break;
    }

    all.push(...batch);

    if (batch.length < 100) {
      break;
    }

    cursor = batch[batch.length - 1].$id;
  }

  return all;
};

async function updateProductImages() {
  try {
    const products = await fetchAllProducts();
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`Starting image update for ${products.length} products...`);

    for (const product of products) {
      try {
        const imageUrl = await resolveImageForProduct(product);

        if (!imageUrl) {
          skippedCount += 1;
          console.log(`Skipped (no match): ${product.name}`);
          continue;
        }

        await databases.updateDocument(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          product.$id,
          { imageUrl }
        );

        successCount += 1;
        console.log(`Updated: ${product.name}`);
      } catch (error) {
        errorCount += 1;
        console.error(`Failed: ${product.name}: ${error?.message || error}`);
      }
    }

    console.log('============================================');
    console.log(`Successfully updated: ${successCount}/${products.length}`);
    if (skippedCount > 0) {
      console.log(`Skipped: ${skippedCount}`);
    }
    if (errorCount > 0) {
      console.log(`Failed updates: ${errorCount}`);
    }
    console.log('============================================');
  } catch (error) {
    console.error('Fatal error:', error?.message || error);
    process.exit(1);
  }
}

updateProductImages();
