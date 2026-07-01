import { useEffect, useMemo, useState } from 'react';
import { Query } from 'appwrite';
import {
    Bell,
    CircleDollarSign,
    Globe,
    Lock,
    Settings as SettingsIcon,
    User,
} from 'lucide-react';
import { account, databases } from '../../lib/appwrite.js';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../lib/auth-context.js';
import AccountSettings from '../../components/Settings/AccountSettings.jsx';
import SecuritySettings from '../../components/Settings/SecuritySettings.jsx';
import NotificationSettings from '../../components/Settings/NotificationSettings.jsx';
import BillingSettings from '../../components/Settings/BillingSettings.jsx';
import PreferenceSettings from '../../components/Settings/PreferenceSettings.jsx';
import '../../styling/settings.css';

const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';

const DEFAULT_ACCOUNT_FORM = {
    fullName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
};

const DEFAULT_SECURITY_FORM = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
};

const DEFAULT_BILLING_FORM = {
    cardNumber: '',
    expiryDate: '',
    cvc: '',
};

const DEFAULT_PREFERENCE_FORM = {
    language: 'English',
    timezone: 'UTC+05:00',
};

const runPlaceholderApiCall = async (requestBuilder) => {
    try {
        await requestBuilder();
    } catch (error) {
    }
};

const isUnknownAttributeError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('unknown attribute');
};

const normalizePhoneNumber = (value) => {
    const digitsOnly = String(value || '').replace(/\D+/g, '').slice(0, 11);
    return digitsOnly || null;
};

const maskCardNumber = (value) => {
    const digits = String(value || '').replace(/\s+/g, '');

    if (digits.length < 4) {
        return '•••• •••• ••••';
    }

    const lastFour = digits.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
};

