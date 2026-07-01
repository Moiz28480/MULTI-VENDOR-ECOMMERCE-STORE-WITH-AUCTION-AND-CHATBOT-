import { useEffect, useMemo, useState } from 'react';
import { ID, Query } from 'appwrite';
import { Link, useNavigate } from 'react-router-dom';
import { databases, logout } from '../lib/appwrite.js';
import { useAuth } from '../lib/auth-context.js';
import { resolveVendorIdForUser } from '../components/vendor-dashboard-components/useVendorDashboardPageData.js';
import { CubeIcon, EyeIcon } from '../components/vendor-dashboard-components/VendorIcons.jsx';
import '../styling/vendorDash.css';

const DATABASE_ID = '69c1cfaf003a710f1232';
const ORDERS_COLLECTION_ID = 'orders';
const PRODUCTS_COLLECTION_ID = 'products';
const REVIEWS_COLLECTION_ID = 'reviews';
const COMPLAINTS_COLLECTION_ID = 'complaints';
const STATIC_TRACKING_NUMBER = 'TRK123456789';

const fetchAllDocuments = async (collectionId, baseQueries = []) => {
    const all = [];
    let cursor = null;

    do {
        const queries = [...baseQueries, Query.limit(100)];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
        const docs = response?.documents || [];

        all.push(...docs);
        cursor = docs.length ? docs[docs.length - 1].$id : null;

        if (docs.length < 100) {
            break;
        }
    } while (cursor);

    return all;
};

const toStatusKey = (status) => String(status || 'pending').trim().toLowerCase();

const toOrderPayload = (order, status) => ({
    customerId: order.customerId,
    vendorId: order.vendorId,
    productId: order.productId,
    quantity: Number(order.quantity ?? 1),
    totalAmount: Number(order.totalAmount ?? 0),
    status,
});

const toDateLabel = (dateValue) => {
    const date = new Date(dateValue || 0);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toISOString().slice(0, 10);
};

const addDays = (dateValue, days) => {
    const date = new Date(dateValue || 0);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    date.setDate(date.getDate() + days);
    return toDateLabel(date);
};

