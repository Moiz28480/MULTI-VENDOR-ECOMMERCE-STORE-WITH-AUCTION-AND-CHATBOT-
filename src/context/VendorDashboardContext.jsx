import { createContext, useContext } from 'react';

const VendorDashboardContext = createContext({
    hasShopName: false,
    shopName: '',
    shopLogo: '',
    vendorEmail: '',
    onLogout: () => {},
    onAddProductClick: () => {},
    onSaveBrandName: async () => {},
    onSaveBrandLogo: async () => {},
    onProductAdded: () => {},
    onProductsChanged: () => {},
    error: '',
    stats: {
        totalRevenue: 0,
        totalOrders: 0,
        productsSold: 0,
        totalViews: 0,
    },
    salesOverviewData: [],
    ordersTrendData: [],
    categoryChartData: [],
    recentOrders: [],
    inventoryPreview: [],
    inventoryRows: [],
});

export const VendorDashboardProvider = ({ value, children }) => {
    return (
        <VendorDashboardContext.Provider value={value}>
            {children}
        </VendorDashboardContext.Provider>
    );
};

export const useVendorDashboardContext = () => useContext(VendorDashboardContext);

export default VendorDashboardContext;
