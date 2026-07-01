import { Client, Databases, Permission, Role } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const COLLECTION_ID = 'auctions';

if (!API_KEY) {
  console.error('Missing APPWRITE_API_KEY');
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const permissions = [
  Permission.read(Role.any()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const run = async () => {
  const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);

  await databases.updateCollection(
    DATABASE_ID,
    COLLECTION_ID,
    collection.name,
    permissions,
    false,
    true,
  );

  const refreshed = await databases.getCollection(DATABASE_ID, COLLECTION_ID);

  console.log('UPDATED_COLLECTION', refreshed.$id);
  console.log('PERMISSIONS', JSON.stringify(refreshed.$permissions || []));
};

run().catch((error) => {
  console.error('FAILED', error?.message || error);
  process.exit(1);
});
