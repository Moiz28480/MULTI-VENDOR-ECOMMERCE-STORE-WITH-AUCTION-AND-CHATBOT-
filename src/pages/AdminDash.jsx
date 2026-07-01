import { AlertTriangle, DollarSign, Store, Users } from 'lucide-react';
import GrowthChart from '../components/admindash-components/GrowthChart.jsx';
import Header from '../components/admindash-components/Header.jsx';
import RecentComplaints from '../components/admindash-components/RecentComplaints.jsx';
import RecentUsers from '../components/admindash-components/RecentUsers.jsx';
import RevenueChart from '../components/admindash-components/RevenueChart.jsx';
import StatCard from '../components/admindash-components/StatCard.jsx';
import SystemHealth from '../components/admindash-components/SystemHealth.jsx';
import { AdminDashProvider, useAdminDashContext } from '../context/AdminDashContext.jsx';
import '../styling/adminDash.css';

const formatRevenue = (value) => {
    return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const AdminDashContent = () => {
    const { stats, percentageChanges, loading, error } = useAdminDashContext();

    return (
        <div className="admin-marketplace-page">
            <div className="admin-marketplace-shell">
                <Header />

                <main className="admin-marketplace-content">
                    <h1 className="admin-marketplace-title">Admin Dashboard</h1>
                    <p className="admin-marketplace-subtitle">
                        Monitor system health and manage the marketplace
                    </p>

                    {loading ? <p className="admin-marketplace-note">Loading database stats...</p> : null}
                    {error ? <p className="admin-marketplace-error">{error}</p> : null}

                    <section className="admin-stats-grid" aria-label="Admin key metrics">
                        <StatCard
                            icon={<Users size={18} />}
                            label="Total Users"
                            value={stats.totalUsers.toLocaleString()}
                            percentageChange={percentageChanges.totalUsers}
                            iconClassName="admin-stat-icon-blue"
                            trendClassName="admin-stat-trend-positive"
                        />

                        <StatCard
                            icon={<Store size={18} />}
                            label="Active Vendors"
                            value={stats.activeVendors.toLocaleString()}
                            percentageChange={percentageChanges.activeVendors}
                            iconClassName="admin-stat-icon-green"
                            trendClassName="admin-stat-trend-positive"
                        />

                        <StatCard
                            icon={<DollarSign size={18} />}
                            label="Total Revenue"
                            value={formatRevenue(stats.totalRevenue)}
                            percentageChange={percentageChanges.totalRevenue}
                            iconClassName="admin-stat-icon-purple"
                            trendClassName="admin-stat-trend-positive"
                        />

                        <StatCard
                            icon={<AlertTriangle size={18} />}
                            label="Fraud Alerts"
                            value={stats.fraudAlerts.toLocaleString()}
                            percentageChange={percentageChanges.fraudAlerts}
                            iconClassName="admin-stat-icon-red"
                            trendClassName="admin-stat-trend-negative"
                        />
                    </section>

                    <section className="admin-charts-grid" aria-label="Admin trend charts">
                        <GrowthChart
                            totalUsers={stats.totalUsers}
                            activeVendors={stats.activeVendors}
                        />
                        <RevenueChart totalRevenue={stats.totalRevenue} />
                    </section>

                    <section className="admin-recent-activity-grid" aria-label="Recent activity">
                        <RecentUsers />
                        <RecentComplaints />
                    </section>

                    <SystemHealth />
                </main>
            </div>
        </div>
    );
};

const AdminDash = () => {
    return (
        <AdminDashProvider>
            <AdminDashContent />
        </AdminDashProvider>
    );
};

export default AdminDash;
