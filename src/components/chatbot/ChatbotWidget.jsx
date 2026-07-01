import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Functions, Query } from 'appwrite';
import { useLocation, useMatch, useNavigate, useParams } from 'react-router-dom';
import client, { databases } from '../../lib/appwrite.js';
import { useAuth } from '../../lib/auth-context.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const CHAT_COLLECTION_ID = 'chat_messages';
const CHATBOT_FUNCTION_ID = String(import.meta.env.VITE_CHATBOT_FUNCTION_ID || '').trim();
const CHATBOT_PRODUCT_CONTEXT_KEY = 'chatbot:product-context';

const Shell = styled.div`
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 1200;
`;

const Bubble = styled.button`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  background: linear-gradient(145deg, #0f172a, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.28);
  display: grid;
  place-items: center;
  padding: 0;
`;

const BubbleIcon = styled.img`
  width: 40px;
  height: 40px;
  display: block;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
`;

const Window = styled.section`
  width: min(92vw, 370px);
  height: min(72vh, 520px);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.25);
  border: 1px solid #dbe2ee;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.header`
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, #f8fafc, #eef2ff);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
`;

const RoleTag = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  background: #dbeafe;
  border-radius: 999px;
  padding: 3px 9px;
`;

const ClearButton = styled.button`
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 9px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f8fafc;
`;

const Message = styled.div`
  margin: 0 0 10px;
  display: flex;
  justify-content: ${(props) => (props.$mine ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.div`
  max-width: 83%;
  border-radius: 14px;
  padding: 9px 11px;
  line-height: 1.38;
  font-size: 14px;
  white-space: pre-wrap;
  background: ${(props) => (props.$mine ? '#1d4ed8' : '#ffffff')};
  color: ${(props) => (props.$mine ? '#ffffff' : '#0f172a')};
  border: ${(props) => (props.$mine ? 'none' : '1px solid #e2e8f0')};
`;

const Composer = styled.form`
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
`;

const Input = styled.textarea`
  flex: 1;
  resize: none;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  min-height: 44px;
  max-height: 120px;
  padding: 9px 10px;
  font-family: inherit;
  font-size: 14px;
`;

const Send = styled.button`
  border: 0;
  border-radius: 10px;
  min-width: 78px;
  padding: 0 12px;
  font-weight: 700;
  color: #ffffff;
  background: #0f172a;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.55 : 1)};
`;

const Note = styled.p`
  margin: 0;
  padding: 8px 12px 0;
  font-size: 12px;
  color: #64748b;
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px 10px;
`;

const QuickActionButton = styled.button`
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};

  &:hover {
    border-color: #93c5fd;
    background: #eff6ff;
  }
