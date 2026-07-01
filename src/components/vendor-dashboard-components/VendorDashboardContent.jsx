import { useState } from 'react';
import VendorDashboardHeader from './VendorDashboardHeader.jsx';
import VendorStatsGrid from './VendorStatsGrid.jsx';
import VendorSalesOverviewChart from './VendorSalesOverviewChart.jsx';
import VendorOrdersTrendChart from './VendorOrdersTrendChart.jsx';
import VendorCategoryPieChart from './VendorCategoryPieChart.jsx';
import VendorRecentOrdersList from './VendorRecentOrdersList.jsx';
import VendorInventoryTable from './VendorInventoryTable.jsx';
import AddProductForm from './AddProductForm.jsx';
import { useVendorDashboardContext } from '../../context/VendorDashboardContext.jsx';

const VendorDashboardContent = () => {
    const [showAddProductForm, setShowAddProductForm] = useState(false);
    const [showBrandNameForm, setShowBrandNameForm] = useState(false);
    const [showBrandLogoForm, setShowBrandLogoForm] = useState(false);
    const [brandNameInput, setBrandNameInput] = useState('');
    const [brandLogoFile, setBrandLogoFile] = useState(null);
    const [brandLogoFileName, setBrandLogoFileName] = useState('');
    const [brandSettingsError, setBrandSettingsError] = useState('');
    const [brandSettingsSuccess, setBrandSettingsSuccess] = useState('');
    const [savingBrandName, setSavingBrandName] = useState(false);
    const [savingBrandLogo, setSavingBrandLogo] = useState(false);

    const {
        hasShopName,
        shopName,
        shopLogo,
        vendorEmail,
        onLogout,
        onSaveBrandName,
        onSaveBrandLogo,
        onProductAdded,
        onProductsChanged,
        error,
        stats,
        salesOverviewData,
        ordersTrendData,
        categoryChartData,
        recentOrders,
        inventoryPreview,
    } = useVendorDashboardContext();

    const openBrandNameForm = () => {
        setShowBrandNameForm(true);
        setShowBrandLogoForm(false);
        setBrandNameInput(shopName || '');
        setBrandSettingsError('');
        setBrandSettingsSuccess('Please enter your brand name.');
    };

    const openBrandLogoForm = () => {
        setShowBrandLogoForm(true);
        setShowBrandNameForm(false);
        setBrandLogoFile(null);
        setBrandLogoFileName('');
        setBrandSettingsError('');
        setBrandSettingsSuccess('Please upload your brand logo.');
    };

    const handleSaveBrandName = async (event) => {
        event.preventDefault();
        setBrandSettingsError('');
        setBrandSettingsSuccess('');
        setSavingBrandName(true);

        try {
            const savedName = await onSaveBrandName(brandNameInput);
            setBrandSettingsSuccess(`Brand name saved: ${savedName}`);
            setShowBrandNameForm(false);
        } catch (saveError) {
            setBrandSettingsError(saveError?.message || 'Unable to save brand name.');
        } finally {
            setSavingBrandName(false);
        }
    };

    const handleBrandLogoChange = (event) => {
        const file = event.target.files?.[0] || null;
        setBrandLogoFile(file);
        setBrandLogoFileName(file?.name || '');
        setBrandSettingsError('');
        setBrandSettingsSuccess('');
    };

    const handleSaveBrandLogo = async (event) => {
        event.preventDefault();
        setBrandSettingsError('');
        setBrandSettingsSuccess('');
        setSavingBrandLogo(true);

        try {
            await onSaveBrandLogo(brandLogoFile);
            setBrandSettingsSuccess('Brand logo uploaded and saved successfully.');
            setShowBrandLogoForm(false);
            setBrandLogoFile(null);
            setBrandLogoFileName('');
        } catch (saveError) {
            setBrandSettingsError(saveError?.message || 'Unable to save brand logo.');
        } finally {
            setSavingBrandLogo(false);
        }
    };

    return (
        <div className="vendor-page-shell">
            <div className="vendor-dashboard-wrap">
                <VendorDashboardHeader
                    hasShopName={hasShopName}
                    shopName={shopName}
                    shopLogo={shopLogo}
                    email={vendorEmail}
                    onLogout={onLogout}
                    onAddBrandClick={openBrandNameForm}
                    onAddImageClick={openBrandLogoForm}
                    onAddProduct={() => setShowAddProductForm(true)}
                />

                {showBrandNameForm ? (
                    <section className="vendor-card vendor-brand-settings-card">
                        <div className="vendor-card-header">
                            <h2>Add Brand Name</h2>
                        </div>

                        <form className="vendor-brand-settings-form" onSubmit={handleSaveBrandName}>
                            <label className="vendor-brand-settings-label">
                                <span>Enter brand name</span>
                                <input
                                    type="text"
                                    value={brandNameInput}
                                    onChange={(event) => setBrandNameInput(event.target.value)}
                                    placeholder="Your brand name"
                                    required
                                />
                            </label>

                            <button type="submit" className="vendor-action-btn vendor-action-btn--brand" disabled={savingBrandName}>
                                {savingBrandName ? 'Saving...' : 'Save'}
                            </button>
                        </form>
                    </section>
                ) : null}

                {showBrandLogoForm ? (
                    <section className="vendor-card vendor-brand-settings-card">
                        <div className="vendor-card-header">
                            <h2>Add Brand Logo</h2>
                        </div>

                        <form className="vendor-brand-settings-form" onSubmit={handleSaveBrandLogo}>
                            <label className="vendor-brand-settings-label">
                                <span>Upload brand logo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBrandLogoChange}
                                    required
                                />
                            </label>

                            {brandLogoFileName ? <p className="vendor-brand-file-name">Selected: {brandLogoFileName}</p> : null}

                            <button type="submit" className="vendor-action-btn vendor-action-btn--image" disabled={savingBrandLogo}>
                                {savingBrandLogo ? 'Saving...' : 'Save'}
                            </button>
                        </form>
                    </section>
                ) : null}

                {brandSettingsError ? <p className="vendor-dashboard-error">{brandSettingsError}</p> : null}
                {brandSettingsSuccess ? <p className="vendor-brand-settings-success">{brandSettingsSuccess}</p> : null}

                {showAddProductForm ? (
                    <AddProductForm
                        embedded
                        onCancel={() => setShowAddProductForm(false)}
                        onSuccess={() => {
                            setShowAddProductForm(false);
                            onProductAdded();
                        }}
                    />
                ) : null}

                {error ? <p className="vendor-dashboard-error">{error}</p> : null}

                <VendorStatsGrid stats={stats} />

                <section className="dashboard-charts-grid">
                    <VendorSalesOverviewChart data={salesOverviewData} />
                    <VendorOrdersTrendChart data={ordersTrendData} />
                </section>

                <section className="vendor-middle-grid">
                    <VendorCategoryPieChart data={categoryChartData} />
                    <VendorRecentOrdersList orders={recentOrders} />
                </section>

                <VendorInventoryTable rows={inventoryPreview} onRowsChanged={onProductsChanged} />
            </div>
        </div>
    );
};

export default VendorDashboardContent;
