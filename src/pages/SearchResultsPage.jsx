import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Query } from 'appwrite';
import { useLocation, useNavigate } from 'react-router-dom';
import HeaderComponent from '../components/homepage-component/HeaderComponent.jsx';
import ProductSearchBar from '../components/category-products/ProductSearchBar.jsx';
import ProductCard from '../components/category-products/ProductCard.jsx';
import { useAuth } from '../lib/auth-context.js';
import { databases, logout } from '../lib/appwrite.js';
import { addToCartItem, getCartCount } from '../lib/cart.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';

const PageShell = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
`;

const Main = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 34px;
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 6px 0 14px;
  color: #64748b;
`;

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Empty = styled.div`
  margin-top: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  color: #64748b;
  padding: 16px;
`;

const normalize = (value) => String(value || '').trim().toLowerCase();
    
const STOP_TOKENS = new Set([
  'i', 'me', 'my', 'want', 'wanna', 'to', 'buy', 'find', 'search', 'show', 'help', 'please',
  'need', 'looking', 'for', 'a', 'an', 'the', 'some', 'any', 'product', 'products',
]);

const SYNONYMS = {
  clothing: ['fashion', 'apparels', 'clothes'],
  clothes: ['fashion', 'apparels', 'clothing'],
  cloths: ['fashion', 'apparels', 'clothes'],
  apparel: ['fashion', 'apparels', 'clothing'],
  apparels: ['fashion', 'apparels', 'clothing'],
  outfit: ['fashion', 'apparels', 'clothing'],
  outfits: ['fashion', 'apparels', 'clothing'],
  sneakers: ['shoes'],
  trainers: ['shoes'],
  cellphone: ['phone'],
  mobile: ['phone'],
};

const normalizeText = (value) => {
  return normalize(value)
    .replace(/\byoga\s*ma\b/g, 'yoga mat')
    .replace(/\bcloths\b/g, 'clothes')
    .replace(/\bi\s*want\s*to\s*but\b/g, 'i want to buy')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toSearchTokens = (query) => {
  const baseTokens = normalizeText(query)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !STOP_TOKENS.has(token));

  const expanded = baseTokens.flatMap((token) => {
    const related = SYNONYMS[token] || [];
    return [token, ...related];
  });

  return Array.from(new Set(expanded));
};

const fetchAllProducts = async () => {
  const docs = [];
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

    docs.push(...batch);

    if (batch.length < 100) {
      break;
    }

    cursor = batch[batch.length - 1].$id;
  }

  return docs;
};

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, setUser, setRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [buyingProductId, setBuyingProductId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    setSearchQuery(String(params.get('q') || '').trim());
  }, [location.search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const docs = await fetchAllProducts();
        const mapped = docs
          .filter((doc) => String(doc?.list_type || '').toLowerCase() !== 'auction')
          .map((doc) => ({
            id: doc.$id,
            name: String(doc?.name || 'Untitled Product'),
            category: String(doc?.category || 'Category'),
            description: String(doc?.description || ''),
            image_url: String(doc?.imageUrl || doc?.image_url || ''),
            price: Number(doc?.price || 0),
            stock: Number(doc?.stock || 0),
            total_reviews: 0,
            average_rating: 0,
          }));

        setAllProducts(mapped);
      } catch (err) {
        console.error('Failed to load search results:', err);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const refreshCartCount = () => setCartCount(getCartCount(user?.$id || ''));

    refreshCartCount();
    window.addEventListener('cart-updated', refreshCartCount);
    window.addEventListener('storage', refreshCartCount);

    return () => {
      window.removeEventListener('cart-updated', refreshCartCount);
      window.removeEventListener('storage', refreshCartCount);
    };
  }, [user?.$id]);

  const filteredProducts = useMemo(() => {
    const tokens = toSearchTokens(searchQuery);
    if (!tokens.length) {
      return allProducts;
    }

    return allProducts.filter((product) => {
      const haystack = [product.name, product.category, product.description]
        .map((value) => normalizeText(value))
        .join(' ');

      return tokens.some((token) => haystack.includes(token));
    });
  }, [allProducts, searchQuery]);

  const handleBuy = async (product) => {
    const productId = String(product?.id || '').trim();
    const userId = user?.$id;

    if (!productId || !userId) {
      navigate('/login');
      return;
    }

    setBuyingProductId(productId);
    try {
      addToCartItem(userId, productId, 1);
      navigate('/cart');
    } finally {
      setBuyingProductId('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole(null);
    navigate('/login');
  };

  return (
    <PageShell>
      <HeaderComponent
        userEmail={user?.email || user?.name || 'Account'}
        profilePath={role === 'Vendor' ? '/vendor-profile' : '/profile'}
        cartPath="/cart"
        cartCount={cartCount}
        onLogout={handleLogout}
      />

      <Main>
        <Title>Search Results</Title>
        <Subtitle>
          {searchQuery ? `Showing products for "${searchQuery}"` : 'Browse products'}
        </Subtitle>

        <ProductSearchBar
          searchQuery={searchQuery}
          onSearchQueryChange={(value) => setSearchQuery(value)}
        />

        {loading ? (
          <Empty>Loading products...</Empty>
        ) : filteredProducts.length ? (
          <Grid>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={handleBuy}
                buyBusy={buyingProductId === product.id}
              />
            ))}
          </Grid>
        ) : (
          <Empty>No products matched your search.</Empty>
        )}
      </Main>
    </PageShell>
  );
};

export default SearchResultsPage;
