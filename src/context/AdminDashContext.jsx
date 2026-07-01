import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Query } from 'appwrite';
import { useAuth } from '../lib/auth-context.js';
import client, { databases } from '../lib/appwrite.js';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';
const ORDERS_COLLECTION_ID = 'orders';
const PRODUCTS_COLLECTION_ID = 'products';
const COMPLAINTS_COLLECTION_ID = 'complaints';

const HEALTH_CHECK_COLLECTION_ID = USERS_COLLECTION_ID;

const createHealthState = ({
    serverLabel = 'Unknown',
    serverTone = 'red',
    serverWidth = 20,
    databaseLabel = 'Unknown',
    databaseTone = 'red',
    databaseWidth = 20,
    apiLabel = 'Unknown',
    apiTone = 'red',
    apiWidth = 20,
    latencyMs = 0,
    loading = true,
} = {}) => ({
    serverStatus: {
        label: serverLabel,
        tone: serverTone,
        widthPercent: serverWidth,
    },
    databaseStatus: {
        label: databaseLabel,
        tone: databaseTone,
        widthPercent: databaseWidth,
    },
    apiResponse: {
        label: apiLabel,
        tone: apiTone,
        widthPercent: apiWidth,
    },
    latencyMs,
    loading,
});

const evaluateApiResponse = (latencyMs) => {
    if (latencyMs < 300) {
        return { label: 'Excellent', tone: 'green', widthPercent: 100 };
    }

    if (latencyMs <= 800) {
        return { label: 'Good', tone: 'orange', widthPercent: 72 };
    }

    return { label: 'Slow', tone: 'red', widthPercent: 45 };
};

const formatComplaintId = (rawId, fallbackIndex) => {
    const numericPart = String(rawId || '')
        .match(/\d+/g)
        ?.join('');
    const parsedValue = Number(numericPart);
    const sequence = Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackIndex + 1;
    return `C${String(sequence).padStart(3, '0')}`;
};

const normalizeComplaintPriority = (rawPriority, rawCategory) => {
    const priority = String(rawPriority || '').trim().toLowerCase();
    if (priority === 'high') {
        return 'High';
    }

    if (priority === 'medium') {
        return 'Medium';
    }

    if (priority === 'low') {
        return 'Low';
    }

    const category = String(rawCategory || '').trim().toLowerCase();
    if (['damaged', 'defective', 'missing item', 'wrong item'].includes(category)) {
        return 'High';
    }

    if (['quality', 'late'].includes(category)) {
        return 'Medium';
    }

    return 'Low';
};

