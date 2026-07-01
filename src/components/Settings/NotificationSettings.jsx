const NotificationSettings = ({ allowNotifications, onToggle, onSave, isSaving }) => (
    <section className="settings-form">
        <h2>Notification Preferences</h2>

        <div className="settings-toggle-row">
            <div>
                <p className="settings-toggle-title">Allow Notifications</p>
                <p className="settings-toggle-subtitle">Receive notifications for updates and alerts</p>
            </div>

            <button
                type="button"
                className={`settings-toggle-switch ${allowNotifications ? 'settings-toggle-switch--on' : ''}`}
                onClick={onToggle}
                aria-pressed={allowNotifications}
            >
                <span className="settings-toggle-knob" />
            </button>
        </div>

        <button type="button" className="settings-primary-btn" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
    </section>
);

export default NotificationSettings;
