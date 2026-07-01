import VendorStatCard from './VendorStatCard.jsx';
import { BagIcon, CubeIcon, DollarIcon, EyeIcon } from './VendorIcons.jsx';

const formatCurrency = (value) => {
    return `$${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
};

const VendorStatsGrid = ({ stats }) => {
    return (
        <section className="vendor-stats-grid">
            <VendorStatCard
                title="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                icon={<DollarIcon />}
                variant="green"
                change="+12.5%"
            />
            <VendorStatCard
                title="Total Orders"
                value={Number(stats.totalOrders).toLocaleString()}
                icon={<BagIcon />}
                variant="blue"
                change="+8.2%"
            />
            <VendorStatCard
                title="Products Sold"
                value={Number(stats.productsSold).toLocaleString()}
                icon={<CubeIcon />}
                variant="purple"
                change="+15.3%"
            />
            <VendorStatCard
                title="Total Views"
                value={Number(stats.totalViews).toLocaleString()}
                icon={<EyeIcon />}
                variant="orange"
                change="+23.1%"
            />
        </section>
    );
};

export default VendorStatsGrid;
