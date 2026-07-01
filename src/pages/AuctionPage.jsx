import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Query } from 'appwrite';
import HeaderComponent from '../components/homepage-component/HeaderComponent.jsx';
import { logout, databases, realtime } from '../lib/appwrite.js';
import { useAuth } from '../lib/auth-context.js';
import { getCartCount } from '../lib/cart.js';
import AuctionGrid from '../components/auction-components/AuctionGrid.jsx';
import BidModal from '../components/auction-components/BidModal.jsx';
import '../styling/auction-styling/AuctionPage.css';

const DATABASE_ID = '69c1cfaf003a710f1232';
const AUCTIONS_COLLECTION_ID = 'auctions';
const PRODUCTS_COLLECTION_ID = 'products';

const FALLBACK_PRODUCT_IMAGE = 'https://via.placeholder.com/1200x900?text=No+Image';

const chunkArray = (list, size) => {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
};

const toString = (value, fallback = '') => String(value ?? fallback).trim();

const resolveProductImage = (doc = {}) => {
  const candidates = [
    doc.imageUrl,
    doc.image_url,
    doc.image,
    doc.thumbnail,
    doc.mainImage,
  ];

  const first = candidates.map((entry) => toString(entry)).find(Boolean);
  return first || FALLBACK_PRODUCT_IMAGE;
};

const fetchAllDocuments = async (collectionId, baseQueries = []) => {
  const documents = [];
  let cursor = null;

  while (true) {
    const queries = [...baseQueries, Query.limit(100)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    const batch = response?.documents || [];

    if (!batch.length) {
      break;
    }

    documents.push(...batch);

    if (batch.length < 100) {
      break;
    }

    cursor = batch[batch.length - 1].$id;
  }

  return documents;
};

const buildAuctionItems = async (auctionDocs = []) => {
  const productIds = [...new Set(auctionDocs.map((doc) => toString(doc?.product_id)).filter(Boolean))];

  if (!productIds.length) {
    return auctionDocs.map((auction) => ({
      id: auction.$id,
      auction,
      product: null,
    }));
  }

  const chunks = chunkArray(productIds, 100);
  const productDocs = [];

  for (const idsChunk of chunks) {
    const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
      Query.equal('$id', idsChunk),
      Query.limit(100),
    ]);

    productDocs.push(...(response?.documents || []));
  }

  const productMap = productDocs.reduce((acc, doc) => {
    acc[doc.$id] = {
      ...doc,
      imageResolved: resolveProductImage(doc),
      nameResolved: toString(doc?.name || doc?.title || doc?.product_name || ''),
      descriptionResolved: toString(doc?.description || doc?.desc || ''),
    };
    return acc;
  }, {});

  return auctionDocs.map((auction) => {
    const productId = toString(auction?.product_id);

    return {
      id: auction.$id,
      auction,
      product: productMap[productId] || null,
    };
  });
};

const AuctionPage = () => {
  const navigate = useNavigate();
  const { user, role, setUser, setRole } = useAuth();

  const [cartCount, setCartCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeBidItem, setActiveBidItem] = useState(null);
  const [toast, setToast] = useState('');

  const refreshTimerRef = useRef(null);

  const profilePath = role === 'Vendor' ? '/vendor-profile' : '/profile';

  const loadAuctions = async () => {
    setError('');

    try {
      const auctionDocs = await fetchAllDocuments(AUCTIONS_COLLECTION_ID, [
        Query.equal('status', ['active', 'upcoming']),
        Query.orderAsc('end_time'),
      ]);

      const merged = await buildAuctionItems(auctionDocs);
      setItems(merged);
    } catch (fetchError) {
      console.error('Failed to load auctions:', fetchError);
      setItems([]);
      setError('Unable to load live auctions right now.');
    }
  };


  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) {
        return;
      }

      setLoading(true);
      await loadAuctions();
      if (mounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const refreshCartCount = () => {
      setCartCount(getCartCount(user?.$id || ''));
    };

    refreshCartCount();
    window.addEventListener('cart-updated', refreshCartCount);
    window.addEventListener('storage', refreshCartCount);

    return () => {
      window.removeEventListener('cart-updated', refreshCartCount);
      window.removeEventListener('storage', refreshCartCount);
    };
  }, [user?.$id]);

  useEffect(() => {
    const channel = `databases.${DATABASE_ID}.collections.${AUCTIONS_COLLECTION_ID}.documents`;

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        loadAuctions();
      }, 250);
    };

    const subscription = realtime.subscribe(channel, scheduleRefresh);

    return () => {
      if (typeof subscription === 'function') {
        subscription();
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user?.$id]);

  useEffect(() => {
    const pollTimer = setInterval(() => {
      loadAuctions();
    }, 8000);

    return () => clearInterval(pollTimer);
  }, [user?.$id]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole(null);
    navigate('/login');
  };

  return (
    <div className="auction-page">
      <HeaderComponent
        userEmail={user?.email || user?.name || 'Account'}
        profilePath={profilePath}
        cartPath="/cart"
        cartCount={cartCount}
        onLogout={handleLogout}
      />

      <main className="auction-page__main">
        <div className="auction-page__header">
          <div>
            <h1 className="auction-page__title">Auctions & Bids</h1>
            <p className="auction-page__subtitle">Participate in live auctions and place your bids</p>
          </div>
        </div>

        {error && <div className="auction-page__error">{error}</div>}

        <AuctionGrid
          items={items}
          loading={loading}
          onPlaceBid={(item) => setActiveBidItem(item)}
        />
      </main>

      <BidModal
        open={Boolean(activeBidItem)}
        item={activeBidItem}
        onClose={() => setActiveBidItem(null)}
        onSuccess={async () => {
          await loadAuctions();
          setToast('Bid placed successfully.');
          setActiveBidItem(null);
        }}
      />

      {toast && <div className="auction-page__toast">{toast}</div>}
    </div>
  );
};

export default AuctionPage;
