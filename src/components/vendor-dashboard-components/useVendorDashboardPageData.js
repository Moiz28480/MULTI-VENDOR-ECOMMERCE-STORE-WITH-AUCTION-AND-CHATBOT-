import { useEffect, useMemo, useState } from 'react';
import { ID, Query } from 'appwrite';
import { databases, storage } from '../../lib/appwrite.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';
const USERS_COLLECTION_ID = 'users';
const VENDORS_COLLECTION_ID = 'vendors';
const PRODUCT_IMAGES_BUCKET_ID = 'product_images';
const CHART_MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

const STATIC_SALES_REVENUE = {
    Nov: 4200,
    Dec: 3800,
    Jan: 5100,
    Feb: 4500,
};

const STATIC_ORDER_COUNTS = {
    Nov: 35,
    Dec: 30,
    Jan: 45,
    Feb: 40,
};

const randomViews = () => Math.floor(Math.random() * (1500 - 500 + 1)) + 500;

const resolveVendorId = (user) => {
    if (user?.$id) {
        localStorage.setItem('vendorId', user.$id);
        return user.$id;
    }

    const localUserId = localStorage.getItem('userId');
    if (localUserId) {
        return localUserId;
    }

    return '';
};

const buildVendorIdCandidates = async (user) => {
    const candidates = [];
    const pushCandidate = (value) => {
        const normalized = String(value || '').trim();
        if (!normalized || candidates.includes(normalized)) {
            return;
        }
        candidates.push(normalized);
    };

    pushCandidate(user?.$id);
    pushCandidate(localStorage.getItem('userId'));

    const normalizedEmail = String(user?.email || '').trim().toLowerCase();
    if (normalizedEmail) {
        try {
            const userByEmail = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                Query.equal('email', [normalizedEmail]),
                Query.limit(100),
            ]);

            const userDocs = userByEmail?.documents || [];
            userDocs.forEach((doc) => pushCandidate(doc?.$id));
        } catch (error) {
        }
    }

    try {
        pushCandidate(await resolveVendorIdForUser(user));
    } catch (error) {
    }

    pushCandidate(localStorage.getItem('vendorId'));
    return candidates;
};

export const resolveVendorIdForUser = async (user) => {
    const authUserId = user?.$id;
    const normalizedEmail = String(user?.email || '').trim().toLowerCase();

    if (authUserId) {
        const vendorByAuthId = await databases.listDocuments(DATABASE_ID, VENDORS_COLLECTION_ID, [
            Query.equal('vendorId', [authUserId]),
            Query.limit(1),
        ]);

        if (vendorByAuthId?.documents?.length) {
            localStorage.setItem('vendorId', authUserId);
            return authUserId;
        }
    }

    if (normalizedEmail) {
        const userByEmail = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
            Query.equal('email', [normalizedEmail]),
            Query.limit(100),
        ]);

        const mappedUserIds = (userByEmail?.documents || []).map((doc) => doc?.$id).filter(Boolean);

        for (const mappedUserId of mappedUserIds) {
            const vendorByMappedId = await databases.listDocuments(DATABASE_ID, VENDORS_COLLECTION_ID, [
                Query.equal('vendorId', [mappedUserId]),
                Query.limit(1),
            ]);

            if (vendorByMappedId?.documents?.length) {
                localStorage.setItem('vendorId', mappedUserId);
                return mappedUserId;
            }
        }
    }

    const fallbackVendorId = resolveVendorId(user);

    if (fallbackVendorId) {
        localStorage.setItem('vendorId', fallbackVendorId);
    }

    return fallbackVendorId;
};

