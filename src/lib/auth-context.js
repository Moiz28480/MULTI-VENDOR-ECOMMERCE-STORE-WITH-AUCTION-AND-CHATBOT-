import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, getSession } from './appwrite.js';

const normalizeRole = (rawRole) => {
    const cleanedRole = String(rawRole || '').trim().toLowerCase();

    if (cleanedRole === 'customer') {
        return 'Customer';
    }

    if (cleanedRole === 'vendor') {
        return 'Vendor';
    }

    if (cleanedRole === 'admin') {
        return 'Admin';
    }

    return null;
};

const AuthStore = createContext({
    user: null,
    role: null,
    loading: true,
    setUser: () => {},
    setRole: () => {},
    setLoading: () => {},
});

export const AuthProvider = AuthStore.Provider;

export const AuthContext = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSession = async () => {
            const session = await getSession();
            if (!session) {
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }

            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setRole(normalizeRole(currentUser?.prefs?.role));
            setLoading(false);
        };

        loadSession();
    }, []);

    const value = useMemo(() => ({
        user,
        role,
        loading,
        setUser,
        setRole,
        setLoading,
    }), [user, role, loading]);

    return createElement(AuthProvider, { value }, children);
};

export const useAuth = () => useContext(AuthStore);
