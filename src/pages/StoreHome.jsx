import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../lib/appwrite.js';
import { useAuth } from '../lib/auth-context.js';
import HeaderComponent from '../components/homepage-component/HeaderComponent';
import HeroSection from '../components/homepage-component/HeroSection';
import AllCategoriesSection from '../components/homepage-component/AllCategoriesSection';
import StoreHomeLayout from '../components/homepage-component/StoreHomeLayout.jsx';
import useStoreHomeCategories from '../components/homepage-component/useStoreHomeCategories.js';
import useCategorySearch from '../components/homepage-component/useCategorySearch.js';
import { getCartCount } from '../lib/cart.js';
import { useEffect, useState } from 'react';

const StoreHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, setUser, setRole } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const {
    searchQuery,
    handleSearchChange,
    handleSearchSubmit,
  } = useCategorySearch('');
  const {
    loading,
    popularCategories,
    allCategories,
  } = useStoreHomeCategories(searchQuery);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const q = String(params.get('q') || '').trim();
    if (q) {
      handleSearchChange(q);
    }
  }, [location.search, handleSearchChange]);

  return (
    <StoreHomeLayout
      header={(
        <HeaderComponent
          userEmail={user?.email || user?.name || 'Account'}
          profilePath={role === 'Vendor' ? '/vendor-profile' : '/profile'}
          cartPath="/cart"
          cartCount={cartCount}
          onLogout={handleLogout}
        />
      )}
    >
      <HeroSection
        popularCategories={popularCategories}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      {!loading && (
        <AllCategoriesSection allCategories={allCategories} />
      )}
    </StoreHomeLayout>
  );
};

export default StoreHome;
