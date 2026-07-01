import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { logout } from '../lib/appwrite.js';
import { useAuth } from '../lib/auth-context.js';
import VendorDashboardHeader from '../components/vendor-dashboard-components/VendorDashboardHeader.jsx';
import VendorProfileHeroCard from '../components/vendor-dashboard-components/VendorProfileHeroCard.jsx';
import VendorProfileStatsGrid from '../components/vendor-dashboard-components/VendorProfileStatsGrid.jsx';
import VendorProfileInfoCard from '../components/vendor-dashboard-components/VendorProfileInfoCard.jsx';
import useVendorProfileData from '../components/vendor-dashboard-components/useVendorProfileData.js';
import '../styling/vendorDash.css';

const VendorProfile = () => {
    const navigate = useNavigate();
    const { user, setUser, setRole } = useAuth();
    const { loading, error, profile, metrics, infoItems } = useVendorProfileData(user);
    const roleLabel = profile?.roleLabel || 'User';
    const dashboardPath = String(roleLabel || '').trim().toLowerCase() === 'vendor'
        ? '/vendor-dashboard'
        : '/store-home';

    const handleLogout = useCallback(async () => {
        await logout();
        setUser(null);
        setRole(null);
        navigate('/login');
    }, [navigate, setRole, setUser]);

    if (loading) {
        return (
            <div className="page-shell">
                <div className="loader">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="vendor-page-shell">
            <div className="vendor-dashboard-wrap vendor-profile-wrap">
                <VendorDashboardHeader
                    hasShopName={Boolean(profile.shopName)}
                    shopName={profile.shopName}
                    shopLogo={profile.shopLogo}
                    email={profile.email}
                    roleLabel={roleLabel}
                    onLogout={handleLogout}
                    hideDashboardHeader
                />

                {error ? <p className="vendor-dashboard-error">{error}</p> : null}

                <div className="vendor-profile-topbar">
                    <h2>{roleLabel} Profile</h2>
                    <div className="vendor-profile-topbar-actions">
                        <Link to="/settings" className="vendor-back-dashboard-btn vendor-back-dashboard-btn--profile">
                            Edit your info
                        </Link>
                        <Link to={dashboardPath} className="vendor-back-dashboard-btn vendor-back-dashboard-btn--profile">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                <VendorProfileHeroCard shopName={profile.shopName} shopLogo={profile.shopLogo} roleLabel={roleLabel} />
                <VendorProfileStatsGrid metrics={metrics} />
                <VendorProfileInfoCard items={infoItems} />
            </div>
        </div>
    );
};

export default VendorProfile;
