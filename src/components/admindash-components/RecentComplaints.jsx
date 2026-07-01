import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAdminDashContext } from '../../context/AdminDashContext.jsx';

const statusClassNameMap = {
    Open: 'admin-complaint-status admin-complaint-status-open',
    Pending: 'admin-complaint-status admin-complaint-status-open',
    'In Progress': 'admin-complaint-status admin-complaint-status-in-progress',
    Processing: 'admin-complaint-status admin-complaint-status-in-progress',
    Resolved: 'admin-complaint-status admin-complaint-status-resolved',
    Closed: 'admin-complaint-status admin-complaint-status-resolved',
};

const priorityClassNameMap = {
    High: 'admin-complaint-priority admin-complaint-priority-high',
    Medium: 'admin-complaint-priority admin-complaint-priority-medium',
    Low: 'admin-complaint-priority admin-complaint-priority-low',
};

const RecentComplaints = () => {
    const { recentComplaints, loading, error } = useAdminDashContext();

    return (
        <section className="admin-recent-users-card" aria-label="Recent complaints">
            <div className="admin-recent-users-header">
                <h2 className="admin-recent-users-title admin-recent-complaints-title">
                    <MessageSquare size={14} strokeWidth={2} aria-hidden="true" />
                    <span>Recent Complaints</span>
                </h2>
                <Link to="/admin/complaints" className="admin-recent-users-manage-link">
                    View All
                </Link>
            </div>

            {loading ? <p className="admin-marketplace-note">Loading recent complaints...</p> : null}
            {error ? <p className="admin-marketplace-error">{error}</p> : null}

            <div className="admin-recent-users-list">
                {!loading && !error && recentComplaints.length === 0 ? (
                    <p className="admin-recent-users-empty">No complaints found.</p>
                ) : null}

                {recentComplaints.map((complaint) => {
                    const statusValue = String(complaint.status || '').trim();
                    const statusClassName = statusClassNameMap[statusValue] || statusClassNameMap.Open;
                    const priorityClassName =
                        priorityClassNameMap[complaint.priority] || priorityClassNameMap.Low;

                    return (
                        <article key={complaint.complaintId} className="admin-recent-complaint-item">
                            <div className="admin-recent-complaint-row">
                                <div className="admin-recent-complaint-content">
                                    <p className="admin-recent-complaint-id">{complaint.complaintId}</p>
                                    <p className="admin-recent-complaint-description">{complaint.description}</p>
                                    <p className="admin-recent-complaint-user">{complaint.userName}</p>
                                </div>

                                <div className="admin-recent-complaint-meta">
                                    <span className={statusClassName}>{statusValue || 'Open'}</span>
                                    <p className="admin-recent-complaint-footer">
                                        <span className={priorityClassName}>{complaint.priority}</span>
                                        <span className="admin-complaint-date">{complaint.date}</span>
                                    </p>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default RecentComplaints;