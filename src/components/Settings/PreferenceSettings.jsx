const PreferenceSettings = ({ form, onChange, onSubmit }) => (
    <form className="settings-form" onSubmit={onSubmit}>
        <h2>Preference Settings</h2>

        <label className="settings-field">
            <span>Language</span>
            <select name="language" value={form.language} onChange={onChange}>
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
                <option value="Arabic">Arabic</option>
            </select>
        </label>

        <label className="settings-field">
            <span>Timezone</span>
            <select name="timezone" value={form.timezone} onChange={onChange}>
                <option value="UTC+05:00">UTC+05:00</option>
                <option value="UTC+00:00">UTC+00:00</option>
                <option value="UTC-05:00">UTC-05:00</option>
            </select>
        </label>

        <button type="submit" className="settings-primary-btn">Save Preferences</button>
    </form>
);

export default PreferenceSettings;
