import { useEffect, useState } from 'react';
import { Query } from 'appwrite';
import { Link } from 'react-router-dom';
import { databases } from '../../lib/appwrite.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';

const formatRole = (rawRole) => {
    const role = String(rawRole || '').trim();
    if (!role) {
        return 'Unknown';
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
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
        month: '2-digit',
        day: '2-digit',
    });
};

const RecentUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadRecentUsers = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    USERS_COLLECTION_ID,
                    [Query.orderDesc('$createdAt'), Query.limit(5)],
                );

                if (!isMounted) {
                    return;
                }

                setUsers(response?.documents || []);
            } catch (loadError) {
                if (!isMounted) {
                    return;
                }

                setUsers([]);
                setError(loadError?.message || 'Unable to load recent users.');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadRecentUsers();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <section className="admin-recent-users-card" aria-label="Recent users">
            <div className="admin-recent-users-header">
                <h2 className="admin-recent-users-title">Recent Users</h2>
                <Link to="/admin/users" className="admin-recent-users-manage-link">
                    Manage All
                </Link>
            </div>

            {loading ? <p className="admin-marketplace-note">Loading recent users...</p> : null}
            {error ? <p className="admin-marketplace-error">{error}</p> : null}

            <div className="admin-recent-users-list">
                {!loading && !error && users.length === 0 ? (
                    <p className="admin-recent-users-empty">No users found.</p>
                ) : null}

                {users.map((userDoc) => (
                    <article key={userDoc.$id} className="admin-recent-user-item">
                        <p className="admin-recent-user-name">{userDoc.name || 'Unnamed User'}</p>
                        <p className="admin-recent-user-email">{userDoc.email || 'No email'}</p>
                        <p className="admin-recent-user-meta">
                            {formatRole(userDoc.role)} • Joined {formatJoinedDate(userDoc.$createdAt)}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default RecentUsers;
