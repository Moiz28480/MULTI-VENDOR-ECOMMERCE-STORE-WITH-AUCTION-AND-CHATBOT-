const statusColors = {
    open: 'complaints-chip complaints-chip-open',
    pending: 'complaints-chip complaints-chip-open',
    'in progress': 'complaints-chip complaints-chip-progress',
    processing: 'complaints-chip complaints-chip-progress',
    resolved: 'complaints-chip complaints-chip-resolved',
    closed: 'complaints-chip complaints-chip-resolved',
};

const priorityColors = {
    high: 'complaints-chip complaints-chip-priority-high',
    medium: 'complaints-chip complaints-chip-priority-medium',
    low: 'complaints-chip complaints-chip-priority-low',
};

const ComplaintDetailView = ({ complaint }) => {
    if (!complaint) {
        return (
            <aside className="complaints-detail-card complaints-detail-card-empty">
                <div className="complaints-detail-empty-inner">
                    <div className="complaints-detail-empty-icon-wrap">
                        <svg
                            className="complaints-detail-empty-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="complaints-detail-empty-title">Select a Complaint</h3>
                    <p className="complaints-detail-empty-note">Click on a complaint to view details and take action</p>
                </div>
            </aside>
        );
    }

    const status = String(complaint.status || '').toLowerCase();
    const priority = String(complaint.priority || '').toLowerCase();
    const statusBadge = statusColors[status] || statusColors.open;
    const priorityBadge = priorityColors[priority] || priorityColors.low;

    return (
        <aside className="complaints-detail-card">
            <div className="complaints-detail-header">
                <h3 className="complaints-detail-id">{complaint.complaintId}</h3>
                <p className="complaints-detail-description">{complaint.description}</p>
            </div>

            <div className="complaints-detail-meta-row">
                <span className={statusBadge}>{String(complaint.status || 'Open').trim()}</span>
                <span className={priorityBadge}>{complaint.priority}</span>
            </div>

            <div className="complaints-detail-section">
                <p className="complaints-detail-label">Category</p>
                <p className="complaints-detail-value">{complaint.category}</p>
            </div>

            <div className="complaints-detail-section">
                <p className="complaints-detail-label">Date</p>
                <p className="complaints-detail-value">{complaint.date}</p>
            </div>

            <div className="complaints-detail-section">
                <p className="complaints-detail-label">Customer</p>
                <div className="complaints-detail-customer">
                    {complaint.userImage ? (
                        <img src={complaint.userImage} alt={complaint.userName} className="complaints-detail-avatar" />
                    ) : (
                        <div className="complaints-detail-avatar complaints-detail-avatar-fallback">
                            {complaint.userName?.[0] || '?'}
                        </div>
                    )}
                    <span className="complaints-detail-customer-name">{complaint.userName}</span>
                </div>
            </div>

            <div className="complaints-detail-section">
                <p className="complaints-detail-label">Order Details</p>
                <div className="complaints-detail-kv">
                    <p>
                        <span>Order ID</span>
                        <strong>{complaint.orderId || 'N/A'}</strong>
                    </p>
                    <p>
                        <span>Product</span>
                        <strong>{complaint.productName || 'N/A'}</strong>
                    </p>
                    <p>
                        <span>Vendor ID</span>
                        <strong>{complaint.vendorId || 'N/A'}</strong>
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default ComplaintDetailView;