const formatComplaintDate = (rawDate) => {
    if (!rawDate) {
        return 'N/A';
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return date.toISOString().slice(0, 10);
};

const checkAppwriteHealth = async () => {
    const endpoint = client?.config?.endpoint || APPWRITE_ENDPOINT;

    let serverStatus = {
        label: 'Degraded',
        tone: 'red',
        widthPercent: 40,
    };

    try {
        const pingResponse = await fetch(`${endpoint}/health/version`, { method: 'GET' });
        if (pingResponse.ok) {
            serverStatus = {
                label: 'Healthy',
                tone: 'green',
                widthPercent: 100,
            };
        }
    } catch (error) {
        serverStatus = {
            label: 'Degraded',
            tone: 'red',
            widthPercent: 40,
        };
    }

    const latencyStart = performance.now();

    try {
        await databases.listDocuments(DATABASE_ID, HEALTH_CHECK_COLLECTION_ID, [Query.limit(1)]);

        const latencyMs = performance.now() - latencyStart;
        const apiResponse = evaluateApiResponse(latencyMs);

        return createHealthState({
            serverLabel: serverStatus.label,
            serverTone: serverStatus.tone,
            serverWidth: serverStatus.widthPercent,
            databaseLabel: 'Optimal',
            databaseTone: 'green',
            databaseWidth: 100,
            apiLabel: apiResponse.label,
            apiTone: apiResponse.tone,
            apiWidth: apiResponse.widthPercent,
            latencyMs,
            loading: false,
        });
    } catch (error) {
        return createHealthState({
            serverLabel: serverStatus.label,
            serverTone: serverStatus.tone,
            serverWidth: serverStatus.widthPercent,
            databaseLabel: 'Degraded',
            databaseTone: 'red',
            databaseWidth: 40,
            apiLabel: 'Slow',
            apiTone: 'red',
            apiWidth: 40,
            latencyMs: performance.now() - latencyStart,
            loading: false,
        });
    }
};

const AdminDashContext = createContext({
    user: {
        email: '',
    },
    stats: {
        totalUsers: 0,
        activeVendors: 0,
        totalRevenue: 0,
        fraudAlerts: 23,
    },
    percentageChanges: {
        totalUsers: '+18.2%',
        activeVendors: '+12.5%',
        totalRevenue: '+24.8%',
        fraudAlerts: '-5.2%',
    },
    systemHealth: createHealthState(),
    recentComplaints: [],
    allComplaints: [],
    complaintStats: {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
    },
    loading: false,
    error: '',
});

const fetchAllDocuments = async (collectionId) => {
    const allDocuments = [];
    let cursor = null;

    do {
        const queries = [Query.limit(100)];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
        const documents = response?.documents || [];

        allDocuments.push(...documents);
        cursor = documents.length ? documents[documents.length - 1].$id : null;

        if (documents.length < 100) {
            break;
        }
    } while (cursor);

    return allDocuments;
};

export const AdminDashProvider = ({ children }) => {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [allComplaints, setAllComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [systemHealth, setSystemHealth] = useState(createHealthState());

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setLoading(true);
            setError('');

            try {
                const [userDocs, orderDocs, productDocs] = await Promise.all([
                    fetchAllDocuments(USERS_COLLECTION_ID),
                    fetchAllDocuments(ORDERS_COLLECTION_ID),
                    fetchAllDocuments(PRODUCTS_COLLECTION_ID),
                ]);

                if (!isMounted) {
                    return;
                }

                setUsers(userDocs);
                setOrders(orderDocs);

                try {
                    const allComplaintsResponse = await fetchAllDocuments(COMPLAINTS_COLLECTION_ID);

                    if (!isMounted) {
                        return;
                    }

                    const userNameById = new Map(
                        userDocs.map((userDoc) => [
                            String(userDoc.$id || '').trim(),
                            userDoc.name || userDoc.email || 'Unknown User',
                        ]),
                    );

                    const userImageById = new Map(
                        userDocs.map((userDoc) => [
                            String(userDoc.$id || '').trim(),
                            userDoc.profileImage || userDoc.avatar || '',
                        ]),
                    );

                    const orderById = new Map();
                    orderDocs.forEach((orderDoc) => {
                        const orderDocumentId = String(orderDoc.$id || '').trim();
                        const orderIdField = String(orderDoc.orderId || '').trim();

                        if (orderDocumentId) {
                            orderById.set(orderDocumentId, orderDoc);
                        }

                        if (orderIdField) {
                            orderById.set(orderIdField, orderDoc);
                        }
                    });

                    const productNameById = new Map();
                    productDocs.forEach((productDoc) => {
                        const productDocumentId = String(productDoc.$id || '').trim();
                        const productIdField = String(productDoc.productId || '').trim();
                        const productName = String(productDoc.name || productDoc.productName || '').trim();

                        if (!productName) {
                            return;
                        }

                        if (productDocumentId) {
                            productNameById.set(productDocumentId, productName);
                        }

                        if (productIdField) {
                            productNameById.set(productIdField, productName);
                        }
                    });

                    const enrichComplaints = (complaintDocs) =>
                        complaintDocs.map((complaintDoc, index) => {
                            const userId = String(complaintDoc?.userId || '').trim();
                            const orderId = String(complaintDoc?.orderId || '').trim();
                            const orderDoc = orderById.get(orderId);
                            const productId = String(orderDoc?.productId || '').trim();
                            const resolvedProductName =
                                productNameById.get(productId) ||
                                String(orderDoc?.productName || '').trim() ||
                                (productId ? productId : 'Unknown Product');

                            return {
                                $id: complaintDoc?.$id,
                                complaintId: formatComplaintId(complaintDoc?.$id, index),
                                description: complaintDoc?.description || 'No description provided.',
                                userName: userNameById.get(userId) || complaintDoc?.userName || 'Unknown User',
                                userImage: userImageById.get(userId) || '',
                                status: String(complaintDoc?.status || '').trim() || 'Open',
                                priority: normalizeComplaintPriority(complaintDoc?.priority, complaintDoc?.category),
                                category: String(complaintDoc?.category || '').trim() || 'Other',
                                date: formatComplaintDate(complaintDoc?.$createdAt || complaintDoc?.date),
                                orderId,
                                vendorId: orderDoc?.vendorId || '',
                                productName: resolvedProductName,
                                rawComplaint: complaintDoc,
                            };
                        });

                    const enrichedAllComplaints = enrichComplaints(allComplaintsResponse);
                    const recentEnrichedComplaints = enrichedAllComplaints.slice(0, 4);

                    setAllComplaints(enrichedAllComplaints);
                    setRecentComplaints(recentEnrichedComplaints);
                } catch (complaintsError) {
                    if (!isMounted) {
                        return;
                    }

                    // Complaints read can fail due to collection permissions; keep dashboard stats available.
                    setAllComplaints([]);
                    setRecentComplaints([]);
                }
            } catch (loadError) {
                if (!isMounted) {
                    return;
                }

                setUsers([]);
                setOrders([]);
                setRecentComplaints([]);
                setAllComplaints([]);
                setError(loadError?.message || 'Unable to load admin dashboard stats.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const refreshHealth = async () => {
            if (!isMounted) {
                return;
            }

            setSystemHealth((previous) => ({
                ...previous,
                loading: true,
            }));

            const healthResult = await checkAppwriteHealth();

            if (!isMounted) {
                return;
            }

            setSystemHealth(healthResult);
        };

        refreshHealth();
        const intervalId = window.setInterval(refreshHealth, 60000);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, []);

    const value = useMemo(() => {
        const totalUsers = users.length;
        const activeVendors = users.filter(
            (item) => String(item.role || '').trim().toLowerCase() === 'vendor',
        ).length;

        const deliveredTotal = orders
            .filter((item) => String(item.status || '').toLowerCase() === 'delivered')
            .reduce((sum, item) => sum + Number(item.price ?? item.totalAmount ?? 0), 0);

        const totalRevenue = deliveredTotal * 0.1;

        const complaintStats = {
            total: allComplaints.length,
            open: allComplaints.filter((c) => String(c.status || '').toLowerCase() === 'open')
                .length,
            inProgress: allComplaints.filter(
                (c) =>
                    String(c.status || '').toLowerCase() === 'in progress' ||
                    String(c.status || '').toLowerCase() === 'processing',
            ).length,
            resolved: allComplaints.filter(
                (c) =>
                    String(c.status || '').toLowerCase() === 'resolved' ||
                    String(c.status || '').toLowerCase() === 'closed',
            ).length,
        };

        return {
            user: {
                email: authUser?.email || 'moizn49@gmail.com',
            },
            stats: {
                totalUsers,
                activeVendors,
                totalRevenue,
                fraudAlerts: 23,
            },
            percentageChanges: {
                totalUsers: '+18.2%',
                activeVendors: '+12.5%',
                totalRevenue: '+24.8%',
                fraudAlerts: '-5.2%',
            },
            systemHealth,
            recentComplaints,
            allComplaints,
            complaintStats,
            loading,
            error,
        };
    }, [users, orders, authUser, loading, error, systemHealth, recentComplaints, allComplaints]);

    return (
        <AdminDashContext.Provider value={value}>
            {children}
        </AdminDashContext.Provider>
    );
};

export const useAdminDashContext = () => useContext(AdminDashContext);

export default AdminDashContext;
