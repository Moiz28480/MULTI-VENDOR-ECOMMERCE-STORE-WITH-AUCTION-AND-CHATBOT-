import { useEffect, useMemo, useState } from 'react';
import { Query } from 'appwrite';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from './Header.jsx';
import { databases, logout } from '../../lib/appwrite.js';
import { AdminDashProvider } from '../../context/AdminDashContext.jsx';
import '../../styling/adminDash.css';

const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';
const PRODUCTS_COLLECTION_ID = 'products';
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

const normalizeRole = (rawRole) => {
    const cleaned = String(rawRole || '').trim().toLowerCase();
    if (!cleaned) {
        return 'Unknown';
    }

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const formatJoinedDate = (rawDate) => {
    if (!rawDate) {
        return 'N/A';
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    });
};

const buildVendorRatings = (products, reviews) => {
    const productToVendor = new Map();
    const vendorTotals = new Map();

    for (const product of products) {
        if (product?.$id && product?.vendorId) {
            productToVendor.set(product.$id, product.vendorId);
        }
    }

    for (const review of reviews) {
        const vendorId = productToVendor.get(review?.productId);
        if (!vendorId) {
            continue;
        }

        const rating = Number(review?.rating ?? 0);
        if (!Number.isFinite(rating) || rating <= 0) {
            continue;
        }

        const previous = vendorTotals.get(vendorId) || { sum: 0, count: 0 };
        vendorTotals.set(vendorId, {
            sum: previous.sum + rating,
            count: previous.count + 1,
        });
    }

    const averages = new Map();
    for (const [vendorId, totals] of vendorTotals.entries()) {
        if (totals.count === 0) {
            averages.set(vendorId, null);
        } else {
            averages.set(vendorId, Number((totals.sum / totals.count).toFixed(1)));
        }
    }

    return averages;
};

const banViaFunction = async (userId) => {
    const endpoint = String(import.meta.env.VITE_ADMIN_BAN_ENDPOINT || '').trim();
    if (!endpoint) {
        throw new Error('No admin ban endpoint configured.');
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, disabled: true }),
    });

    if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(bodyText || 'Failed to disable auth account.');
    }
};

const markAsBanned = async (userId) => {
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
        isBanned: true,
    });
};

