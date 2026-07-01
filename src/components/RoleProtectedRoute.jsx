import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.js';
import LoadingScreen from './LoadingScreen.jsx';

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <LoadingScreen message="Loading session..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleProtectedRoute;
