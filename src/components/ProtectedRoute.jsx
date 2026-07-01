import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.js';
import LoadingScreen from './LoadingScreen.jsx';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen message="Loading session..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;