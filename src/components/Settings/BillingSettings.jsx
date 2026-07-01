const BillingSettings = ({
    form,
    showForm,
    onOpenForm,
    onChange,
    onSubmit,
    isSaving,
    maskedCardNumber,
}) => (
    <section className="settings-form">
        <h2>Billing Information</h2>

        {!showForm && form.cardNumber ? (
            <div className="settings-billing-card">
                <div>
                    <p className="settings-billing-card-number">{maskedCardNumber}</p>
                    <p className="settings-billing-card-expiry">Expires {form.expiryDate || '--/--'}</p>
                </div>
                <span className="settings-billing-default-badge">Default</span>
            </div>
        ) : (
            <button type="button" className="settings-billing-add-btn" onClick={onOpenForm}>
                + Add New Payment Method
            </button>
        )}

        {showForm ? (
            <form className="settings-sub-form" onSubmit={onSubmit}>
                <label className="settings-field">
                    <span>Card Number</span>
                    <input
                        type="text"
                        name="cardNumber"
                        value={form.cardNumber}
                        onChange={onChange}
                        placeholder="4242 4242 4242 4242"
                        required
                    />
                </label>

                <label className="settings-field">
                    <span>Expiry Date</span>
                    <input
                        type="text"
                        name="expiryDate"
                        value={form.expiryDate}
                        onChange={onChange}
                        placeholder="12/26"
                        required
                    />
                </label>

                <label className="settings-field">
                    <span>CVC</span>
                    <input
                        type="password"
                        name="cvc"
                        value={form.cvc}
                        onChange={onChange}
                        placeholder="123"
                        required
                    />
                </label>

                <button type="submit" className="settings-primary-btn" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Payment Method'}
                </button>
            </form>
        ) : null}

        <div className="settings-billing-history">
            <h3>Billing History</h3>
            <div className="settings-billing-history-row">
                <span>March 2026</span>
                <strong>$99.00</strong>
            </div>
            <div className="settings-billing-history-row">
                <span>February 2026</span>
                <strong>$99.00</strong>
            </div>
            <div className="settings-billing-history-row">
                <span>January 2026</span>
                <strong>$99.00</strong>
            </div>
        </div>
    </section>
);

export default BillingSettings;
