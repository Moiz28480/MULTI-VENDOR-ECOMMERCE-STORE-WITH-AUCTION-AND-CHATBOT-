const VendorStatCard = ({ title, value, subtitle, icon, variant, change }) => {
    return (
        <article className="vendor-stat-card">
            <div className="vendor-stat-card__top">
                <span className={`vendor-stat-icon vendor-stat-icon--${variant || 'purple'}`} aria-hidden="true">
                    {icon}
                </span>
                {change ? <span className="vendor-stat-change">{change}</span> : null}
            </div>
            <h3 className="vendor-stat-value">{value}</h3>
            <p className="vendor-stat-title">{title}</p>
            {subtitle ? <p className="vendor-stat-subtitle">{subtitle}</p> : null}
        </article>
    );
};

export default VendorStatCard;
