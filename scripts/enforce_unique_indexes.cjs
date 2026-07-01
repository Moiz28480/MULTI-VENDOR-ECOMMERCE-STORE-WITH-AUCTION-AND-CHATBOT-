const { Client, Databases } = require('node-appwrite');

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const isConflict = (error) => {
  const code = error?.code ?? error?.response?.code;
  const type = error?.type ?? error?.response?.type;
  return code === 409 || type === 'index_already_exists';
};

const ensureUniqueIndex = async ({ collectionId, key, attribute }) => {
  try {
    await databases.createIndex(
      DATABASE_ID,
      collectionId,
      key,
      'unique',
      [attribute],
      ['ASC'],
    );
    console.log(`Created unique index ${collectionId}/${key} on ${attribute}`);
  } catch (error) {
    if (isConflict(error)) {
      console.log(`Unique index already exists ${collectionId}/${key}`);
      return;
    }

    throw error;
  }
};

const run = async () => {
  await ensureUniqueIndex({
    collectionId: 'users',
    key: 'unique_users_email',
    attribute: 'email',
  });

  await ensureUniqueIndex({
    collectionId: 'vendors',
    key: 'unique_vendors_vendorId',
    attribute: 'vendorId',
  });

  console.log('Unique index enforcement complete.');
};

run().catch((error) => {
  console.error('Failed to enforce unique indexes:', error?.message || error);
  process.exit(1);
});
