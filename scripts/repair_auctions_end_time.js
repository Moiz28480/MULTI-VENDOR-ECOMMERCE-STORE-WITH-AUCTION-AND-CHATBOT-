import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const COLLECTION_ID = 'auctions';
const ATTRIBUTE_KEY = 'end_time';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForAttributeRemoval(maxRetries = 120) {
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

async function waitForAttributeAvailable(maxRetries = 240) {
  for (let i = 0; i < maxRetries; i += 1) {
    const attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY);
    if (attr.status === 'available') return true;
    if (attr.status === 'failed') {
      throw new Error(`Attribute failed: ${attr.error || 'unknown error'}`);
    }
    if (i % 10 === 0) {
      console.log(`Waiting for ${COLLECTION_ID}.${ATTRIBUTE_KEY} to be available...`);
    }
    await sleep(1000);
  }
  return false;
}

async function ensureStatusEndIndex() {
  try {
    await databases.createIndex(
      DATABASE_ID,
      COLLECTION_ID,
      'idx_auctions_status_end',
      'key',
      ['status', 'end_time'],
    );
    console.log('Created idx_auctions_status_end index');
  } catch (error) {
    if (error?.code === 409) {
      console.log('idx_auctions_status_end index already exists');
      return;
    }
    throw error;
  }
}

async function run() {
  console.log('Checking auctions.end_time attribute state...');

  let attr;
  try {
    attr = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY);
  } catch (error) {
    if (error?.code === 404) {
      console.log('auctions.end_time missing. Creating fresh attribute...');
      await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY, true);
      const available = await waitForAttributeAvailable();
      if (!available) throw new Error('Timed out while creating end_time');
      await ensureStatusEndIndex();
      console.log('Repair completed successfully');
      return;
    }
    throw error;
  }

  console.log(`Current status: ${attr.status}`);

  if (attr.status === 'available') {
    console.log('auctions.end_time is already available. Ensuring index...');
    await ensureStatusEndIndex();
    console.log('No repair needed');
    return;
  }

  if (attr.status !== 'processing') {
    throw new Error(`Unexpected status for end_time: ${attr.status}`);
  }

  console.log('Deleting stuck auctions.end_time attribute...');
  await databases.deleteAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY);

  const removed = await waitForAttributeRemoval();
  if (!removed) {
    throw new Error('Timed out waiting for end_time removal');
  }

  console.log('Recreating auctions.end_time attribute...');
  await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY, true);

  const available = await waitForAttributeAvailable();
  if (!available) {
    throw new Error('Timed out waiting for recreated end_time to become available');
  }

  await ensureStatusEndIndex();
  console.log('Repair completed successfully');
}

run().catch((error) => {
  console.error('Repair failed:', error?.message || error);
  process.exit(1);
});
