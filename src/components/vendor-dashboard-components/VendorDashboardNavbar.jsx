const VendorDashboardNavbar = ({ email, onLogout }) => {
    return (
        <nav className="vendor-top-nav">
            <div className="vendor-top-nav__left">
                <div className="vendor-logo-badge" aria-hidden="true">◻</div>
                <span className="vendor-brand">MarketPlace</span>
                <a href="#" className="vendor-nav-link vendor-nav-link--active">Dashboard</a>
                <a href="#" className="vendor-nav-link">Auctions</a>
                <a href="#" className="vendor-nav-link">Orders</a>
            </div>

            <div className="vendor-top-nav__right">
                <button type="button" className="vendor-bell-btn" aria-label="Notifications">
                    ◌
                </button>

                <div className="vendor-profile-block">
                    <div className="vendor-avatar" aria-hidden="true">👤</div>
                    <div className="vendor-profile-text">
                        <p className="vendor-profile-name">Vendor</p>
                        <p className="vendor-profile-email">{email || 'No email available'}</p>
                    </div>
                </div>

                <button type="button" className="vendor-logout-btn" onClick={onLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default VendorDashboardNavbar;