`;

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'vendor') return 'Vendor';
  if (value === 'admin') return 'Admin';
  return 'Customer';
};

const QUICK_ACTIONS_BY_ROLE = {
  Customer: [
    { label: 'Product search', prompt: 'Help me find the best products in this store for my needs.' },
    { label: 'Track order', prompt: 'How can I track my order status step by step?' },
    { label: 'Auction help', prompt: 'Explain how bidding and auction timing work in simple steps.' },
    { label: 'Complaint', prompt: 'I need help creating a complaint about an order or product issue.' },
  ],
  Vendor: [
    { label: 'Listing help', prompt: 'Help me create better product listings for higher conversions.' },
    { label: 'Auction setup', prompt: 'How do I set up and schedule an auction listing correctly?' },
    { label: 'Order handling', prompt: 'Give me a checklist to process and ship orders faster.' },
    { label: 'Complaint response', prompt: 'How should I respond to customer complaints professionally?' },
  ],
  Admin: [
    { label: 'User issue', prompt: 'Guide me to handle a user account issue as admin.' },
    { label: 'Complaint workflow', prompt: 'What is the best workflow to resolve complaints quickly?' },
    { label: 'Auction policy', prompt: 'What checks should admins do for auction policy enforcement?' },
    { label: 'Escalation path', prompt: 'Provide an escalation path for critical marketplace incidents.' },
  ],
};

const parseExecutionPayload = (execution) => {
  const statusCode = Number(execution?.responseStatusCode || 0);
  const body = String(execution?.responseBody || '').trim();
  const statusText = String(execution?.status || '').trim();

  if (!body) {
    if (statusCode >= 400) {
      return {
        action: 'chat',
        query: null,
        route: null,
        reply: `Chatbot request failed (${statusCode}).`,
      };
    }
    if (statusText && statusText.toLowerCase() !== 'completed') {
      return {
        action: 'chat',
        query: null,
        route: null,
        reply: `Chatbot execution status: ${statusText}.`,
      };
    }
    return {
      action: 'chat',
      query: null,
      route: null,
      reply: '',
    };
  }

  try {
    const parsed = JSON.parse(body);
    if (parsed?.ok === false) {
      return {
        action: 'chat',
        query: null,
        route: null,
        reply: String(parsed?.message || 'Chatbot function returned an error.').trim(),
      };
    }

    const action = ['search', 'navigate'].includes(String(parsed?.action || '')) ? String(parsed.action) : 'chat';
    const query = action === 'search' ? String(parsed?.query || '').trim() : '';
    const route = action === 'navigate' ? String(parsed?.route || '').trim() : '';
    const reply = String(parsed?.reply || parsed?.message || '').trim() || 'Sorry, I could not generate a response.';

    return {
      action,
      query: query || null,
      route: route || null,
      reply,
    };
  } catch {
    return {
      action: 'chat',
      query: null,
      route: null,
      reply: body,
    };
  }
};

const toHistoryPayload = (messages) => {
  return messages.slice(-12).map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    content: msg.text,
  }));
};

const readProductVendorContext = (productId) => {
  if (!productId) {
    return null;
  }

  const rawValue = sessionStorage.getItem(CHATBOT_PRODUCT_CONTEXT_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const storedProductId = String(parsed?.productId || '').trim();
    if (!storedProductId || storedProductId !== String(productId).trim()) {
      return null;
    }

    const vendorId = String(parsed?.vendorId || '').trim();
    if (!vendorId) {
      return null;
    }

    return {
      vendorId,
      vendorName: String(parsed?.vendorName || '').trim() || null,
      vendorUsername: String(parsed?.vendorUsername || '').trim() || null,
    };
  } catch {
    return null;
  }
};

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const productMatch = useMatch('/product/:productId');
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const listRef = useRef(null);
  const previousUserIdRef = useRef('');

  const resolvedRole = useMemo(() => normalizeRole(role || user?.prefs?.role), [role, user]);
  const userId = String(user?.$id || '').trim();
  const routeProductId = String(params?.productId || productMatch?.params?.productId || '').trim();
  const pathProductId = useMemo(() => {
    const match = String(location?.pathname || '').match(/^\/product\/([^/]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }, [location?.pathname]);
  const productIdContext = String(routeProductId || pathProductId || '').trim();
  const vendorContext = useMemo(() => readProductVendorContext(productIdContext), [productIdContext]);
  const quickActions = QUICK_ACTIONS_BY_ROLE[resolvedRole] || QUICK_ACTIONS_BY_ROLE.Customer;

  const runFunction = async (payload) => {
    const functions = new Functions(client);
    return functions.createExecution(CHATBOT_FUNCTION_ID, JSON.stringify(payload), false);
  };

  const clearChatServerSide = useCallback(async (targetUserId) => {
    const normalizedUserId = String(targetUserId || '').trim();
    if (!normalizedUserId || !CHATBOT_FUNCTION_ID) {
      return;
    }

    await runFunction({
      action: 'clear',
      user_id: normalizedUserId,
    });
  }, []);

  const handleClearChat = async () => {
    if (!userId || busy) {
      return;
    }

    setBusy(true);
    try {
      await clearChatServerSide(userId);
      setMessages([]);
      setInput('');
      setBootstrapped(true);
    } catch (err) {
      const fallback = String(err?.message || 'Failed to clear chat.').trim();
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, sender: 'bot', text: fallback }]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;

    if (previousUserId === userId) {
      return;
    }

    if (!userId) {
      sessionStorage.setItem('chatbot:clear-on-next-login', '1');
    }

    previousUserIdRef.current = userId;
    setMessages([]);
    setInput('');
    setBusy(false);
    setBootstrapped(false);
  }, [clearChatServerSide, userId]);

  useEffect(() => {
    const shouldClearOnLogin = sessionStorage.getItem('chatbot:clear-on-next-login') === '1';
    if (!userId || !shouldClearOnLogin) {
      return;
    }

    const clearOnLogin = async () => {
      try {
        await clearChatServerSide(userId);
      } catch (err) {
        console.error('Failed to auto-clear chat on relogin:', err);
      } finally {
        sessionStorage.removeItem('chatbot:clear-on-next-login');
        setMessages([]);
        setBootstrapped(false);
      }
    };

    clearOnLogin();
  }, [clearChatServerSide, userId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!userId || !open || bootstrapped) {
        return;
      }

      try {
        const response = await databases.listDocuments(DATABASE_ID, CHAT_COLLECTION_ID, [
          Query.equal('user_id', [userId]),
          Query.orderAsc('timestamp'),
          Query.limit(50),
        ]);

        const history = (response?.documents || []).flatMap((doc) => {
          const message = String(doc?.message || '').trim();
          const sender = String(doc?.sender || '').trim().toLowerCase();

          if (message) {
            return [{
              id: doc.$id,
              sender: sender === 'model' || sender === 'bot' || sender === 'assistant' ? 'bot' : 'user',
              text: message,
            }];
          }

          const legacyUserMessage = String(doc?.user_message || '').trim();
          const legacyBotMessage = String(doc?.ai_response || '').trim();
          const legacyList = [];

          if (legacyUserMessage) {
            legacyList.push({ id: `${doc.$id}-u`, sender: 'user', text: legacyUserMessage });
          }
          if (legacyBotMessage) {
            legacyList.push({ id: `${doc.$id}-a`, sender: 'bot', text: legacyBotMessage });
          }

          return legacyList;
        });

        setMessages(history);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setBootstrapped(true);
      }
    };

    loadHistory();
  }, [bootstrapped, open, userId]);

  const sendMessageText = async (text) => {
    if (!userId || !CHATBOT_FUNCTION_ID || busy) {
      return;
    }

    const normalizedText = String(text || '').trim();
    if (!normalizedText) {
      return;
    }

    const userMessage = { id: `u-${Date.now()}`, sender: 'user', text: normalizedText };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setBusy(true);

    try {
      const execution = await runFunction({
        user_id: userId,
        role: resolvedRole,
        message: normalizedText,
        productId: productIdContext || null,
        vendorContext: vendorContext || null,
        history: toHistoryPayload(messages),
      });

      const payload = parseExecutionPayload(execution);
      const answerText = String(payload?.reply || '').trim() || 'Sorry, I could not generate a response.';
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, sender: 'bot', text: answerText }]);

      if (payload?.action === 'search' && payload?.query) {
        navigate(`/search?q=${encodeURIComponent(payload.query)}`);
      } else if (payload?.action === 'navigate' && payload?.route) {
        navigate(payload.route);
      }
    } catch (err) {
      const fallback = String(err?.message || 'Failed to contact chatbot service.').trim();
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, sender: 'bot', text: fallback }]);
    } finally {
      setBusy(false);
    }
  };

  const onSend = async (event) => {
    event.preventDefault();
    await sendMessageText(input);
  };

  if (!userId) {
    return null;
  }

  return (
    <Shell>
      {open ? (
        <Window aria-label="Chatbot assistant">
          <Header>
            <Title>Marketplace Assistant</Title>
            <HeaderActions>
              <ClearButton type="button" onClick={handleClearChat} disabled={busy || !CHATBOT_FUNCTION_ID}>
                Clear chat
              </ClearButton>
              <RoleTag>{resolvedRole}</RoleTag>
            </HeaderActions>
          </Header>

          <Note>
            Ask about products, orders, auctions, or complaints.
          </Note>

          <QuickActions>
            {quickActions.map((action) => (
              <QuickActionButton
                key={action.label}
                type="button"
                disabled={busy || !CHATBOT_FUNCTION_ID}
                onClick={() => sendMessageText(action.prompt)}
              >
                {action.label}
              </QuickActionButton>
            ))}
          </QuickActions>

          <MessageList ref={listRef}>
            {messages.map((message) => (
              <Message key={message.id} $mine={message.sender === 'user'}>
                <MessageBubble $mine={message.sender === 'user'}>{message.text}</MessageBubble>
              </Message>
            ))}
          </MessageList>

          <Composer onSubmit={onSend}>
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your message..."
              disabled={busy || !CHATBOT_FUNCTION_ID}
            />
            <Send type="submit" disabled={busy || !input.trim() || !CHATBOT_FUNCTION_ID}>
              {busy ? '...' : 'Send'}
            </Send>
          </Composer>
        </Window>
      ) : null}

      <Bubble type="button" aria-label="Open chatbot" onClick={() => setOpen((prev) => !prev)}>
        <BubbleIcon src="/images/chatbot-icon.svg" alt="Chatbot" />
      </Bubble>
    </Shell>
  );
};

export default ChatbotWidget;
