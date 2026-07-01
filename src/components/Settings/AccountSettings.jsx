const AccountSettings = ({ form, onChange, onSubmit, isSaving }) => (
    <form className="settings-form" onSubmit={onSubmit}>
        <h2>Account Settings</h2>

        <label className="settings-field">
            <span>Full Name</span>
            <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={onChange}
                placeholder="John Doe"
                required
            />
        </label>

        <label className="settings-field">
            <span>Email Address</span>
            <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="john@example.com"
                required
            />
        </label>

        <label className="settings-field">
            <span>Phone Number</span>
            <input
                type="text"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={onChange}
                placeholder="03XXXXXXXXX"
                inputMode="numeric"
                maxLength={11}
                pattern="[0-9]{11}"
                title="Phone number must be exactly 11 digits"
            />
        </label>

        <label className="settings-field">
            <span>Current Password (required only when changing email)</span>
            <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={onChange}
                placeholder="Enter current password"
            />
        </label>

        <button type="submit" className="settings-primary-btn" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
    </form>
);

export default AccountSettings;
