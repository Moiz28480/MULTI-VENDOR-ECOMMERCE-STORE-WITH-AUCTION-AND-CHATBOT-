import { useState } from 'react';
import { useAdminDashContext } from '../../context/AdminDashContext.jsx';
import ComplaintStats from './ComplaintStats.jsx';
import ComplaintList from './ComplaintList.jsx';
import ComplaintDetailView from './ComplaintDetailView.jsx';

const ComplaintManagement = () => {
    const { allComplaints, complaintStats, loading, error } = useAdminDashContext();
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [priorityFilter, setPriorityFilter] = useState('All Priority');

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredComplaints = allComplaints.filter((complaint) => {
        const statusValue = String(complaint.status || '').trim().toLowerCase();
        const priorityValue = String(complaint.priority || '').trim().toLowerCase();
        const categoryValue = String(complaint.category || '').trim().toLowerCase();
        const nameValue = String(complaint.userName || '').trim().toLowerCase();
        const descriptionValue = String(complaint.description || '').trim().toLowerCase();
        const complaintIdValue = String(complaint.complaintId || '').trim().toLowerCase();

        const matchesSearch =
            !normalizedSearch ||
            complaintIdValue.includes(normalizedSearch) ||
            descriptionValue.includes(normalizedSearch) ||
            nameValue.includes(normalizedSearch) ||
            categoryValue.includes(normalizedSearch);

        const matchesStatus =
            statusFilter === 'All Status' || statusValue === statusFilter.toLowerCase();
        const matchesPriority =
            priorityFilter === 'All Priority' || priorityValue === priorityFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
        <section className="complaints-page-shell">
            <div className="complaints-page-header">
                <h1 className="complaints-page-title">Complaint Management</h1>
                <p className="complaints-page-subtitle">Monitor and resolve customer complaints</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="complaints-error-banner">
                    <p>{error}</p>
                </div>
            )}

            {/* Stats */}
            <ComplaintStats stats={complaintStats} />

            <div className="complaints-main-grid">
                <div className="complaints-main-left">
                    <div className="complaints-filters-card">
                        <div className="complaints-search-wrap">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="complaints-search-input"
                                placeholder="Search complaints..."
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="complaints-filter-select"
                        >
                            <option>All Status</option>
                            <option>Open</option>
                            <option>Pending</option>
                            <option>In Progress</option>
                            <option>Resolved</option>
                            <option>Closed</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(event) => setPriorityFilter(event.target.value)}
                            className="complaints-filter-select"
                        >
                            <option>All Priority</option>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                        </select>
                    </div>

                    <div className="complaints-list-panel">
                        <h2 className="complaints-list-title">All Complaints</h2>
                        <ComplaintList
                            complaints={filteredComplaints}
                            selectedComplaintId={selectedComplaint?.$id}
                            onSelectComplaint={setSelectedComplaint}
                            loading={loading}
                        />
                    </div>
                </div>

                <div className="complaints-main-right">
                    <ComplaintDetailView complaint={selectedComplaint} />
                </div>
            </div>
        </section>
    );
};

export default ComplaintManagement;
