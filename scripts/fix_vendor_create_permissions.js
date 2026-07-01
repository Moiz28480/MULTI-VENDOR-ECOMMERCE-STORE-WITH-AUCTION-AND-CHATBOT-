import { Client, Databases, Permission, Role } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
    process.env.APPWRITE_API_KEY || '';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const COLLECTION_IDS = ['products', 'vendors', 'orders', 'reviews'];

const collectionPermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
];

const run = async () => {
    for (const collectionId of COLLECTION_IDS) {
        try {
            const collection = await databases.getCollection(DATABASE_ID, collectionId);

            await databases.updateCollection(
                DATABASE_ID,
                collectionId,
                collection.name,
                collectionPermissions,
                false,
                true,
            );

            console.log(`Permissions updated for ${collectionId}`);
        } catch (error) {
            console.error(`Failed updating ${collectionId}: ${error?.message || error}`);
        }
    }
};

run()
    .then(() => {
        console.log('Vendor create permissions fix complete.');
    })
    .catch((error) => {
        console.error(`Permission fix failed: ${error?.message || error}`);
        process.exit(1);
    });
