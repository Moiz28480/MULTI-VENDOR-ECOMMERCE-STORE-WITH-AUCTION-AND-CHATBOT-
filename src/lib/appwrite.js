import { Client, Account, Databases, Query, Realtime, Storage, ID } from 'appwrite';

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('69bf4532001c55de99e2');

const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';

export const account = new Account(client);
export const databases = new Databases(client);
export const realtime = new Realtime(client);
export const storage = new Storage(client);

export const ROLE_OPTIONS = ['Customer', 'Vendor', 'Admin'];

const normalizeRole = (rawRole) => {
    const cleanedRole = String(rawRole || '').trim().toLowerCase();

    if (cleanedRole === 'customer') {
        return 'Customer';
    }

    if (cleanedRole === 'vendor') {
        return 'Vendor';
    }

    if (cleanedRole === 'admin') {
        return 'Admin';
    }

    return null;
};

export const signup = async ({ name, email, password, role }) => {
    if (!ROLE_OPTIONS.includes(role)) {
        throw new Error('Invalid role selection.');
    }

    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    await account.updatePrefs({ role });
    await account.deleteSession('current');

    return { role };
};

export const login = async ({ email, password }) => {
    const activeSession = await getSession();
    if (activeSession) {
        await logout();
    }

    await account.createEmailPasswordSession(email, password);
    const user = await account.get();

    let role = normalizeRole(user?.prefs?.role);

    if (!role && user?.$id) {
        try {
            const roleResponse = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                Query.equal('$id', [user.$id]),
                Query.limit(1),
            ]);

            const dbRole = roleResponse?.documents?.[0]?.role;
            role = normalizeRole(dbRole);
        } catch (error) {
            role = null;
        }
    }

    if (!role) {
        try {
            const normalizedEmail = String(user?.email || email || '').trim().toLowerCase();

            if (normalizedEmail) {
                const roleResponseByEmail = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
                    Query.equal('email', [normalizedEmail]),
                    Query.limit(1),
                ]);

                const dbRoleByEmail = roleResponseByEmail?.documents?.[0]?.role;
                role = normalizeRole(dbRoleByEmail);
            }
        } catch (error) {
            role = null;
        }
    }

    if (!role) {
        role = 'Customer';
    }

    localStorage.setItem('userId', user?.$id || '');
    localStorage.setItem('role', role);

    if (role === 'Vendor' && user?.$id) {
        localStorage.setItem('vendorId', user.$id);
    } else {
        localStorage.removeItem('vendorId');
    }

    return { user, role };
};

export const logout = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
    } finally {
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        localStorage.removeItem('vendorId');
    }
};

export const getSession = async () => {
    try {
        return await account.getSession('current');
    } catch (error) {
        return null;
    }
};

export const getCurrentUser = async () => {
    try {
        return await account.get();
    } catch (error) {
        return null;
    }
};

export default client;