const SettingsPage = () => {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(true);
    const [savingTab, setSavingTab] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [userDocumentId, setUserDocumentId] = useState('');
    const [showBillingForm, setShowBillingForm] = useState(false);

    const [accountForm, setAccountForm] = useState(DEFAULT_ACCOUNT_FORM);
    const [securityForm, setSecurityForm] = useState(DEFAULT_SECURITY_FORM);
    const [billingForm, setBillingForm] = useState(DEFAULT_BILLING_FORM);
    const [preferenceForm, setPreferenceForm] = useState(DEFAULT_PREFERENCE_FORM);
    const [allowNotifications, setAllowNotifications] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            setError('');

            try {
                if (!user?.$id && !user?.email) {
                    setLoading(false);
                    return;
                }

                const currentAccount = await account.get();
                const prefs = currentAccount?.prefs || {};

                let userDocs = [];

                if (user?.$id) {
                    const responseById = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                        Query.equal('$id', [user.$id]),
                        Query.limit(1),
                    ]);
                    userDocs = responseById?.documents || [];
                }

                if (!userDocs.length && user?.email) {
                    const normalizedEmail = String(user.email).trim().toLowerCase();
                    const responseByEmail = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                        Query.equal('email', [normalizedEmail]),
                        Query.limit(1),
                    ]);
                    userDocs = responseByEmail?.documents || [];
                }

                const userDoc = userDocs[0] || null;

                setUserDocumentId(userDoc?.$id || user?.$id || '');
                setAccountForm({
                    fullName: userDoc?.name || user?.name || currentAccount?.name || '',
                    email: userDoc?.email || user?.email || currentAccount?.email || '',
                    phoneNumber: userDoc?.phonenum || prefs?.phonenum || '',
                    currentPassword: '',
                });

                setAllowNotifications(Boolean(userDoc?.allow_notifications ?? prefs?.allow_notifications ?? true));

                const billingCardNumber = userDoc?.debit_card_num || prefs?.debit_card_num || '';
                const billingExpiry = userDoc?.card_expiry || prefs?.card_expiry || '';
                const billingCvc = userDoc?.card_cvc || prefs?.card_cvc || '';
                const hasCardData = Boolean(billingCardNumber);
                setShowBillingForm(!hasCardData);
                setBillingForm({
                    cardNumber: billingCardNumber,
                    expiryDate: billingExpiry,
                    cvc: billingCvc,
                });
            } catch (loadError) {
                setError(loadError?.message || 'Unable to load settings.');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [user]);

    const updateUserDocument = async (payload) => {
        if (!userDocumentId) {
            throw new Error('User profile record not found.');
        }

        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userDocumentId, payload);
    };

    const updateWithFallback = async (payload) => {
        try {
            await updateUserDocument(payload);
        } catch (error) {
            if (!isUnknownAttributeError(error)) {
                throw error;
            }

            await account.updatePrefs(payload);
        }
    };

    const clearMessages = () => {
        setError('');
        setSuccessMessage('');
    };

    const handleAccountChange = (event) => {
        const { name, value } = event.target;

        if (name === 'phoneNumber') {
            const sanitizedPhoneNumber = String(value || '').replace(/\D+/g, '').slice(0, 11);
            setAccountForm((previous) => ({ ...previous, phoneNumber: sanitizedPhoneNumber }));
            return;
        }

        setAccountForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleAccountSave = async (event) => {
        event.preventDefault();
        clearMessages();
        setSavingTab('account');

        const nextName = String(accountForm.fullName || '').trim();
        const nextEmail = String(accountForm.email || '').trim().toLowerCase();
        const currentPassword = String(accountForm.currentPassword || '');
        const normalizedPhoneNumber = normalizePhoneNumber(accountForm.phoneNumber);

        if (normalizedPhoneNumber && normalizedPhoneNumber.length !== 11) {
            setError('Phone number must be exactly 11 digits.');
            setSavingTab('');
            return;
        }

        const payload = {
            name: nextName,
            email: nextEmail,
            phonenum: normalizedPhoneNumber,
        };

        try {
            const currentAccount = await account.get();
            const currentAuthEmail = String(currentAccount?.email || '').trim().toLowerCase();
            const currentAuthName = String(currentAccount?.name || '').trim();

            if (nextEmail && nextEmail !== currentAuthEmail) {
                if (!currentPassword) {
                    throw new Error('Current password is required to change your email.');
                }

                await account.updateEmail(nextEmail, currentPassword);
            }

            if (nextName && nextName !== currentAuthName) {
                await account.updateName(nextName);
            }

            await runPlaceholderApiCall(() => apiClient.put('/api/settings/account', payload));
            await updateWithFallback(payload);
            setAccountForm((previous) => ({
                ...previous,
                currentPassword: '',
            }));
            setSuccessMessage('Account settings updated successfully.');
        } catch (saveError) {
            setError(saveError?.message || 'Unable to update account settings.');
        } finally {
            setSavingTab('');
        }
    };

    const handleSecurityChange = (event) => {
        const { name, value } = event.target;
        setSecurityForm((previous) => ({ ...previous, [name]: value }));
    };

    const handlePasswordUpdate = async (event) => {
        event.preventDefault();
        clearMessages();

        if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
            setError('Please fill all password fields.');
            return;
        }

        if (securityForm.newPassword !== securityForm.confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        setSavingTab('security');

        try {
            await runPlaceholderApiCall(() => apiClient.put('/api/settings/security', {
                currentPassword: securityForm.currentPassword,
                newPassword: securityForm.newPassword,
            }));

            await account.updatePassword(securityForm.newPassword, securityForm.currentPassword);
            setSecurityForm(DEFAULT_SECURITY_FORM);
            setSuccessMessage('Password updated successfully. You can log in with the new password now.');
        } catch (saveError) {
            setError(saveError?.message || 'Unable to update password.');
        } finally {
            setSavingTab('');
        }
    };

    const handleNotificationToggle = () => {
        setAllowNotifications((previous) => !previous);
    };

    const handleNotificationSave = async () => {
        clearMessages();
        setSavingTab('notifications');

        const payload = {
            allow_notifications: allowNotifications,
        };

        try {
            await runPlaceholderApiCall(() => apiClient.put('/api/settings/notifications', payload));
            await updateWithFallback(payload);
            setSuccessMessage('Notification preferences updated successfully.');
        } catch (saveError) {
            setError(saveError?.message || 'Unable to update notification preferences.');
        } finally {
            setSavingTab('');
        }
    };

    const handleBillingChange = (event) => {
        const { name, value } = event.target;
        setBillingForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleBillingSave = async (event) => {
        event.preventDefault();
        clearMessages();

        if (!billingForm.cardNumber || !billingForm.expiryDate || !billingForm.cvc) {
            setError('Please complete all payment method fields.');
            return;
        }

        setSavingTab('billing');

        const payload = {
            debit_card_num: String(billingForm.cardNumber || '').trim(),
            card_expiry: String(billingForm.expiryDate || '').trim(),
            card_cvc: String(billingForm.cvc || '').trim(),
        };

        try {
            await runPlaceholderApiCall(() => apiClient.put('/api/settings/billing', payload));
            await updateWithFallback(payload);
            setShowBillingForm(false);
            setSuccessMessage('Billing information saved successfully.');
        } catch (saveError) {
            setError(saveError?.message || 'Unable to save billing information.');
        } finally {
            setSavingTab('');
        }
    };

    const handlePreferenceChange = (event) => {
        const { name, value } = event.target;
        setPreferenceForm((previous) => ({ ...previous, [name]: value }));
    };

    const handlePreferenceSave = (event) => {
        event.preventDefault();
        clearMessages();
        setSuccessMessage('Preferences saved locally.');
    };

    const tabItems = useMemo(() => ([
        { key: 'account', label: 'Account', icon: User },
        { key: 'security', label: 'Security', icon: Lock },
        { key: 'notifications', label: 'Notifications', icon: Bell },
        { key: 'billing', label: 'Billing', icon: CircleDollarSign },
        { key: 'preferences', label: 'Preferences', icon: Globe },
    ]), []);

    const renderTabContent = () => {
        if (activeTab === 'security') {
            return (
                <SecuritySettings
                    form={securityForm}
                    onChange={handleSecurityChange}
                    onSubmit={handlePasswordUpdate}
                    isSaving={savingTab === 'security'}
                />
            );
        }

        if (activeTab === 'notifications') {
            return (
                <NotificationSettings
                    allowNotifications={allowNotifications}
                    onToggle={handleNotificationToggle}
                    onSave={handleNotificationSave}
                    isSaving={savingTab === 'notifications'}
                />
            );
        }

        if (activeTab === 'billing') {
            return (
                <BillingSettings
                    form={billingForm}
                    showForm={showBillingForm}
                    onOpenForm={() => setShowBillingForm(true)}
                    onChange={handleBillingChange}
                    onSubmit={handleBillingSave}
                    isSaving={savingTab === 'billing'}
                    maskedCardNumber={maskCardNumber(billingForm.cardNumber)}
                />
            );
        }

        if (activeTab === 'preferences') {
            return (
                <PreferenceSettings
                    form={preferenceForm}
                    onChange={handlePreferenceChange}
                    onSubmit={handlePreferenceSave}
                />
            );
        }

        return (
            <AccountSettings
                form={accountForm}
                onChange={handleAccountChange}
                onSubmit={handleAccountSave}
                isSaving={savingTab === 'account'}
            />
        );
    };

    if (loading) {
        return (
            <div className="page-shell">
                <div className="loader">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="settings-page-shell">
            <div className="settings-page-wrap">
                <header className="settings-page-header">
                    <div className="settings-page-title-wrap">
                        <h1>Settings</h1>
                        <p>Manage your account settings and preferences</p>
                    </div>
                    <span className="settings-page-header-icon" aria-hidden="true">
                        <SettingsIcon size={18} />
                    </span>
                </header>

                {error ? <p className="settings-feedback settings-feedback--error">{error}</p> : null}
                {successMessage ? <p className="settings-feedback settings-feedback--success">{successMessage}</p> : null}

                <div className="settings-content-grid">
                    <aside className="settings-sidebar">
                        {tabItems.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    className={`settings-sidebar-btn ${isActive ? 'settings-sidebar-btn--active' : ''}`}
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        clearMessages();
                                    }}
                                >
                                    <Icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </aside>

                    <section className="settings-content-card">
                        {renderTabContent()}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;