const useVendorDashboardPageData = (user) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [shopName, setShopName] = useState('');
    const [shopLogo, setShopLogo] = useState('');
    const [vendorEmail, setVendorEmail] = useState('');
    const [vendorDocumentId, setVendorDocumentId] = useState('');
    const [currentVendorId, setCurrentVendorId] = useState('');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        productsSold: 0,
        totalViews: randomViews(),
    });

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            setError('');

            try {
                const vendorCandidates = await buildVendorIdCandidates(user);

                let selectedVendorId = vendorCandidates[0] || '';
                let productDocs = [];
                let orderDocs = [];
                let vendorDoc = null;
                let userDoc = null;
                let fallbackVendorId = '';
                let fallbackVendorDoc = null;
                let fallbackUserDoc = null;

                for (const candidateVendorId of vendorCandidates) {
                    const [productsResponse, ordersResponse, vendorResponse, userResponse] = await Promise.all([
                        databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
                            Query.equal('vendorId', [candidateVendorId]),
                            Query.limit(100),
                        ]),
                        databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
                            Query.equal('vendorId', [candidateVendorId]),
                            Query.limit(100),
                        ]),
                        databases.listDocuments(DATABASE_ID, VENDORS_COLLECTION_ID, [
                            Query.equal('vendorId', [candidateVendorId]),
                            Query.limit(1),
                        ]),
                        databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                            Query.equal('$id', [candidateVendorId]),
                            Query.limit(1),
                        ]),
                    ]);

                    const candidateProducts = productsResponse?.documents || [];
                    const candidateOrders = ordersResponse?.documents || [];
                    const candidateVendorDoc = vendorResponse?.documents?.[0] || null;
                    const candidateUserDoc = userResponse?.documents?.[0] || null;
                    const hasOrderOrProductData = Boolean(candidateProducts.length || candidateOrders.length);
                    const hasVendorProfileOnly = Boolean(candidateVendorDoc);

                    if (hasOrderOrProductData) {
                        selectedVendorId = candidateVendorId;
                        productDocs = candidateProducts;
                        orderDocs = candidateOrders;
                        vendorDoc = candidateVendorDoc;
                        userDoc = candidateUserDoc;
                        break;
                    }

                    if (!fallbackVendorDoc && hasVendorProfileOnly) {
                        fallbackVendorId = candidateVendorId;
                        fallbackVendorDoc = candidateVendorDoc;
                        fallbackUserDoc = candidateUserDoc;
                    }
                }

                if (!productDocs.length && !orderDocs.length && fallbackVendorDoc) {
                    selectedVendorId = fallbackVendorId;
                    vendorDoc = fallbackVendorDoc;
                    userDoc = fallbackUserDoc;
                }

                setCurrentVendorId(selectedVendorId);
                if (selectedVendorId) {
                    localStorage.setItem('vendorId', selectedVendorId);
                } else {
                    localStorage.removeItem('vendorId');
                }

                const deliveredDocs = orderDocs.filter((order) => String(order.status || '').toLowerCase() === 'delivered');

                setProducts(productDocs);
                setOrders(orderDocs);

                const totalRevenue = deliveredDocs.reduce((sum, order) => {
                    const amount = Number(order.totalAmount ?? 0);
                    return sum + (Number.isFinite(amount) ? amount : 0);
                }, 0);

                const productsSold = orderDocs.reduce((sum, order) => {
                    const quantity = Number(order.quantity ?? 0);
                    return sum + (Number.isFinite(quantity) ? quantity : 0);
                }, 0);

                setStats((previous) => ({
                    ...previous,
                    totalRevenue,
                    totalOrders: orderDocs.length,
                    productsSold,
                }));

                setVendorDocumentId(vendorDoc?.$id || '');
                setShopName(vendorDoc?.shopName?.trim() || '');
                setShopLogo(vendorDoc?.shopLogo || '');
                setVendorEmail(userDoc?.email || user?.email || '');
            } catch (fetchError) {
                setError(fetchError?.message || 'Unable to load dashboard data.');
                setProducts([]);
                setOrders([]);
                setVendorDocumentId('');
                setShopName('');
                setShopLogo('');
                setStats((previous) => ({
                    ...previous,
                    totalRevenue: 0,
                    totalOrders: 0,
                    productsSold: 0,
                }));
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user, refreshKey]);

    const categoryChartData = useMemo(() => {
        if (!products.length || !orders.length) {
            return [];
        }

        const productMap = products.reduce((map, product) => {
            map[product.$id] = product;
            return map;
        }, {});

        const grouped = orders.reduce((accumulator, order) => {
            const status = String(order.status || '').trim().toLowerCase();

            if (status !== 'delivered') {
                return accumulator;
            }

            const product = productMap[order.productId];
            const category = String(product?.category || 'Uncategorized').trim() || 'Uncategorized';
            const quantity = Number(order.quantity ?? 0);
            const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

            accumulator[category] = (accumulator[category] || 0) + normalizedQuantity;
            return accumulator;
        }, {});

        const totalDeliveredQuantity = Object.values(grouped).reduce((sum, qty) => sum + qty, 0);

        if (!totalDeliveredQuantity) {
            return [];
        }

        return Object.entries(grouped).map(([name, count]) => ({
            name,
            count,
            value: Number(((count / totalDeliveredQuantity) * 100).toFixed(1)),
        }));
    }, [products, orders]);

    const salesOverviewData = useMemo(() => {
        const currentYear = new Date().getFullYear();

        const dynamicRevenueByMonth = orders.reduce((accumulator, order) => {
            const createdAt = new Date(order.$createdAt || 0);

            if (Number.isNaN(createdAt.getTime()) || createdAt.getFullYear() !== currentYear) {
                return accumulator;
            }

            const monthIndex = createdAt.getMonth();
            const monthKey = monthIndex === 2 ? 'Mar' : monthIndex === 3 ? 'Apr' : '';

            if (!monthKey) {
                return accumulator;
            }

            const amount = Number(order.totalAmount ?? 0);
            const normalizedAmount = Number.isFinite(amount) ? amount : 0;
            accumulator[monthKey] = (accumulator[monthKey] || 0) + normalizedAmount;
            return accumulator;
        }, { Mar: 0, Apr: 0 });

        return CHART_MONTHS.map((month) => {
            const revenue = month === 'Mar' || month === 'Apr'
                ? dynamicRevenueByMonth[month] || 0
                : STATIC_SALES_REVENUE[month] || 0;

            return {
                month,
                sales: Number(revenue.toFixed(2)),
            };
        });
    }, [orders]);

    const ordersTrendData = useMemo(() => {
        const currentYear = new Date().getFullYear();

        const dynamicOrderCountByMonth = orders.reduce((accumulator, order) => {
            const createdAt = new Date(order.$createdAt || 0);

            if (Number.isNaN(createdAt.getTime()) || createdAt.getFullYear() !== currentYear) {
                return accumulator;
            }

            const monthIndex = createdAt.getMonth();
            const monthKey = monthIndex === 2 ? 'Mar' : monthIndex === 3 ? 'Apr' : '';

            if (!monthKey) {
                return accumulator;
            }

            accumulator[monthKey] = (accumulator[monthKey] || 0) + 1;
            return accumulator;
        }, { Mar: 0, Apr: 0 });

        return CHART_MONTHS.map((month) => {
            const ordersCount = month === 'Mar' || month === 'Apr'
                ? dynamicOrderCountByMonth[month] || 0
                : STATIC_ORDER_COUNTS[month] || 0;

            return {
                month,
                orders: ordersCount,
            };
        });
    }, [orders]);

    const recentOrders = useMemo(() => {
        if (!orders.length) {
            return [];
        }

        const productMap = products.reduce((map, product) => {
            map[product.$id] = product;
            return map;
        }, {});

        return [...orders]
            .sort((a, b) => new Date(b.$createdAt || 0) - new Date(a.$createdAt || 0))
            .slice(0, 5)
            .map((order) => ({
                ...order,
                productName: productMap[order.productId]?.name || order.productName || order.productId || '-',
                customerName: order.customerName || order.customerId || 'Unknown Customer',
                totalAmount: Number(order.totalAmount ?? 0),
            }));
    }, [orders, products]);

    const inventoryPreview = useMemo(() => products.slice(0, 5), [products]);
    const inventoryRows = useMemo(() => products, [products]);

    const ensureVendorDocumentId = async () => {
        const vendorId = currentVendorId || localStorage.getItem('vendorId') || user?.$id;

        if (!vendorId) {
            throw new Error('No vendor session found. Please log in again.');
        }

        if (vendorDocumentId) {
            return vendorDocumentId;
        }

        const vendorLookup = await databases.listDocuments(DATABASE_ID, VENDORS_COLLECTION_ID, [
            Query.equal('vendorId', [vendorId]),
            Query.limit(1),
        ]);

        const existingVendorDoc = vendorLookup?.documents?.[0];

        if (existingVendorDoc?.$id) {
            setVendorDocumentId(existingVendorDoc.$id);
            return existingVendorDoc.$id;
        }

        const createdVendorDoc = await databases.createDocument(
            DATABASE_ID,
            VENDORS_COLLECTION_ID,
            vendorId,
            {
                vendorId,
                shopName: null,
                shopLogo: null,
            },
        );

        setVendorDocumentId(createdVendorDoc.$id);
        return createdVendorDoc.$id;
    };

    const saveBrandName = async (name) => {
        const normalizedName = String(name || '').trim();

        if (!normalizedName) {
            throw new Error('Please enter a brand name.');
        }

        const vendorDocId = await ensureVendorDocumentId();

        await databases.updateDocument(
            DATABASE_ID,
            VENDORS_COLLECTION_ID,
            vendorDocId,
            {
                shopName: normalizedName,
            },
        );

        setShopName(normalizedName);
        return normalizedName;
    };

    const saveBrandLogo = async (logoFile) => {
        if (!logoFile) {
            throw new Error('Please choose a brand logo image.');
        }

        const vendorDocId = await ensureVendorDocumentId();

        const uploadedFile = await storage.createFile(
            PRODUCT_IMAGES_BUCKET_ID,
            ID.unique(),
            logoFile,
        );

        const fileView = storage.getFileView(PRODUCT_IMAGES_BUCKET_ID, uploadedFile.$id);
        const logoUrl = typeof fileView === 'string' ? fileView : fileView?.href || '';

        if (!logoUrl) {
            throw new Error('Unable to generate logo URL after upload.');
        }

        await databases.updateDocument(
            DATABASE_ID,
            VENDORS_COLLECTION_ID,
            vendorDocId,
            {
                shopLogo: logoUrl,
            },
        );

        setShopLogo(logoUrl);
        return logoUrl;
    };

    return {
        loading,
        error,
        shopName,
        hasShopName: Boolean(shopName),
        shopLogo,
        vendorEmail,
        stats,
        salesOverviewData,
        ordersTrendData,
        categoryChartData,
        recentOrders,
        inventoryPreview,
        inventoryRows,
        saveBrandName,
        saveBrandLogo,
        refreshDashboardData: () => setRefreshKey((value) => value + 1),
    };
};

export default useVendorDashboardPageData;
