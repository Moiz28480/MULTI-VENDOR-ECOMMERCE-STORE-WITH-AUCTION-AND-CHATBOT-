import { Client, Databases, Users, ID, Query } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const COLLECTION_ID = 'vendors';
const USERS_COLLECTION_ID = 'users';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DEFAULT_PASSWORD = process.env.APPWRITE_DEFAULT_VENDOR_PASSWORD || '';
const PASSWORD_ATTRIBUTE_KEY = 'password';

if (!DEFAULT_PASSWORD) {
    throw new Error('Missing APPWRITE_DEFAULT_VENDOR_PASSWORD environment variable.');
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const isConflictError = (error) => {
    const code = error?.code ?? error?.response?.code;
    const type = error?.response?.type || '';
    const message = String(error?.message || '').toLowerCase();

    return (
        code === 409
        || type.includes('already')
        || message.includes('already exists')
    );
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensurePasswordAttribute = async () => {
    const attributesResponse = await databases.listAttributes(DATABASE_ID, COLLECTION_ID);
    const attributes = attributesResponse?.attributes || [];
    const hasPasswordAttribute = attributes.some((attribute) => attribute?.key === PASSWORD_ATTRIBUTE_KEY);

    if (hasPasswordAttribute) {
        console.log('✓ password attribute already exists in vendors collection');
        return;
    }

    console.log('Creating password attribute in vendors collection...');
    await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        PASSWORD_ATTRIBUTE_KEY,
        255,
        false
    );

    for (let attempt = 0; attempt < 20; attempt += 1) {
        const checkResponse = await databases.listAttributes(DATABASE_ID, COLLECTION_ID);
        const checkAttributes = checkResponse?.attributes || [];
        const created = checkAttributes.some((attribute) => attribute?.key === PASSWORD_ATTRIBUTE_KEY && attribute?.status !== 'processing');

        if (created) {
            console.log('✓ password attribute created successfully');
            return;
        }

        await wait(1000);
    }

    throw new Error('password attribute creation timed out. Please re-run the script.');
};

const fetchAllVendors = async () => {
    const vendors = [];
    let cursor = null;

    do {
        const queries = [Query.limit(100)];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, queries);
        const docs = response?.documents || [];

        vendors.push(...docs);
        cursor = docs.length ? docs[docs.length - 1].$id : null;

        if (docs.length < 100) {
            break;
        }
    } while (cursor);

    return vendors;
};

const fetchAllUsers = async () => {
    const usersDocs = [];
    let cursor = null;

    do {
        const queries = [Query.limit(100)];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, queries);
        const docs = response?.documents || [];

        usersDocs.push(...docs);
        cursor = docs.length ? docs[docs.length - 1].$id : null;

        if (docs.length < 100) {
            break;
        }
    } while (cursor);

    return usersDocs;
};

const createAuthUserIfMissing = async ({ email, name }) => {
    try {
        await users.create(
            ID.unique(),
            email,
            undefined,
            DEFAULT_PASSWORD,
            name
        );
        console.log(`  ✓ Auth account created for ${email}`);
    } catch (error) {
        if (isConflictError(error)) {
            console.log(`  ↺ Auth account already exists for ${email}`);
            return;
        }

        throw error;
    }
};

const syncVendorPasswordField = async (documentId) => {
    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, documentId, {
        [PASSWORD_ATTRIBUTE_KEY]: DEFAULT_PASSWORD,
    });
};

const migrateVendors = async () => {
    await ensurePasswordAttribute();

    const vendors = await fetchAllVendors();
    const usersDocs = await fetchAllUsers();
    const usersById = new Map(usersDocs.map((doc) => [doc.$id, doc]));
    console.log(`Found ${vendors.length} vendor document(s).`);

    let successCount = 0;
    let skippedCount = 0;

    for (const vendor of vendors) {
        const vendorRefId = vendor?.vendorId || vendor?.$id;
        const linkedUser = usersById.get(vendorRefId) || null;
        const email = String(vendor?.email || linkedUser?.email || '').trim();
        const displayName = String(vendor?.shopName || linkedUser?.name || vendor?.name || 'Vendor').trim();

        if (!email) {
            console.log(`  - Skipping ${vendor.$id}: missing email field in vendor document`);
            skippedCount += 1;
            continue;
        }

        try {
            await createAuthUserIfMissing({ email, name: displayName });
            await syncVendorPasswordField(vendor.$id);
            console.log(`  ✓ Database password synced for ${email}`);
            successCount += 1;
        } catch (error) {
            console.error(`  ✗ Failed vendor ${vendor.$id} (${email}): ${error?.message || error}`);
        }
    }

    console.log('\nSync complete:');
    console.log(`- Updated vendors: ${successCount}`);
    console.log(`- Skipped vendors: ${skippedCount}`);
    console.log(`- Password used: ${DEFAULT_PASSWORD}`);
};

const run = async () => {
    try {
        await migrateVendors();
    } catch (error) {
        console.error(`Migration failed: ${error?.message || error}`);
        process.exit(1);
    }
};

run();
