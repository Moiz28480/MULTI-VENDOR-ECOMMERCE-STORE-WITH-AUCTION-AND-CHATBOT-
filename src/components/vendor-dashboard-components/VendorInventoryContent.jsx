import { Link } from 'react-router-dom';
import VendorDashboardHeader from './VendorDashboardHeader.jsx';
import VendorInventoryTable from './VendorInventoryTable.jsx';
import { useVendorDashboardContext } from '../../context/VendorDashboardContext.jsx';

const VendorInventoryContent = () => {
    const {
        hasShopName,
        shopName,
        shopLogo,
        vendorEmail,
        onLogout,
        onProductsChanged,
        error,
        inventoryRows,
    } = useVendorDashboardContext();

    return (
        <div className="vendor-page-shell">
            <div className="vendor-dashboard-wrap">
                <VendorDashboardHeader
                    hasShopName={hasShopName}
                    shopName={shopName}
                    shopLogo={shopLogo}
                    email={vendorEmail}
                    onLogout={onLogout}
                />

                <div className="vendor-inventory-page-topbar">
                    <h2>All Inventory Items</h2>
                    <Link to="/vendor-dashboard" className="vendor-view-all-link">Back to Dashboard</Link>
                </div>

                {error ? <p className="vendor-dashboard-error">{error}</p> : null}

                <VendorInventoryTable rows={inventoryRows} showAll onRowsChanged={onProductsChanged} />
            </div>
        </div>
    );
};

export default VendorInventoryContent;
