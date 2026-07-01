const VendorOrdersTable = ({ orders }) => {
    return (
        <section className="vendor-orders-table-shell">
            <div className="vendor-orders-table-head">
                <h2>Recent Orders</h2>
            </div>

            <div className="vendor-orders-table-wrap">
                <table className="vendor-orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Product ID</th>
                            <th>Status</th>
                            <th>Quantity</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length ? (
                            orders.map((order) => (
                                <tr key={order.$id}>
                                    <td>{order.$id}</td>
                                    <td>{order.productId || '-'}</td>
                                    <td>
                                        <span className={`vendor-order-status vendor-order-status--${String(order.status || 'unknown').toLowerCase()}`}>
                                            {order.status || 'unknown'}
                                        </span>
                                    </td>
                                    <td>{order.quantity ?? 0}</td>
                                    <td>${Number(order.totalPrice ?? order.totalAmount ?? 0).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="vendor-orders-empty">No orders found for your shop yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default VendorOrdersTable;
