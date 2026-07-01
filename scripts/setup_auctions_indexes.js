import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const isConflict = (e) => e?.code === 409;

async function runSafe(task, ok, exists) {
  try {
    await task();
    console.log(ok);
  } catch (e) {
    if (isConflict(e)) console.log(exists);
    else console.log(`! ${ok.replace('✓ ', '')} failed: ${e?.message || e}`);
  }
}

async function run() {
  const collectionId = 'auctions';
  console.log('Creating auctions indexes...');

  await runSafe(
    () => databases.createIndex(DATABASE_ID, collectionId, 'idx_auctions_product', 'key', ['product_id']),
    '✓ idx_auctions_product index created',
    '✓ idx_auctions_product index already exists',
  );

  await runSafe(
    () => databases.createIndex(DATABASE_ID, collectionId, 'idx_auctions_seller', 'key', ['seller_id']),
    '✓ idx_auctions_seller index created',
    '✓ idx_auctions_seller index already exists',
  );

  await runSafe(
    () => databases.createIndex(DATABASE_ID, collectionId, 'idx_auctions_status_end', 'key', ['status', 'end_time']),
    '✓ idx_auctions_status_end index created',
    '✓ idx_auctions_status_end index already exists',
  );

  console.log('Done.');
}

run().catch((error) => {
  console.error('Setup failed:', error?.message || error);
  process.exit(1);
});
