import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { Query } from 'appwrite';
import HeaderComponent from '../components/homepage-component/HeaderComponent.jsx';
import CartItemCard from '../components/homepage-component/CartItemCard.jsx';
import CartSummaryCard from '../components/homepage-component/CartSummaryCard.jsx';
import { useAuth } from '../lib/auth-context.js';
import { logout, databases } from '../lib/appwrite.js';
import { getCartCount, getCartItems, removeCartItem, setCartItemQuantity } from '../lib/cart.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';

const PageShell = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
`;

const Main = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px 32px;
`;

const Title = styled.h1`
  margin: 0;
  color: #0f172a;
  font-size: 42px;
  font-weight: 800;
`;

const Subtitle = styled.p`
  margin: 4px 0 18px;
  color: #475569;
`;

const Warning = styled.div`
  border: 1px solid #f5d88e;
  background: #fff9e9;
  color: #8a5b00;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  margin-bottom: 14px;
`;

const Grid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EmptyCard = styled.div`
  border: 1px dashed #c7ced9;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  color: #64748b;
`;

const ContinueLink = styled(Link)`
  display: inline-block;
  margin-top: 16px;
  color: #4338ca;
  text-decoration: none;
  font-weight: 700;
`;

const chunkArray = (list, size) => {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
};

const AddToCartPage = () => {
  const navigate = useNavigate();
  const { user, role, setUser, setRole } = useAuth();

  const [cartEntries, setCartEntries] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);

  const profilePath = role === 'Vendor' ? '/vendor-profile' : '/profile';
  const userId = user?.$id || '';

  const refreshCartEntries = () => {
    setCartEntries(getCartItems(userId));
  };

  useEffect(() => {
    refreshCartEntries();
  }, [userId]);

  useEffect(() => {
    const onCartUpdated = () => refreshCartEntries();
    window.addEventListener('cart-updated', onCartUpdated);
    window.addEventListener('storage', onCartUpdated);

    return () => {
      window.removeEventListener('cart-updated', onCartUpdated);
      window.removeEventListener('storage', onCartUpdated);
    };
  }, [userId]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!cartEntries.length) {
        setProductMap({});
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const productIds = [...new Set(cartEntries.map((item) => item.productId).filter(Boolean))];
        const chunks = chunkArray(productIds, 100);
        const allDocs = [];

        for (const idsChunk of chunks) {
          const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
            Query.equal('$id', idsChunk),
            Query.limit(100),
          ]);

          allDocs.push(...(response?.documents || []));
        }

        const nextProductMap = allDocs.reduce((acc, doc) => {
          acc[doc.$id] = doc;
          return acc;
        }, {});

        setProductMap(nextProductMap);
      } catch (error) {
        console.error('Unable to load cart products:', error);
        setProductMap({});
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [cartEntries]);

  const cartItems = useMemo(() => {
    return cartEntries
      .map((entry) => {
        const product = productMap[entry.productId];
        if (!product) {
          return null;
        }

        const price = Number(product?.price || 0);
        const quantity = Math.max(1, Number(entry?.quantity || 1));

        return {
          id: product.$id,
          productId: product.$id,
          name: String(product?.name || 'Product'),
          category: String(product?.category || 'Category'),
          imageUrl: String(product?.imageUrl || product?.image_url || ''),
          stock: Number(product?.stock || 0),
          quantity,
          price,
          lineTotal: price * quantity,
        };
      })
      .filter(Boolean);
  }, [cartEntries, productMap]);

  const cartCount = useMemo(() => getCartCount(userId), [userId, cartEntries]);
  const hasOutOfStockItems = useMemo(() => cartItems.some((item) => Number(item.stock || 0) <= 0), [cartItems]);
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0), [cartItems]);
  const shipping = 0;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole(null);
    navigate('/login');
  };

  const handleIncrease = (item) => {
    const maxStock = Number(item?.stock || 0);
    const nextQty = Number(item?.quantity || 1) + 1;

    if (maxStock > 0 && nextQty > maxStock) {
      return;
    }

    setCartItemQuantity(userId, item.productId, nextQty);
    refreshCartEntries();
  };

  const handleDecrease = (item) => {
    const nextQty = Number(item?.quantity || 1) - 1;
    setCartItemQuantity(userId, item.productId, nextQty);
    refreshCartEntries();
  };

  const handleRemove = (item) => {
    removeCartItem(userId, item.productId);
    refreshCartEntries();
  };

  return (
    <PageShell>
      <HeaderComponent
        userEmail={user?.email || user?.name || 'Account'}
        profilePath={profilePath}
        cartPath="/cart"
        cartCount={cartCount}
        onLogout={handleLogout}
      />

      <Main>
        <Title>Shopping Cart</Title>
        <Subtitle>Review your items and checkout</Subtitle>

        {hasOutOfStockItems ? (
          <Warning>Some items are out of stock. Remove them to continue checkout.</Warning>
        ) : null}

        <Grid>
          <List>
            {loading ? (
              <EmptyCard>Loading cart items...</EmptyCard>
            ) : cartItems.length ? (
              cartItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={handleRemove}
                />
              ))
            ) : (
              <EmptyCard>
                Your cart is empty.
                <ContinueLink to="/store-home">Continue Shopping</ContinueLink>
              </EmptyCard>
            )}

            {cartItems.length ? <ContinueLink to="/store-home">Continue Shopping</ContinueLink> : null}
          </List>

          <CartSummaryCard
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
            disableCheckout={!cartItems.length || hasOutOfStockItems}
            onCheckout={() => navigate('/checkout')}
          />
        </Grid>
      </Main>
    </PageShell>
  );
};

export default AddToCartPage;
