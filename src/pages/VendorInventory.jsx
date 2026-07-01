import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../lib/appwrite.js';
import { useAuth } from '../lib/auth-context.js';
import useVendorDashboardPageData from '../components/vendor-dashboard-components/useVendorDashboardPageData.js';
import VendorInventoryContent from '../components/vendor-dashboard-components/VendorInventoryContent.jsx';
import { VendorDashboardProvider } from '../context/VendorDashboardContext.jsx';
import '../styling/vendorDash.css';

const VendorInventory = () => {
    const navigate = useNavigate();
    const { user, setUser, setRole } = useAuth();
    const {
        loading,
        error,
        shopName,
        hasShopName,
        shopLogo,
        vendorEmail,
        inventoryRows,
        refreshDashboardData,
    } = useVendorDashboardPageData(user);

    const handleLogout = useCallback(async () => {
        await logout();
        setUser(null);
        setRole(null);
        navigate('/login');
    }, [navigate, setRole, setUser]);

    const dashboardContextValue = useMemo(() => ({
        hasShopName,
        shopName,
        shopLogo,
        vendorEmail,
        onLogout: handleLogout,
        onProductsChanged: refreshDashboardData,
        error,
        inventoryRows,
    }), [hasShopName, shopName, shopLogo, vendorEmail, handleLogout, error, inventoryRows, refreshDashboardData]);

    if (loading) {
        return (
            <div className="page-shell">
                <div className="loader">Loading inventory...</div>
            </div>
        );
    }

    return (
        <VendorDashboardProvider value={dashboardContextValue}>
            <VendorInventoryContent />
        </VendorDashboardProvider>
    );
};

export default VendorInventory;
