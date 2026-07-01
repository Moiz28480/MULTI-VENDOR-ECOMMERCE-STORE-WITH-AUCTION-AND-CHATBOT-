import { Link, NavLink } from 'react-router-dom';
import { ImageIcon, PlusIcon, TagIcon } from './VendorIcons.jsx';

const VendorDashboardHeader = ({
    hasShopName,
    shopName,
    shopLogo,
    email,
    onLogout,
    onAddBrandClick,
    onAddImageClick,
    onAddProduct,
    roleLabel = 'Vendor',
    hideDashboardHeader = false,
}) => {
    const canManageBrand = Boolean(onAddBrandClick || onAddImageClick);
    const canAddProduct = Boolean(onAddProduct);

    return (
        <header className="vendor-header-shell">
            <nav className="vendor-top-nav">
                <div className="vendor-top-nav__left">
                    <div className="vendor-logo-badge" aria-hidden="true">◻</div>
                    <span className="vendor-brand">MarketPlace</span>
                    <NavLink to="/vendor-dashboard" className={({ isActive }) => `vendor-nav-link${isActive ? ' vendor-nav-link--active' : ''}`}>Dashboard</NavLink>
                    <NavLink to="/orders" className={({ isActive }) => `vendor-nav-link${isActive ? ' vendor-nav-link--active' : ''}`}>Orders</NavLink>
                    <NavLink to="/inventory" className={({ isActive }) => `vendor-nav-link${isActive ? ' vendor-nav-link--active' : ''}`}>Inventory</NavLink>
                </div>

                <div className="vendor-top-nav__right">
                    <button type="button" className="vendor-bell-btn" aria-label="Notifications">
                        ◌
                    </button>

                    <Link to="/vendor-profile" className="vendor-profile-link" aria-label={`Open ${roleLabel.toLowerCase()} profile`}>
                        <div className="vendor-profile-block">
                        {shopLogo ? (
                            <img src={shopLogo} alt="Brand logo" className="vendor-avatar vendor-avatar--image" />
                        ) : (
                            <div className="vendor-avatar" aria-hidden="true">👤</div>
                        )}
                        <div className="vendor-profile-text">
                            <p className="vendor-profile-name">{roleLabel}</p>
                            <p className="vendor-profile-email">{email || 'No email available'}</p>
                        </div>
                        </div>
                    </Link>

                    <button type="button" className="vendor-logout-btn" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {!hideDashboardHeader ? (
                <div className="vendor-dashboard-header">
                    <div>
                        <h1>{hasShopName ? `${shopName} Dashboard` : 'Vendor Dashboard'}</h1>
                        <p>Monitor your sales and manage your products</p>
                    </div>

                    <div className="vendor-action-row">
                        {canManageBrand ? (
                            <>
                                <button type="button" className="vendor-action-btn vendor-action-btn--brand" onClick={onAddBrandClick}>
                                    <span className="vendor-action-btn__icon"><TagIcon /></span>
                                    {hasShopName ? 'Edit Brand' : 'Add Brand'}
                                </button>
                                <button type="button" className="vendor-action-btn vendor-action-btn--image" onClick={onAddImageClick}>
                                    <span className="vendor-action-btn__icon"><ImageIcon /></span>
                                    Add Image
                                </button>
                            </>
                        ) : null}
                        {canAddProduct ? (
                            <button type="button" className="vendor-action-btn vendor-action-btn--product" onClick={onAddProduct}>
                                <span className="vendor-action-btn__icon"><PlusIcon /></span>
                                Add Product
                            </button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </header>
    );
};

export default VendorDashboardHeader;
