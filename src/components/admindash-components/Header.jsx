import { Bell, Gem, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../lib/appwrite.js';
import { useAuth } from '../../lib/auth-context.js';
import { useAdminDashContext } from '../../context/AdminDashContext.jsx';

const Header = () => {
    const navigate = useNavigate();
    const { setUser, setRole } = useAuth();
    const { user } = useAdminDashContext();
    const displayName = String(user.email || 'moizn49@gmail.com').split('@')[0] || 'moizn49';

    const handleLogout = async () => {
        await logout();
        setUser(null);
        setRole(null);
        navigate('/login');
    };

    return (
        <header className="admin-marketplace-header">
            <div className="admin-marketplace-brand-wrap">
                <div className="admin-marketplace-logo-box" aria-hidden="true">
                    <Gem size={14} strokeWidth={2.2} />
                </div>
                <p className="admin-marketplace-brand">MarketPlace</p>

                <nav className="admin-marketplace-nav" aria-label="Admin navigation">
                    <a href="#" className="admin-marketplace-link admin-marketplace-link-active">
                        Dashboard
                    </a>
                    <a href="#" className="admin-marketplace-link">
                        Auctions
                    </a>
                </nav>
            </div>

            <div className="admin-marketplace-user-wrap">
                <button className="admin-marketplace-notification" type="button" aria-label="Notifications">
                    <Bell size={14} />
                </button>

                <button type="button" className="admin-logout-btn" onClick={handleLogout}>
                    Logout
                </button>

                <div className="admin-marketplace-user-block">
                    <div className="admin-marketplace-avatar" aria-hidden="true">
                        <UserCircle2 size={16} />
                    </div>
                    <div>
                        <p className="admin-marketplace-user-name">{displayName}</p>
                        <p className="admin-marketplace-user-email">{user.email}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
