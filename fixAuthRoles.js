import { Client, Databases, Users, Query } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const fetchAllUserDocuments = async () => {
    const allDocuments = [];
    let cursor = null;

    do {
        const queries = [Query.limit(100)];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, queries);
        const documents = response?.documents || [];

        allDocuments.push(...documents);
        cursor = documents.length ? documents[documents.length - 1].$id : null;

        if (documents.length < 100) {
            break;
        }
    } while (cursor);

    return allDocuments;
};

const findAuthUserByEmail = async (email) => {
    const response = await users.list([
        Query.equal('email', [email]),
        Query.limit(1),
    ]);

    return response?.users?.[0] || null;
};

const syncAuthRoles = async () => {
    const userDocuments = await fetchAllUserDocuments();

    console.log(`Found ${userDocuments.length} database user document(s).`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const userDocument of userDocuments) {
        const email = String(userDocument?.email || '').trim();
        const role = String(userDocument?.role || '').trim().toLowerCase();

        if (!email || !role) {
            console.log(`Skipped user document ${userDocument.$id}: missing email or role.`);
            skippedCount += 1;
            continue;
        }

        try {
            const authUser = await findAuthUserByEmail(email);

            if (!authUser) {
                console.log(`Skipped ${email}: no Auth user found for this email.`);
                skippedCount += 1;
                continue;
            }

            await users.updateLabels(authUser.$id, [role]);
            console.log(`Updated ${email} with label: ${role}`);
            updatedCount += 1;
        } catch (error) {
            console.error(`Failed ${email}: ${error?.message || error}`);
            skippedCount += 1;
        }
    }

    console.log('\nRole sync complete:');
    console.log(`- Updated users: ${updatedCount}`);
    console.log(`- Skipped users: ${skippedCount}`);
};

const run = async () => {
    try {
        await syncAuthRoles();
    } catch (error) {
        console.error(`Role sync failed: ${error?.message || error}`);
        process.exit(1);
    }
};

run();
