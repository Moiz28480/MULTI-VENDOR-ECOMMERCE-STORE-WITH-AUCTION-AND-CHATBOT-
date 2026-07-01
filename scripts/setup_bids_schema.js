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

async function waitForAllAttributes(collectionId, expectedKeys, maxRetries = 180) {
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

async function setupBids() {
  const id = 'bids';
  console.log('Starting bids schema setup...');

  await runSafe(
    () =>
      databases.createCollection(
        DATABASE_ID,
        id,
        id,
        [Permission.read(Role.any()), Permission.create(Role.users())],
        false,
        true,
      ),
    '✓ bids collection created',
    '✓ bids collection already exists',
  );

  await runSafe(
    () => databases.createStringAttribute(DATABASE_ID, id, 'auction_id', 36, true),
    '  ✓ auction_id attribute created',
    '  ✓ auction_id attribute already exists',
  );
  await runSafe(
    () => databases.createStringAttribute(DATABASE_ID, id, 'bidder_id', 36, true),
    '  ✓ bidder_id attribute created',
    '  ✓ bidder_id attribute already exists',
  );
  await runSafe(
    () => databases.createFloatAttribute(DATABASE_ID, id, 'amount', true),
    '  ✓ amount attribute created',
    '  ✓ amount attribute already exists',
  );
  await runSafe(
    () => databases.createDatetimeAttribute(DATABASE_ID, id, 'timestamp', true),
    '  ✓ timestamp attribute created',
    '  ✓ timestamp attribute already exists',
  );
  await runSafe(
    () => databases.createStringAttribute(DATABASE_ID, id, 'idempotency_key', 64, false),
    '  ✓ idempotency_key attribute created',
    '  ✓ idempotency_key attribute already exists',
  );

  await waitForAllAttributes(id, ['auction_id', 'bidder_id', 'amount', 'timestamp', 'idempotency_key']);
  console.log('  ✓ bids attributes ready');

  await runSafe(
    () => databases.createIndex(DATABASE_ID, id, 'idx_bids_auction', 'key', ['auction_id']),
    '  ✓ idx_bids_auction index created',
    '  ✓ idx_bids_auction index already exists',
  );
  await runSafe(
    () => databases.createIndex(DATABASE_ID, id, 'idx_bids_auction_amount', 'key', ['auction_id', 'amount']),
    '  ✓ idx_bids_auction_amount index created',
    '  ✓ idx_bids_auction_amount index already exists',
  );
  await runSafe(
    () => databases.createIndex(DATABASE_ID, id, 'idx_bids_auction_time', 'key', ['auction_id', 'timestamp']),
    '  ✓ idx_bids_auction_time index created',
    '  ✓ idx_bids_auction_time index already exists',
  );
  await runSafe(
    () => databases.createIndex(DATABASE_ID, id, 'idx_bids_bidder', 'key', ['bidder_id']),
    '  ✓ idx_bids_bidder index created',
    '  ✓ idx_bids_bidder index already exists',
  );
  await runSafe(
    () => databases.createIndex(DATABASE_ID, id, 'unique_idempotency', 'unique', ['idempotency_key']),
    '  ✓ unique_idempotency index created',
    '  ✓ unique_idempotency index already exists',
  );

  console.log('Bids schema setup completed successfully.');
}

setupBids().catch((error) => {
  console.error('Bids schema setup failed:', error?.message || error);
  process.exit(1);
});
