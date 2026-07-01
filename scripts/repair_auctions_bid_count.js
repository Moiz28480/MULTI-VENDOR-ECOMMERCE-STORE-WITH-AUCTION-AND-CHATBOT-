import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const COLLECTION_ID = 'auctions';
const ATTRIBUTE_KEY = 'bid_count';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForRemoved(maxRetries = 120) {
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      await databases.getAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY);
    } catch (error) {
      if (error?.code === 404) return true;
      throw error;
    }
    await sleep(1000);
  }
  return false;
}

async function waitForAvailable(maxRetries = 240) {
  for (let i = 0; i < maxRetries; i += 1) {
    const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY);
    if (attr.status === 'available') return true;
    if (attr.status === 'failed') {
      throw new Error(`bid_count failed: ${attr.error || 'unknown error'}`);
    }
    if (i % 10 === 0) console.log('Waiting for bid_count to become available...');
    await sleep(1000);
  }
  return false;
}

async function run() {
  const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY);
  console.log(`Current bid_count status: ${attr.status}`);

  if (attr.status === 'available') {
    console.log('bid_count is already available');
    return;
  }

  await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY);
  console.log('Deleted stuck bid_count attribute');

  const removed = await waitForRemoved();
  if (!removed) throw new Error('Timed out waiting for bid_count removal');

  await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY, true);
  console.log('Recreated bid_count attribute (required integer)');

  const available = await waitForAvailable();
  if (!available) throw new Error('Timed out waiting for bid_count availability');

  console.log('bid_count repair completed');
}

run().catch((error) => {
  console.error('Repair failed:', error?.message || error);
  process.exit(1);
});
