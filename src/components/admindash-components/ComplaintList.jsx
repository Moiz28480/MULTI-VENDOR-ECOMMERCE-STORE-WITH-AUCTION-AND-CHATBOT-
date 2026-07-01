import ComplaintCard from './ComplaintCard.jsx';

const ComplaintList = ({ complaints, selectedComplaintId, onSelectComplaint, loading }) => {
    if (loading) {
        return (
            <div className="complaints-list-empty-wrap">
                <div className="complaints-list-spinner-block">
                    <div className="complaints-list-spinner" />
                    <p className="complaints-list-helper">Loading complaints...</p>
                </div>
            </div>
        );
    }

    if (complaints.length === 0) {
        return (
            <div className="complaints-list-empty-wrap">
                <p className="complaints-list-helper">No complaints found.</p>
            </div>
        );
    }

    return (
        <div className="complaints-list-stack">
            {complaints.map((complaint) => (
                <ComplaintCard
                    key={complaint.$id}
                    complaint={complaint}
                    isSelected={selectedComplaintId === complaint.$id}
                    onSelect={() => onSelectComplaint(complaint)}
                />
            ))}
        </div>
    );
};

export default ComplaintList;
