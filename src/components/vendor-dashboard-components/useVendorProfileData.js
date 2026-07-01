import { useEffect, useMemo, useState } from 'react';
import { Query } from 'appwrite';
import { databases } from '../../lib/appwrite.js';
import { resolveVendorIdForUser } from './useVendorDashboardPageData.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';
const VENDORS_COLLECTION_ID = 'vendors';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';
const REVIEWS_COLLECTION_ID = 'reviews';

const fetchAllDocuments = async (collectionId, baseQueries = []) => {
    const allDocuments = [];
    let cursor = null;

    do {
        const queries = [...baseQueries, Query.limit(100)];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
        const docs = response?.documents || [];

        allDocuments.push(...docs);
        cursor = docs.length ? docs[docs.length - 1].$id : null;

        if (docs.length < 100) {
            break;
        }
    } while (cursor);

    return allDocuments;
};

const formatMemberSince = (rawDate) => {
    if (!rawDate) {
        return 'N/A';
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    });
};

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

const useVendorProfileData = (user) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState({
        shopName: '',
        shopLogo: '',
        email: '',
        roleLabel: 'Customer',
        phoneNumber: 'N/A',
        memberSince: 'N/A',
    });
    const [metrics, setMetrics] = useState({
        totalOrders: 0,
        totalReviews: 0,
        wishlist: 15,
        averageRating: 0,
    });

    useEffect(() => {
        const loadProfileData = async () => {
            setLoading(true);
            setError('');

            try {
                const vendorId = await resolveVendorIdForUser(user);

                const [vendorDocs, userDocs, productDocs, orderDocs] = await Promise.all([
                    fetchAllDocuments(VENDORS_COLLECTION_ID, [Query.equal('vendorId', [vendorId])]),
                    fetchAllDocuments(USERS_COLLECTION_ID, [Query.equal('$id', [vendorId])]),
                    fetchAllDocuments(PRODUCTS_COLLECTION_ID, [Query.equal('vendorId', [vendorId])]),
                    fetchAllDocuments(ORDERS_COLLECTION_ID, [Query.equal('vendorId', [vendorId])]),
                ]);

                const vendorDoc = vendorDocs?.[0] || null;
                const userDoc = userDocs?.[0] || null;
                const roleLabel = normalizeRole(userDoc?.role || user?.prefs?.role) || 'Customer';
                const productIds = productDocs.map((product) => product.$id).filter(Boolean);

                const reviewDocs = productIds.length
                    ? await fetchAllDocuments(REVIEWS_COLLECTION_ID, [Query.equal('productId', productIds)])
                    : [];

                const totalRatings = reviewDocs.reduce((sum, review) => {
                    const rating = Number(review.rating ?? 0);
                    return sum + (Number.isFinite(rating) ? rating : 0);
                }, 0);

                const averageRating = reviewDocs.length
                    ? Number((totalRatings / reviewDocs.length).toFixed(1))
                    : 0;

                setProfile({
                    shopName: vendorDoc?.shopName?.trim() || userDoc?.name || user?.name || roleLabel,
                    shopLogo: vendorDoc?.shopLogo || '',
                    email: userDoc?.email || user?.email || 'No email available',
                    roleLabel,
                    phoneNumber: userDoc?.phonenum == null || String(userDoc?.phonenum || '').trim() === ''
                        ? 'NA'
                        : String(userDoc.phonenum).trim(),
                    memberSince: formatMemberSince(vendorDoc?.$createdAt || userDoc?.$createdAt || user?.$createdAt),
                });

                setMetrics({
                    totalOrders: orderDocs.length,
                    totalReviews: reviewDocs.length,
                    wishlist: 15,
                    averageRating,
                });
            } catch (loadError) {
                setError(loadError?.message || 'Unable to load profile data.');
                setProfile({
                    shopName: user?.name || 'User',
                    shopLogo: '',
                    email: user?.email || 'No email available',
                    roleLabel: normalizeRole(user?.prefs?.role) || 'Customer',
                    phoneNumber: 'NA',
                    memberSince: 'N/A',
                });
                setMetrics({
                    totalOrders: 0,
                    totalReviews: 0,
                    wishlist: 15,
                    averageRating: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();
    }, [user]);

    const infoItems = useMemo(() => ([
        {
            label: 'Email Address',
            value: profile.email,
            variant: 'blue',
        },
        {
            label: 'Phone Number',
            value: profile.phoneNumber,
            variant: 'green',
        },
        {
            label: 'Location',
            value: 'Pakistan',
            variant: 'purple',
        },
        {
            label: 'Member Since',
            value: profile.memberSince,
            variant: 'orange',
        },
    ]), [profile.email, profile.memberSince, profile.phoneNumber]);

    return {
        loading,
        error,
        profile,
        metrics,
        infoItems,
    };
};

export default useVendorProfileData;
