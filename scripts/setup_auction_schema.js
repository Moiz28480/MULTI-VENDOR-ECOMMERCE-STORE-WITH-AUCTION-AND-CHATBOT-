import { Client, Databases, Permission, Role } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const isConflict = (e) => e?.code === 409;

const schema = [
  {
    id: 'auctions',
    name: 'auctions',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
    attrs: [
      { t: 'string', k: 'product_id', s: 36, r: true },
      { t: 'string', k: 'seller_id', s: 36, r: true },
      { t: 'string', k: 'title', s: 180, r: true },
      { t: 'float', k: 'starting_bid', r: true },
      { t: 'float', k: 'current_bid', r: true },
      { t: 'string', k: 'highest_bidder_id', s: 36, r: false },
      { t: 'enum', k: 'status', elements: ['upcoming', 'active', 'ended'], r: true },
      { t: 'datetime', k: 'end_time', r: true },
      { t: 'integer', k: 'bid_count', r: true, min: 0 },
      { t: 'integer', k: 'version', r: true, min: 0 },
      { t: 'datetime', k: 'last_bid_at', r: false },
    ],
    indexes: [
      { key: 'idx_auctions_product', type: 'key', attrs: ['product_id'] },
      { key: 'idx_auctions_seller', type: 'key', attrs: ['seller_id'] },
      { key: 'idx_auctions_status_end', type: 'key', attrs: ['status', 'end_time'] },
    ],
  },
  {
    id: 'bids',
    name: 'bids',
    permissions: [Permission.read(Role.any()), Permission.create(Role.users())],
    attrs: [
      { t: 'string', k: 'auction_id', s: 36, r: true },
      { t: 'string', k: 'bidder_id', s: 36, r: true },
      { t: 'float', k: 'amount', r: true },
      { t: 'datetime', k: 'timestamp', r: true },
      { t: 'string', k: 'idempotency_key', s: 64, r: false },
    ],
    indexes: [
      { key: 'idx_bids_auction', type: 'key', attrs: ['auction_id'] },
      { key: 'idx_bids_auction_amount', type: 'key', attrs: ['auction_id', 'amount'] },
      { key: 'idx_bids_auction_time', type: 'key', attrs: ['auction_id', 'timestamp'] },
      { key: 'idx_bids_bidder', type: 'key', attrs: ['bidder_id'] },
      { key: 'unique_idempotency', type: 'unique', attrs: ['idempotency_key'] },
    ],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSafe(task, ok, exists) {
  try {
    await task();
    console.log(ok);
  } catch (e) {
    if (isConflict(e)) console.log(exists);
    else throw e;
  }
}

async function createAttribute(collectionId, attr) {
  const { t, k, r, s, min, max, elements } = attr;
  if (t === 'string') return databases.createStringAttribute(DATABASE_ID, collectionId, k, s, r);
  if (t === 'float') return databases.createFloatAttribute(DATABASE_ID, collectionId, k, r, min, max);
  if (t === 'integer') return databases.createIntegerAttribute(DATABASE_ID, collectionId, k, r, min, max);
  if (t === 'datetime') return databases.createDatetimeAttribute(DATABASE_ID, collectionId, k, r);
  if (t === 'enum') return databases.createEnumAttribute(DATABASE_ID, collectionId, k, elements, r);
  throw new Error(`Unsupported attribute type: ${t}`);
}

async function waitForAllAttributes(collectionId, expectedKeys, maxRetries = 300) {
  for (let i = 0; i < maxRetries; i += 1) {
    const res = await databases.listAttributes(DATABASE_ID, collectionId);
    const map = new Map(res.attributes.map((a) => [a.key, a.status]));
    const ready = expectedKeys.every((k) => map.get(k) === 'available');
    const failed = expectedKeys.find((k) => map.get(k) === 'failed');
    if (failed) throw new Error(`Attribute build failed: ${collectionId}.${failed}`);
    if (ready) return;
    if (i % 10 === 0) {
      const pending = expectedKeys.filter((k) => map.get(k) !== 'available');
      console.log(`  ...waiting for ${collectionId} attributes: ${pending.join(', ')}`);
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for attributes in collection ${collectionId}`);
}

async function waitForAttributes(collectionId, keys, maxRetries = 90) {
  for (let i = 0; i < maxRetries; i += 1) {
    const res = await databases.listAttributes(DATABASE_ID, collectionId);
    const map = new Map(res.attributes.map((a) => [a.key, a.status]));
    const ready = keys.every((k) => map.get(k) === 'available');
    const failed = keys.find((k) => map.get(k) === 'failed');
    if (failed) return false;
    if (ready) return true;
    await sleep(1000);
  }
  return false;
}

async function createIndexes(collectionId, indexes) {
  for (const index of indexes) {
    const indexReady = await waitForAttributes(collectionId, index.attrs, 60);
    if (!indexReady) {
      console.log(`  ! skipping ${index.key}; dependent attributes still processing`);
      continue;
    }
    await runSafe(
      () => databases.createIndex(DATABASE_ID, collectionId, index.key, index.type, index.attrs),
      `  ✓ ${index.key} index created`,
      `  ✓ ${index.key} index already exists`,
    );
  }
}

async function setup() {
  console.log('Starting auction schema setup...\n');

  for (const collection of schema) {
    try {
      await runSafe(
        () =>
          databases.createCollection(
            DATABASE_ID,
            collection.id,
            collection.name,
            collection.permissions,
            false,
            true,
          ),
        `✓ ${collection.id} collection created`,
        `✓ ${collection.id} collection already exists`,
      );

      for (const attr of collection.attrs) {
        await runSafe(
          () => createAttribute(collection.id, attr),
          `  ✓ ${attr.k} attribute created`,
          `  ✓ ${attr.k} attribute already exists`,
        );
      }

      try {
        await waitForAllAttributes(
          collection.id,
          collection.attrs.map((a) => a.k),
        );
        console.log(`  ✓ ${collection.id} attributes ready`);
      } catch (e) {
        console.log(`  ! ${collection.id} attributes still processing; creating ready indexes only`);
      }

      await createIndexes(collection.id, collection.indexes);
      console.log('');
    } catch (error) {
      console.error(`Failed to setup ${collection.id}: ${error?.message || error}`);
    }
  }

  console.log('Auction schema setup completed successfully.');
}

setup().catch((error) => {
  console.error('Auction schema setup failed:', error?.message || error);
  process.exit(1);
});