const OrdersPage = () => {
    const navigate = useNavigate();
    const { user, role, setUser, setRole } = useAuth();
    const isCustomer = String(role || '').toLowerCase() === 'customer';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState([]);
    const [busyOrderId, setBusyOrderId] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [openDetailOrderId, setOpenDetailOrderId] = useState('');
    const [reviewModalOrder, setReviewModalOrder] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [complaintModalOrder, setComplaintModalOrder] = useState(null);
    const [complaintCategory, setComplaintCategory] = useState('Damaged');
    const [complaintDescription, setComplaintDescription] = useState('');

    useEffect(() => {
        const loadOrders = async () => {
            setLoading(true);
            setError('');

            try {
                const userRole = String(role || '').toLowerCase();
                const orderQueries = [];

                if (userRole === 'customer' && user?.$id) {
                    orderQueries.push(Query.equal('customerId', [user.$id]));
                } else if (userRole === 'vendor') {
                    const resolvedVendorId = await resolveVendorIdForUser(user);
                    orderQueries.push(Query.equal('vendorId', [resolvedVendorId]));
                }

                const orderDocs = await fetchAllDocuments(ORDERS_COLLECTION_ID, orderQueries);

                const productIds = [...new Set(orderDocs.map((order) => order.productId).filter(Boolean))];

                const productDocs = await (
                    productIds.length
                        ? fetchAllDocuments(PRODUCTS_COLLECTION_ID, [Query.equal('$id', productIds)])
                        : Promise.resolve([])
                );

                const productMap = productDocs.reduce((map, product) => {
                    map[product.$id] = product;
                    return map;
                }, {});

                const normalizedOrders = orderDocs
                    .sort((a, b) => new Date(b.$createdAt || 0) - new Date(a.$createdAt || 0))
                    .map((order) => ({
                        ...order,
                        productName: productMap[order.productId]?.name || order.productId || '-',
                        productPrice: Number(productMap[order.productId]?.price ?? 0),
                    }));

                setOrders(normalizedOrders);
            } catch (loadError) {
                setError(loadError?.message || 'Unable to load orders.');
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [user, role]);

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setRole(null);
        navigate('/login');
    };

    const updateOrderStatus = async (order, nextStatus) => {
        if (!nextStatus) {
            return;
        }

        setBusyOrderId(order.$id);
        setError('');

        try {
            await databases.updateDocument(
                DATABASE_ID,
                ORDERS_COLLECTION_ID,
                order.$id,
                toOrderPayload(order, nextStatus),
            );

            setOrders((previous) => previous.map((item) => (
                item.$id === order.$id
                    ? { ...item, status: nextStatus }
                    : item
            )));

            if (openDetailOrderId === order.$id) {
                setOpenDetailOrderId('');
            }
        } catch (updateError) {
            setError(updateError?.message || 'Unable to update order status.');
        } finally {
            setBusyOrderId('');
        }
    };

    const cancelOrder = async (order) => {
        setBusyOrderId(order.$id);
        setError('');

        try {
            await databases.deleteDocument(DATABASE_ID, ORDERS_COLLECTION_ID, order.$id);
            setOrders((previous) => previous.filter((item) => item.$id !== order.$id));

            if (openDetailOrderId === order.$id) {
                setOpenDetailOrderId('');
            }
        } catch (deleteError) {
            setError(deleteError?.message || 'Unable to cancel order.');
        } finally {
            setBusyOrderId('');
        }
    };

    const openReviewModal = async (order) => {
        if (!isCustomer || !user?.$id || !order?.productId) {
            return;
        }

        setBusyOrderId(order.$id);
        setError('');

        try {
            const existing = await databases.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, [
                Query.equal('productId', [order.productId]),
                Query.equal('userId', [user.$id]),
                Query.limit(1),
            ]);

            if ((existing?.documents || []).length) {
                setError('You already submitted a review for this product.');
                return;
            }

            setReviewModalOrder(order);
            setReviewRating(5);
            setReviewComment('');
        } catch (reviewError) {
            setError(reviewError?.message || 'Unable to open review form.');
        } finally {
            setBusyOrderId('');
        }
    };

    const closeReviewModal = () => {
        setReviewModalOrder(null);
        setReviewRating(5);
        setReviewComment('');
    };

    const openComplaintModal = async (order) => {
        if (!isCustomer || !user?.$id || !order?.productId) {
            return;
        }

        setBusyOrderId(order.$id);
        setError('');

        try {
            const stableOrderId = String(order.orderId || order.$id || '').trim();
            if (!stableOrderId) {
                setError('Unable to resolve order id for complaint.');
                return;
            }

            const existing = await databases.listDocuments(DATABASE_ID, COMPLAINTS_COLLECTION_ID, [
                Query.equal('orderId', [stableOrderId]),
                Query.equal('userId', [user.$id]),
                Query.limit(1),
            ]);

            if ((existing?.documents || []).length) {
                setError('You already launched a complaint for this order.');
                return;
            }

            setComplaintModalOrder(order);
            setComplaintCategory('Damaged');
            setComplaintDescription('');
        } catch (complaintError) {
            setError(complaintError?.message || 'Unable to open complaint form.');
        } finally {
            setBusyOrderId('');
        }
    };

    const closeComplaintModal = () => {
        setComplaintModalOrder(null);
        setComplaintCategory('Damaged');
        setComplaintDescription('');
    };

    const submitComplaint = async () => {
        const order = complaintModalOrder;
        if (!isCustomer || !user?.$id || !order?.productId) {
            return;
        }

        setBusyOrderId(order.$id);
        setError('');

        try {
            const stableOrderId = String(order.orderId || order.$id || '').trim();
            if (!stableOrderId) {
                setError('Unable to resolve order id for complaint.');
                return;
            }

            const category = String(complaintCategory || '').trim();
            const description = String(complaintDescription || '').trim();

            if (!category) {
                setError('Please choose a complaint category.');
                return;
            }

            if (!description) {
                setError('Please describe the issue before submitting.');
                return;
            }

            await databases.createDocument(DATABASE_ID, COMPLAINTS_COLLECTION_ID, ID.unique(), {
                orderId: stableOrderId,
                userId: String(user.$id),
                category,
                description,
                status: 'Pending',
            });

            closeComplaintModal();
            window.alert('Complaint submitted successfully.');
        } catch (complaintError) {
            setError(complaintError?.message || 'Unable to launch complaint.');
        } finally {
            setBusyOrderId('');
        }
    };

    const addReview = async () => {
        const order = reviewModalOrder;
        if (!isCustomer || !user?.$id || !order?.productId) {
            return;
        }

        setBusyOrderId(order.$id);
        setError('');

        try {
            const rating = Number(reviewRating);
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                setError('Please select a valid rating between 1 and 5.');
                return;
            }

            const comment = String(reviewComment || '').trim();
            if (!comment) {
                setError('Please write your review in the comment box.');
                return;
            }

            await databases.createDocument(DATABASE_ID, REVIEWS_COLLECTION_ID, ID.unique(), {
                productId: String(order.productId),
                userId: String(user.$id),
                rating,
                comment,
            });

            closeReviewModal();
            window.alert('Review submitted successfully.');
        } catch (reviewError) {
            setError(reviewError?.message || 'Unable to submit review.');
        } finally {
            setBusyOrderId('');
        }
    };

    const launchComplaint = async (order) => {
        await openComplaintModal(order);
    };

    const toggleDetails = (orderId) => {
        setOpenDetailOrderId((previous) => (previous === orderId ? '' : orderId));
    };

    const summary = useMemo(() => ({
        total: orders.length,
        pending: orders.filter((order) => toStatusKey(order.status) === 'pending').length,
        processing: orders.filter((order) => toStatusKey(order.status) === 'processing').length,
        shipped: orders.filter((order) => toStatusKey(order.status) === 'shipped').length,
        delivered: orders.filter((order) => toStatusKey(order.status) === 'delivered').length,
    }), [orders]);

    const filteredOrders = useMemo(() => {
        if (activeFilter === 'all') {
            return orders;
        }

        return orders.filter((order) => toStatusKey(order.status) === activeFilter);
    }, [activeFilter, orders]);

    const orderFilters = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'processing', label: 'Processing' },
        { key: 'shipped', label: 'Shipped' },
        { key: 'delivered', label: 'Delivered' },
    ];

    const summaryCards = [
        { key: 'total', label: 'Total Orders', value: summary.total, iconClass: 'vendor-orders-stat-icon--blue' },
        { key: 'processing', label: 'Processing', value: summary.processing, iconClass: 'vendor-orders-stat-icon--orange' },
        { key: 'shipped', label: 'Shipped', value: summary.shipped, iconClass: 'vendor-orders-stat-icon--purple' },
        { key: 'delivered', label: 'Delivered', value: summary.delivered, iconClass: 'vendor-orders-stat-icon--green' },
    ];

    if (loading) {
        return (
            <div className="page-shell">
                <div className="loader">Loading orders...</div>
            </div>
        );
    }

    return (
        <div className="vendor-page-shell">
            <div className="vendor-dashboard-wrap">
                <div className="vendor-orders-page-topbar">
                    <div>
                        <h2>My Orders</h2>
                        <p className="orders-page-subtitle">{isCustomer ? 'Track your previous purchases' : 'Track and manage your orders'}</p>
                    </div>
                    <div className="orders-page-topbar-actions">
                        <button type="button" className="vendor-logout-btn" onClick={handleLogout}>Logout</button>
                        {isCustomer ? (
                            <Link to="/store-home" className="vendor-back-dashboard-btn">
                                Home
                            </Link>
                        ) : (
                            <Link to="/vendor-dashboard" className="vendor-back-dashboard-btn">
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>

                <section className="vendor-orders-stats-grid">
                    {summaryCards.map((card) => (
                        <article key={card.key} className="vendor-orders-stat-card">
                            <span className={`vendor-orders-stat-icon ${card.iconClass}`}>
                                <CubeIcon />
                            </span>
                            <h3>{card.value}</h3>
                            <p>{card.label}</p>
                        </article>
                    ))}
                </section>

                <section className="vendor-card vendor-orders-page-card">
                    <div className="vendor-orders-filters">
                        {orderFilters.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                className={`vendor-orders-filter-btn ${activeFilter === filter.key ? 'vendor-orders-filter-btn--active' : ''}`}
                                onClick={() => setActiveFilter(filter.key)}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {error ? <p className="vendor-dashboard-error">{error}</p> : null}

                    <div className="vendor-orders-list">
                        {filteredOrders.length ? (
                            filteredOrders.map((order) => {
                                const status = toStatusKey(order.status);
                                const quantity = Number(order.quantity ?? 1);
                                const totalAmount = Number(order.totalAmount ?? 0);
                                const unitPrice = order.productPrice > 0
                                    ? order.productPrice
                                    : quantity > 0
                                        ? totalAmount / quantity
                                        : totalAmount;
                                const isBusy = busyOrderId === order.$id;

                                return (
                                    <article key={order.$id} className="vendor-order-card">
                                        <div className="vendor-order-card-head">
                                            <div>
                                                <h3>
                                                    <span className="vendor-order-mini-icon">
                                                        <CubeIcon />
                                                    </span>
                                                    {order.$id}
                                                </h3>
                                                <p>Placed on {toDateLabel(order.$createdAt)}</p>
                                            </div>
                                            <span className={`vendor-order-status vendor-order-status--${status}`}>
                                                {status}
                                            </span>
                                        </div>

                                        <div className="vendor-order-card-grid">
                                            <div>
                                                <p className="vendor-order-card-label">Product</p>
                                                <strong>{order.productName}</strong>
                                            </div>
                                            <div>
                                                <p className="vendor-order-card-label">Total Amount</p>
                                                <strong>${totalAmount.toFixed(2)}</strong>
                                            </div>
                                            <div>
                                                <p className="vendor-order-card-label">
                                                    {status === 'delivered' ? 'Delivered On' : 'Estimated Delivery'}
                                                </p>
                                                <strong>
                                                    {status === 'delivered'
                                                        ? toDateLabel(order.$updatedAt || order.$createdAt)
                                                        : addDays(order.$createdAt, 3)}
                                                </strong>
                                            </div>
                                        </div>

                                        {status !== 'delivered' ? (
                                            <div className="vendor-order-tracking-box">
                                                <p>Tracking Number</p>
                                                <strong>{STATIC_TRACKING_NUMBER}</strong>
                                            </div>
                                        ) : null}

                                        <div className="vendor-order-card-actions">
                                            <button
                                                type="button"
                                                className="vendor-order-secondary-btn"
                                                onClick={() => toggleDetails(order.$id)}
                                            >
                                                <EyeIcon />
                                                {openDetailOrderId === order.$id ? 'Hide Details' : 'View Details'}
                                            </button>

                                            {isCustomer && status === 'delivered' ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="vendor-order-primary-btn"
                                                        disabled={isBusy}
                                                        onClick={() => openReviewModal(order)}
                                                    >
                                                        {isBusy ? 'Saving...' : 'Add Review'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="vendor-order-danger-btn"
                                                        disabled={isBusy}
                                                        onClick={() => launchComplaint(order)}
                                                    >
                                                        {isBusy ? 'Submitting...' : 'Launch Complaint'}
                                                    </button>
                                                </>
                                            ) : null}

                                            {isCustomer && status !== 'delivered' ? (
                                                <button
                                                    type="button"
                                                    className="vendor-order-danger-btn"
                                                    disabled={isBusy}
                                                    onClick={() => cancelOrder(order)}
                                                >
                                                    {isBusy ? 'Cancelling...' : 'Cancel Order'}
                                                </button>
                                            ) : null}

                                            {!isCustomer && status === 'pending' ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="vendor-order-primary-btn"
                                                        disabled={isBusy}
                                                        onClick={() => updateOrderStatus(order, 'processing')}
                                                    >
                                                        {isBusy ? 'Updating...' : 'Start Processing'}
                                                    </button>
                                                </>
                                            ) : null}

                                            {!isCustomer && (status === 'processing' || status === 'shipped') ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="vendor-order-primary-btn"
                                                        disabled={isBusy}
                                                        onClick={() => updateOrderStatus(order, 'delivered')}
                                                    >
                                                        {isBusy ? 'Updating...' : 'Delivered'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="vendor-order-danger-btn"
                                                        disabled={isBusy}
                                                        onClick={() => cancelOrder(order)}
                                                    >
                                                        {isBusy ? 'Cancelling...' : 'Cancel Order'}
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>

                                        {openDetailOrderId === order.$id ? (
                                            <div className="vendor-order-detail-box">
                                                <p><span>Order Number:</span> {order.$id}</p>
                                                <p><span>Product Name:</span> {order.productName}</p>
                                                <p><span>Product ID:</span> {order.productId || '-'}</p>
                                                <p><span>Price:</span> ${unitPrice.toFixed(2)}</p>
                                                <p><span>Quantity:</span> {quantity}</p>
                                            </div>
                                        ) : null}
                                    </article>
                                );
                            })
                        ) : (
                            <p className="vendor-orders-empty">No orders found.</p>
                        )}
                    </div>
                </section>

                {reviewModalOrder ? (
                    <div className="vendor-order-modal-overlay" role="dialog" aria-modal="true" aria-label="Add review form">
                        <article className="vendor-order-modal-card">
                            <h3>Add Review</h3>
                            <p className="vendor-order-modal-subtitle">Share your feedback for this delivered order.</p>

                            <div className="vendor-order-modal-details">
                                <p><span>Order:</span> {reviewModalOrder.$id}</p>
                                <p><span>Product:</span> {reviewModalOrder.productName || reviewModalOrder.productId}</p>
                                <p><span>Quantity:</span> {Number(reviewModalOrder.quantity ?? 1)}</p>
                                <p><span>Total:</span> ${Number(reviewModalOrder.totalAmount ?? 0).toFixed(2)}</p>
                            </div>

                            <div className="vendor-order-modal-rating">
                                <p>Rating</p>
                                <div className="vendor-order-rating-stars">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            className={`vendor-order-star-btn ${reviewRating >= value ? 'is-active' : ''}`}
                                            onClick={() => setReviewRating(value)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <label className="vendor-order-modal-comment">
                                <span>Your Review</span>
                                <textarea
                                    value={reviewComment}
                                    onChange={(event) => setReviewComment(event.target.value)}
                                    placeholder="Write your review here..."
                                    rows={4}
                                />
                            </label>

                            <div className="vendor-order-modal-actions">
                                <button type="button" className="vendor-order-secondary-btn" onClick={closeReviewModal}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="vendor-order-primary-btn"
                                    disabled={busyOrderId === reviewModalOrder.$id}
                                    onClick={addReview}
                                >
                                    {busyOrderId === reviewModalOrder.$id ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </article>
                    </div>
                ) : null}

                {complaintModalOrder ? (
                    <div className="vendor-order-modal-overlay" role="dialog" aria-modal="true" aria-label="Launch complaint form">
                        <article className="vendor-order-modal-card">
                            <h3>Launch Complaint</h3>
                            <p className="vendor-order-modal-subtitle">Complaint details are linked to the selected order automatically.</p>

                            <div className="vendor-order-modal-details">
                                <p><span>Order:</span> {complaintModalOrder.$id}</p>
                                <p><span>Product:</span> {complaintModalOrder.productName || complaintModalOrder.productId}</p>
                                <p><span>Product ID:</span> {complaintModalOrder.productId || '-'}</p>
                                <p><span>Vendor ID:</span> {complaintModalOrder.vendorId || '-'}</p>
                                <p><span>Order Status:</span> {String(complaintModalOrder.status || 'unknown')}</p>
                            </div>

                            <label className="vendor-order-modal-comment">
                                <span>Complaint Category</span>
                                <select
                                    value={complaintCategory}
                                    onChange={(event) => setComplaintCategory(event.target.value)}
                                >
                                    <option value="Damaged">Damaged</option>
                                    <option value="Defective">Defective</option>
                                    <option value="Missing Item">Missing Item</option>
                                    <option value="Wrong Item">Wrong Item</option>
                                    <option value="Quality">Quality</option>
                                    <option value="Late">Late</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>

                            <label className="vendor-order-modal-comment">
                                <span>Complaint Description</span>
                                <textarea
                                    value={complaintDescription}
                                    onChange={(event) => setComplaintDescription(event.target.value)}
                                    placeholder="Describe what happened, what is wrong, and what resolution you want..."
                                    rows={5}
                                />
                            </label>

                            <div className="vendor-order-modal-actions">
                                <button type="button" className="vendor-order-secondary-btn" onClick={closeComplaintModal}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="vendor-order-danger-btn"
                                    disabled={busyOrderId === complaintModalOrder.$id}
                                    onClick={submitComplaint}
                                >
                                    {busyOrderId === complaintModalOrder.$id ? 'Submitting...' : 'Submit Complaint'}
                                </button>
                            </div>
                        </article>
                    </div>
                ) : null}

                <div className="vendor-orders-page-topbar vendor-orders-page-topbar--bottom">
                    {isCustomer ? (
                        <Link to="/store-home" className="vendor-back-dashboard-btn">
                            Back to Home
                        </Link>
                    ) : (
                        <Link to="/vendor-dashboard" className="vendor-back-dashboard-btn">
                            Back to Dashboard
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
