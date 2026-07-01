const VendorProfileStatsGrid = ({ metrics }) => {
    const items = [
        { label: 'Orders', value: Number(metrics.totalOrders || 0).toLocaleString() },
        { label: 'Reviews', value: Number(metrics.totalReviews || 0).toLocaleString() },
        { label: 'Wishlist', value: Number(metrics.wishlist || 0).toLocaleString() },
        { label: 'Rating', value: Number(metrics.averageRating || 0).toFixed(1) },
    ];

    return (
        <section className="vendor-profile-stats-grid">
            {items.map((item) => (
                <article key={item.label} className="vendor-profile-stat-card">
                    <h3>{item.value}</h3>
                    <p>{item.label}</p>
                </article>
            ))}
        </section>
    );
};

export default VendorProfileStatsGrid;
