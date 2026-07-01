import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../lib/appwrite.js';
import { useAuth } from '../lib/auth-context.js';
import useVendorDashboardPageData from '../components/vendor-dashboard-components/useVendorDashboardPageData.js';
import VendorDashboardContent from '../components/vendor-dashboard-components/VendorDashboardContent.jsx';
import { VendorDashboardProvider } from '../context/VendorDashboardContext.jsx';
import '../styling/vendorDash.css';

const VendorDash = () => {
    const navigate = useNavigate();
    const { user, setUser, setRole } = useAuth();
    const {
        loading,
        error,
        shopName,
        hasShopName,
        shopLogo,
        vendorEmail,
        stats,
        salesOverviewData,
        ordersTrendData,
        categoryChartData,
        recentOrders,
        inventoryPreview,
        saveBrandName,
        saveBrandLogo,
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
        onAddProductClick: () => {},
        onSaveBrandName: saveBrandName,
        onSaveBrandLogo: saveBrandLogo,
        onProductAdded: refreshDashboardData,
        onProductsChanged: refreshDashboardData,
        error,
        stats,
        salesOverviewData,
        ordersTrendData,
        categoryChartData,
        recentOrders,
        inventoryPreview,
    }), [
        hasShopName,
        shopName,
        shopLogo,
        vendorEmail,
            handleLogout,
        saveBrandName,
        saveBrandLogo,
        error,
        stats,
        salesOverviewData,
        ordersTrendData,
        categoryChartData,
        recentOrders,
        inventoryPreview,
        refreshDashboardData,
    ]);

    if (loading) {
        return (
            <div className="page-shell">
                <div className="loader">Loading vendor dashboard...</div>
            </div>
        );
    }

    return (
        <VendorDashboardProvider value={dashboardContextValue}>
            <VendorDashboardContent />
        </VendorDashboardProvider>
    );
};

export default VendorDash;
