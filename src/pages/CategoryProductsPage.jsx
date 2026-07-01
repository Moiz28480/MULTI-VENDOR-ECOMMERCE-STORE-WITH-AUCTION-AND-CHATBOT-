import styled from 'styled-components';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logout } from '../lib/appwrite.js';
import { useAuth } from '../lib/auth-context.js';
import HeaderComponent from '../components/homepage-component/HeaderComponent.jsx';
import HeaderBanner from '../components/category-products/HeaderBanner.jsx';
import ProductSearchBar from '../components/category-products/ProductSearchBar.jsx';
import ProductGrid from '../components/category-products/ProductGrid.jsx';
import { useEffect } from 'react';
import { getCartCount } from '../lib/cart.js';

const PageShell = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
`;

const ContentContainer = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 22px 20px 32px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const CategoryProductsPage = () => {
  const navigate = useNavigate();
  const { user, role, setUser, setRole } = useAuth();
  const { categoryName = '' } = useParams();
  const normalizedCategory = decodeURIComponent(categoryName);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole(null);
    navigate('/login');
  };

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

  return (
    <PageShell>
      <HeaderComponent
        userEmail={user?.email || user?.name || 'Account'}
        profilePath={role === 'Vendor' ? '/vendor-profile' : '/profile'}
        cartPath="/cart"
        cartCount={cartCount}
        onLogout={handleLogout}
      />

      <ContentContainer>
        <HeaderBanner categoryName={normalizedCategory} />
        <ProductSearchBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
        <ProductGrid
          categoryName={normalizedCategory}
          searchQuery={searchQuery}
        />
      </ContentContainer>
    </PageShell>
  );
};

export default CategoryProductsPage;
