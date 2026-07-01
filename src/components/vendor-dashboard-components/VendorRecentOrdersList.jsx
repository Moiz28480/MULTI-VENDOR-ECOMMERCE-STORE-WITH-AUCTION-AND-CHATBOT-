const formatOrderDate = (rawDate) => {
    if (!rawDate) {
        return '-';
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

const VendorRecentOrdersList = ({ orders = [] }) => {
    return (
        <section className="vendor-card vendor-recent-orders-card">
            <div className="vendor-card-header">
                <h2>Recent Orders</h2>
            </div>

            {orders.length ? (
                <ul className="vendor-recent-orders-list">
                    {orders.map((order) => (
                        <li key={order.$id} className="vendor-recent-order-item">
                            <div>
                                <p className="vendor-order-id">#{order.$id}</p>
                                <p className="vendor-order-meta">{order.customerName}</p>
                                <p className="vendor-order-meta">{order.productName}</p>
                            </div>

                            <div className="vendor-order-right-col">
                                <p className="vendor-order-price">${Number(order.totalAmount ?? order.totalPrice ?? 0).toLocaleString()}</p>
                                <p className="vendor-order-date">{formatOrderDate(order.$createdAt)}</p>
                                <span className={`vendor-order-status vendor-order-status--${String(order.status || 'unknown').toLowerCase()}`}>
                                    {order.status || 'Unknown'}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="vendor-empty-message">No recent orders for your store.</p>
            )}
        </section>
    );
};

export default VendorRecentOrdersList;