const ManageUsersContent = () => {
    const [users, setUsers] = useState([]);
    const [vendorRatings, setVendorRatings] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banningIds, setBanningIds] = useState({});
    const [emailInput, setEmailInput] = useState('');
    const [appliedEmailFilter, setAppliedEmailFilter] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');

    useEffect(() => {
        let isMounted = true;

        const loadUsers = async () => {
            setLoading(true);
            setError('');

            try {
                const [userDocs, productDocs, reviewDocs] = await Promise.all([
                    fetchAllDocuments(USERS_COLLECTION_ID, [Query.orderDesc('$createdAt')]),
                    fetchAllDocuments(PRODUCTS_COLLECTION_ID),
                    fetchAllDocuments(REVIEWS_COLLECTION_ID),
                ]);

                if (!isMounted) {
                    return;
                }

                setUsers(userDocs);
                setVendorRatings(buildVendorRatings(productDocs, reviewDocs));
            } catch (loadError) {
                if (!isMounted) {
                    return;
                }

                setUsers([]);
                setVendorRatings(new Map());
                setError(loadError?.message || 'Unable to load users.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadUsers();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleBanUser = async (userDoc) => {
        const userId = userDoc?.$id;
        if (!userId) {
            return;
        }

        const shouldProceed = window.confirm('Ban this user? They will no longer be able to access the platform.');
        if (!shouldProceed) {
            return;
        }

        setError('');
        setBanningIds((previous) => ({
            ...previous,
            [userId]: true,
        }));

        try {
            try {
                await banViaFunction(userId);
            } catch (functionError) {
                try {
                    await markAsBanned(userId);
                } catch (flagError) {
                    await databases.deleteDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
                }
            }

            setUsers((previous) => previous.filter((user) => user.$id !== userId));

            const currentUserId = localStorage.getItem('userId');
            if (currentUserId === userId) {
                await logout();
                window.location.assign('/login');
            }
        } catch (banError) {
            setError(banError?.message || 'Unable to ban this user.');
        } finally {
            setBanningIds((previous) => {
                const next = { ...previous };
                delete next[userId];
                return next;
            });
        }
    };

    const totalUsersLabel = useMemo(() => {
        const count = users.length;
        return count === 1 ? '1 user' : `${count} users`;
    }, [users]);

    const filteredUsers = useMemo(() => {
        let roleFilteredUsers = users;

        if (selectedRole !== 'all') {
            roleFilteredUsers = users.filter((userDoc) => {
                const normalizedRole = String(userDoc.role || '').trim().toLowerCase();
                return normalizedRole === selectedRole;
            });
        }

        if (!appliedEmailFilter) {
            return roleFilteredUsers;
        }

        return roleFilteredUsers.filter((userDoc) => {
            const normalizedEmail = String(userDoc.email || '').trim().toLowerCase();
            return normalizedEmail === appliedEmailFilter;
        });
    }, [users, appliedEmailFilter, selectedRole]);

    const roleCounts = useMemo(() => {
        return users.reduce((totals, userDoc) => {
            const role = String(userDoc.role || '').trim().toLowerCase();
            if (role === 'admin') {
                totals.admin += 1;
            } else if (role === 'customer') {
                totals.customer += 1;
            } else if (role === 'vendor') {
                totals.vendor += 1;
            }

            return totals;
        }, {
            admin: 0,
            customer: 0,
            vendor: 0,
        });
    }, [users]);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setAppliedEmailFilter(String(emailInput || '').trim().toLowerCase());
    };

    const handleClearSearch = () => {
        setEmailInput('');
        setAppliedEmailFilter('');
    };

    return (
        <div className="admin-marketplace-page">
            <div className="admin-marketplace-shell">
                <Header />

                <main className="admin-marketplace-content">
                    <h1 className="admin-marketplace-title">Manage Users</h1>
                    <p className="admin-marketplace-subtitle">
                        Full user listing with vendor rating insights and moderation actions
                    </p>

                    <div className="admin-manage-users-toolbar">
                        <Link to="/admin-dashboard" className="admin-back-dashboard-btn">
                            Back to Admin Dashboard
                        </Link>
                    </div>

                    <form className="admin-user-search-form" onSubmit={handleSearchSubmit}>
                        <input
                            type="email"
                            className="admin-user-search-input"
                            placeholder="Search by user email"
                            value={emailInput}
                            onChange={(event) => setEmailInput(event.target.value)}
                        />
                        <button type="submit" className="admin-user-search-btn">
                            Search
                        </button>
                        <button
                            type="button"
                            className="admin-user-search-clear-btn"
                            onClick={handleClearSearch}
                            disabled={!emailInput && !appliedEmailFilter}
                        >
                            Clear
                        </button>
                    </form>

                    <div className="admin-role-filter-group" role="tablist" aria-label="Filter users by role">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={selectedRole === 'admin'}
                            className={`admin-role-filter-btn ${selectedRole === 'admin' ? 'admin-role-filter-btn-active' : ''}`}
                            onClick={() => setSelectedRole('admin')}
                        >
                            Admin ({roleCounts.admin})
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={selectedRole === 'customer'}
                            className={`admin-role-filter-btn ${selectedRole === 'customer' ? 'admin-role-filter-btn-active' : ''}`}
                            onClick={() => setSelectedRole('customer')}
                        >
                            Customer ({roleCounts.customer})
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={selectedRole === 'vendor'}
                            className={`admin-role-filter-btn ${selectedRole === 'vendor' ? 'admin-role-filter-btn-active' : ''}`}
                            onClick={() => setSelectedRole('vendor')}
                        >
                            Vendor ({roleCounts.vendor})
                        </button>
                        <button
                            type="button"
                            className={`admin-role-filter-btn ${selectedRole === 'all' ? 'admin-role-filter-btn-active' : ''}`}
                            onClick={() => setSelectedRole('all')}
                        >
                            All ({users.length})
                        </button>
                    </div>

                    {loading ? <p className="admin-marketplace-note">Loading users...</p> : null}
                    {error ? <p className="admin-marketplace-error">{error}</p> : null}
                    {!loading ? (
                        <p className="admin-manage-users-count">
                            {appliedEmailFilter
                                ? `${filteredUsers.length} result${filteredUsers.length === 1 ? '' : 's'} for ${appliedEmailFilter}`
                                : `${totalUsersLabel} • ${selectedRole === 'all' ? 'all roles' : `${normalizeRole(selectedRole)} only`}`}
                        </p>
                    ) : null}

                    <section className="admin-manage-users-card" aria-label="All users list">
                        <div className="admin-manage-users-table-wrap">
                            <table className="admin-manage-users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                        <th>Rating</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && filteredUsers.length === 0 ? (
                                        <tr>
                                            <td className="admin-manage-users-empty" colSpan={6}>
                                                {appliedEmailFilter
                                                    ? 'No user found with this email.'
                                                    : 'No users found.'}
                                            </td>
                                        </tr>
                                    ) : null}

                                    {filteredUsers.map((userDoc) => {
                                        const roleLower = String(userDoc.role || '').trim().toLowerCase();
                                        const isVendor = roleLower === 'vendor';
                                        const rating = isVendor ? vendorRatings.get(userDoc.$id) : null;
                                        const isBanning = Boolean(banningIds[userDoc.$id]);

                                        return (
                                            <tr key={userDoc.$id}>
                                                <td>{userDoc.name || 'Unnamed User'}</td>
                                                <td>{userDoc.email || 'No email'}</td>
                                                <td>{normalizeRole(userDoc.role)}</td>
                                                <td>{formatJoinedDate(userDoc.$createdAt)}</td>
                                                <td>
                                                    {isVendor && rating != null ? (
                                                        <span className="admin-vendor-rating">
                                                            <Star size={14} className="admin-vendor-rating-star" />
                                                            {rating.toFixed(1)}
                                                        </span>
                                                    ) : (
                                                        <span className="admin-vendor-rating-missing">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="admin-ban-user-btn"
                                                        disabled={isBanning}
                                                        onClick={() => handleBanUser(userDoc)}
                                                    >
                                                        {isBanning ? 'Banning...' : 'Ban User'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

const ManageUsers = () => (
    <AdminDashProvider>
        <ManageUsersContent />
    </AdminDashProvider>
);

export default ManageUsers;
