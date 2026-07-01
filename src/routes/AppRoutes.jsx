import { Navigate, Route, Routes } from 'react-router-dom';
import Login from '../pages/login.jsx';
import Signup from '../pages/signup.jsx';
import StoreHome from '../pages/StoreHome.jsx';
import VendorDash from '../pages/VendorDash.jsx';
import VendorProfile from '../pages/VendorProfile.jsx';
import VendorInventory from '../pages/VendorInventory.jsx';
import OrdersPage from '../pages/orders.jsx';
import AdminDash from '../pages/AdminDash.jsx';
import ManageUsers from '../components/admindash-components/ManageUsers.jsx';
import ComplaintsPage from '../pages/ComplaintsPage.jsx';
import SettingsPage from '../pages/Settings/SettingsPage.jsx';
import CategoryProductsPage from '../pages/CategoryProductsPage.jsx';
import AddToCartPage from '../pages/AddToCartPage.jsx';
import ProductDescriptionPage from '../pages/ProductDescriptionPage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import CheckoutReviewPage from '../pages/CheckoutReviewPage.jsx';
import AuctionPage from '../pages/AuctionPage.jsx';
import SearchResultsPage from '../pages/SearchResultsPage.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import RoleProtectedRoute from '../components/RoleProtectedRoute.jsx';

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
            path="/store-home"
            element={
                <ProtectedRoute>
                    <StoreHome />
                </ProtectedRoute>
            }
        />
        <Route
            path="/search"
            element={
                <ProtectedRoute>
                    <SearchResultsPage />
                </ProtectedRoute>
            }
        />
        <Route path="/marketplace" element={<Navigate to="/store-home" replace />} />
        <Route
            path="/auctions"
            element={
                <ProtectedRoute>
                    <AuctionPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/category/:categoryName"
            element={
                <ProtectedRoute>
                    <CategoryProductsPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/cart"
            element={
                <ProtectedRoute>
                    <AddToCartPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/checkout"
            element={
                <ProtectedRoute>
                    <CheckoutPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/checkout/:orderId"
            element={
                <ProtectedRoute>
                    <CheckoutPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/checkout/review"
            element={
                <ProtectedRoute>
                    <CheckoutReviewPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/product/:productId"
            element={
                <ProtectedRoute>
                    <ProductDescriptionPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/vendor-dashboard"
            element={
                <ProtectedRoute>
                    <VendorDash />
                </ProtectedRoute>
            }
        />
        <Route path="/vendor-dash" element={<Navigate to="/vendor-dashboard" replace />} />
        <Route
            path="/orders"
            element={
                <RoleProtectedRoute allowedRoles={['Vendor', 'Customer']}>
                    <OrdersPage />
                </RoleProtectedRoute>
            }
        />
        <Route
            path="/inventory"
            element={
                <ProtectedRoute>
                    <VendorInventory />
                </ProtectedRoute>
            }
        />
        <Route
            path="/vendor-profile"
            element={
                <ProtectedRoute>
                    <VendorProfile />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin-dashboard"
            element={
                <ProtectedRoute>
                    <AdminDash />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/users"
            element={
                <RoleProtectedRoute allowedRoles={['Admin']}>
                    <ManageUsers />
                </RoleProtectedRoute>
            }
        />
        <Route
            path="/admin/complaints"
            element={
                <RoleProtectedRoute allowedRoles={['Admin']}>
                    <ComplaintsPage />
                </RoleProtectedRoute>
            }
        />
        <Route
            path="/settings"
            element={
                <ProtectedRoute>
                    <SettingsPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/profile"
            element={
                <ProtectedRoute>
                    <VendorProfile />
                </ProtectedRoute>
            }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
);

export default AppRoutes;