import { Client, Databases, Permission, Role } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const COLLECTION_ID = 'auctions';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForAttributes(keys, maxRetries = 240) {
  for (let i = 0; i < maxRetries; i += 1) {
    const res = await databases.listAttributes(DATABASE_ID, COLLECTION_ID);
    const map = new Map(res.attributes.map((a) => [a.key, a.status]));

    const failed = keys.find((k) => map.get(k) === 'failed');
    if (failed) throw new Error(`Attribute failed: ${failed}`);

    const ready = keys.every((k) => map.get(k) === 'available');
    if (ready) return;

    if (i % 10 === 0) {
      const pending = keys.filter((k) => map.get(k) !== 'available');
      console.log(`Waiting for auctions attributes: ${pending.join(', ')}`);
    }

    await sleep(1000);
  }

  throw new Error('Timed out waiting for auctions attributes');
}

async function run() {
  console.log('Checking existing auctions data before rebuild...');

  try {
    const docs = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, []);
    if (docs.total > 0) {
      throw new Error('Auctions collection has existing documents; aborting destructive rebuild.');
    }
  } catch (error) {
    if (error?.code !== 404) throw error;
  }

  try {
    await databases.deleteCollection(DATABASE_ID, COLLECTION_ID);
    console.log('Deleted existing auctions collection');
  } catch (error) {
    if (error?.code === 404) {
      console.log('Auctions collection did not exist; creating fresh');
    } else {
      throw error;
    }
  }

  await databases.createCollection(
    DATABASE_ID,
    COLLECTION_ID,
    COLLECTION_ID,
    [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
    false,
    true,
  );
  console.log('Created auctions collection');

  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'product_id', 36, true);
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'seller_id', 36, true);
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'title', 180, true);
  await databases.createFloatAttribute(DATABASE_ID, COLLECTION_ID, 'starting_bid', true);
  await databases.createFloatAttribute(DATABASE_ID, COLLECTION_ID, 'current_bid', true);
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'highest_bidder_id', 36, false);
  await databases.createEnumAttribute(DATABASE_ID, COLLECTION_ID, 'status', ['upcoming', 'active', 'ended'], true);
  await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'end_time', 64, true);
  await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, 'bid_count', true, 0);
  await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, 'version', true, 0);
  await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'last_bid_at', false);

  await waitForAttributes([
    'product_id',
    'seller_id',
    'title',
    'starting_bid',
    'current_bid',
    'highest_bidder_id',
    'status',
    'end_time',
    'bid_count',
    'version',
    'last_bid_at',
  ]);
  console.log('All auctions attributes are available');

  await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_auctions_product', 'key', ['product_id']);
  await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_auctions_seller', 'key', ['seller_id']);
  await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'idx_auctions_status_end', 'key', ['status', 'end_time']);
  console.log('Auctions indexes created');

  console.log('Auctions collection rebuild complete');
}

run().catch((error) => {
  console.error('Rebuild failed:', error?.message || error);
  process.exit(1);
});
