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

const ComplaintCard = ({ complaint, isSelected, onSelect }) => {
    const status = String(complaint.status || '').toLowerCase();
    const priority = String(complaint.priority || '').toLowerCase();
    const statusBadge = statusColors[status] || statusColors.open;
    const priorityChip = priorityColors[priority] || priorityColors.low;

    return (
        <div
            onClick={onSelect}
            className={`complaints-card ${
                isSelected ? 'complaints-card-selected' : ''
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect();
                }
            }}
        >
            <div className="complaints-card-top">
                <div className="complaints-card-user-wrap">
                    {complaint.userImage ? (
                        <img
                            src={complaint.userImage}
                            alt={complaint.userName}
                            className="complaints-card-avatar"
                        />
                    ) : (
                        <div className="complaints-card-avatar complaints-card-avatar-fallback">
                            {complaint.userName?.[0] || '?'}
                        </div>
                    )}
                    <div>
                        <p className="complaints-card-id">{complaint.complaintId}</p>
                        <p className="complaints-card-user">{complaint.userName}</p>
                    </div>
                </div>
                <span className={statusBadge}>{String(complaint.status || 'Open').trim()}</span>
            </div>

            <h3 className="complaints-card-title">{complaint.description}</h3>

            <div className="complaints-card-body">{complaint.rawComplaint?.orderIssue || complaint.rawComplaint?.details || ''}</div>

            <div className="complaints-card-footer">
                <div className="complaints-card-tags">
                    <span className={priorityChip}>{complaint.priority}</span>
                    <span className="complaints-chip complaints-chip-category">{complaint.category}</span>
                </div>
                <span className="complaints-card-date">{complaint.date}</span>
            </div>
        </div>
    );
};

export default ComplaintCard;
