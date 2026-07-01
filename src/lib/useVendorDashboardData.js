import { useEffect, useMemo, useState } from 'react';
import { Query } from 'appwrite';
import { databases } from './appwrite.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const VENDORS_COLLECTION_ID = 'vendors';
const USERS_COLLECTION_ID = 'users';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';

const fetchAllDocuments = async (collectionId, baseQueries = []) => {
    const allDocuments = [];
    let cursor = null;

    do {
        const pagedQueries = [...baseQueries, Query.limit(100)];

        if (cursor) {
            pagedQueries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(DATABASE_ID, collectionId, pagedQueries);
        const docs = response?.documents || [];

        allDocuments.push(...docs);
        cursor = docs.length ? docs[docs.length - 1].$id : null;

        if (docs.length < 100) {
            break;
        }
    } while (cursor);

    return allDocuments;
};

export const useVendorDashboardData = ({ userId, fallbackEmail }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [shopName, setShopName] = useState('');
    const [vendorEmail, setVendorEmail] = useState('');
    const [allVendorOrders, setAllVendorOrders] = useState([]);
    const [vendorProducts, setVendorProducts] = useState([]);
    const [customerDirectory, setCustomerDirectory] = useState({});

    const totalViews = useMemo(() => Math.floor(Math.random() * (1500 - 500 + 1)) + 500, []);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const [vendorDocs, userDocs, vendorProducts] = await Promise.all([
                    fetchAllDocuments(VENDORS_COLLECTION_ID, [Query.equal('vendorId', [userId])]),
                    fetchAllDocuments(USERS_COLLECTION_ID, [Query.equal('$id', [userId])]),
                    fetchAllDocuments(PRODUCTS_COLLECTION_ID, [Query.equal('vendorId', [userId])]),
                ]);

                const vendorData = vendorDocs[0] || null;
                const profileData = userDocs[0] || null;
                const productIds = vendorProducts.map((product) => product.$id).filter(Boolean);

                setShopName(vendorData?.shopName?.trim() || '');
                setVendorEmail(profileData?.email || fallbackEmail || '');
                setVendorProducts(vendorProducts);

                if (!productIds.length) {
                    setAllVendorOrders([]);
                    setCustomerDirectory({});
                    return;
                }

                const baseOrderQueries = [
                    Query.equal('vendorId', [userId]),
                    Query.equal('productId', productIds),
                ];

                const orders = await fetchAllDocuments(ORDERS_COLLECTION_ID, baseOrderQueries);

                const customerIds = [...new Set(
                    orders
                        .map((order) => order.customerId)
                        .filter(Boolean),
                )];

                const customers = customerIds.length
                    ? await fetchAllDocuments(USERS_COLLECTION_ID, [Query.equal('$id', customerIds)])
                    : [];

                const customerMap = customers.reduce((map, customer) => {
                    map[customer.$id] = customer;
                    return map;
                }, {});

                setAllVendorOrders(orders);
                setCustomerDirectory(customerMap);
            } catch (dashboardError) {
                setError(dashboardError?.message || 'Unable to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [fallbackEmail, userId]);

    const deliveredOrders = allVendorOrders.filter(
        (order) => String(order.status || '').toLowerCase() === 'delivered',
    );

    const totalRevenue = deliveredOrders.reduce((sum, order) => {
        const amount = Number(order.totalPrice ?? order.totalAmount ?? 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    const productsSold = allVendorOrders.reduce((sum, order) => {
        const qty = Number(order.quantity ?? 0);
        return sum + (Number.isFinite(qty) ? qty : 0);
    }, 0);

    const recentOrders = [...allVendorOrders]
        .sort((a, b) => new Date(b.$createdAt || 0) - new Date(a.$createdAt || 0))
        .slice(0, 5);

    const categoryChartData = vendorProducts.reduce((accumulator, product) => {
        const rawCategory = String(product.category || 'Uncategorized').trim();
        const category = rawCategory || 'Uncategorized';
        const existingCategory = accumulator.find((item) => item.name === category);

        if (existingCategory) {
            existingCategory.value += 1;
            return accumulator;
        }

        accumulator.push({ name: category, value: 1 });
        return accumulator;
    }, []);

    const salesByProductId = allVendorOrders.reduce((salesMap, order) => {
        const productId = order.productId;
        if (!productId) {
            return salesMap;
        }

        const quantity = Number(order.quantity ?? 0);
        const normalizedQty = Number.isFinite(quantity) ? quantity : 0;

        salesMap[productId] = (salesMap[productId] || 0) + normalizedQty;
        return salesMap;
    }, {});

    const inventoryRows = vendorProducts.map((product) => ({
        ...product,
        sales: salesByProductId[product.$id] || 0,
    }));

    const productDirectory = vendorProducts.reduce((map, product) => {
        map[product.$id] = product;
        return map;
    }, {});

    const normalizedRecentOrders = recentOrders.map((order) => {
        const customer = customerDirectory[order.customerId] || null;
        const product = productDirectory[order.productId] || null;

        return {
            ...order,
            customerName: customer?.name || 'Unknown Customer',
            productName: product?.name || order.productId || 'Unknown Product',
            totalPrice: Number(order.totalPrice ?? order.totalAmount ?? 0),
        };
    });

    return {
        loading,
        error,
        shopName,
        hasShopName: Boolean(shopName),
        vendorEmail,
        recentOrders: normalizedRecentOrders,
        categoryChartData,
        inventoryPreview: inventoryRows.slice(0, 5),
        inventoryRows,
        stats: {
            totalRevenue,
            totalOrders: allVendorOrders.length,
            productsSold,
            totalViews,
        },
    };
};

export default useVendorDashboardData;
