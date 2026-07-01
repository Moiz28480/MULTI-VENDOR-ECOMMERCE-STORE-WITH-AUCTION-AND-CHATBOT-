const StatCard = ({ icon, label, value, percentageChange, iconClassName = '', trendClassName = '' }) => {
    return (
        <article className="admin-stat-card">
            <div className={`admin-stat-icon ${iconClassName}`.trim()}>
                {icon}
            </div>

            <p className={`admin-stat-trend ${trendClassName}`.trim()}>{percentageChange}</p>

            <h3 className="admin-stat-value">{value}</h3>
            <p className="admin-stat-label">{label}</p>
        </article>
    );
};

export default StatCard;
