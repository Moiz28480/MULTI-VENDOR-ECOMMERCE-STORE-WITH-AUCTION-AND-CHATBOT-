const SecuritySettings = ({ form, onChange, onSubmit, isSaving }) => (
    <form className="settings-form" onSubmit={onSubmit}>
        <h2>Security Settings</h2>

        <label className="settings-field">
            <span>Current Password</span>
            <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={onChange}
                required
            />
        </label>

        <label className="settings-field">
            <span>New Password</span>
            <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={onChange}
                required
            />
        </label>

        <label className="settings-field">
            <span>Confirm New Password</span>
            <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                required
            />
        </label>

        <div className="settings-inline-panel">
            <div>
                <p className="settings-inline-panel-title">Two-Factor Authentication</p>
                <p className="settings-inline-panel-subtitle">Add an extra layer of security</p>
            </div>
            <button type="button" className="settings-secondary-btn">Enable</button>
        </div>

        <button type="submit" className="settings-primary-btn" disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Password'}
        </button>
    </form>
);

export default SecuritySettings;
