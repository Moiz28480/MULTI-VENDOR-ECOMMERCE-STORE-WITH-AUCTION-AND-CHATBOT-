import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.js';
import LoadingScreen from './LoadingScreen.jsx';

const normalizeRoleKey = (rawRole) => {
    const cleanedRole = String(rawRole || '').trim().toLowerCase();

    if (!cleanedRole) {
        return null;
    }

    return cleanedRole.charAt(0).toUpperCase() + cleanedRole.slice(1);
};

const RoleRedirect = ({ roleRoutes }) => {
    const navigate = useNavigate();
    const { role, loading, user } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        const normalizedRole = normalizeRoleKey(role);

        if (normalizedRole && roleRoutes[normalizedRole]) {
            navigate(roleRoutes[normalizedRole], { replace: true });
            return;
        }

        navigate('/store-home', { replace: true });
    }, [role, loading, user, navigate, roleRoutes]);

    return <LoadingScreen message="Redirecting..." />;
};

export default RoleRedirect;