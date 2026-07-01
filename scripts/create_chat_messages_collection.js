import { Client, Databases, Permission, Role } from 'node-appwrite';

// Appwrite connection settings come from environment variables so this script
// can run against local, staging, or production projects without code changes.
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const COLLECTION_ID = 'chat_messages';

if (!API_KEY) {
  console.error('Missing APPWRITE_API_KEY environment variable.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Wait until an async Appwrite attribute has finished building.
async function waitForAttributeReady(collectionId, attributeKey, maxRetries = 120) {
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const attribute = await databases.getAttribute(DATABASE_ID, collectionId, attributeKey);

    if (attribute.status === 'available') {
      return;
    }

    if (attribute.status === 'failed') {
      throw new Error(`Attribute ${attributeKey} failed to build.`);
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for ${attributeKey} to become available.`);
}

// Create the collection if it does not exist yet.
async function ensureCollection() {
  try {
    await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    console.log(`Collection ${COLLECTION_ID} already exists.`);
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }

    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      COLLECTION_ID,
      [
        // Allow authenticated users to create and read chat messages.
        Permission.create(Role.users()),
        Permission.read(Role.users()),
      ],
      false,
      true,
    );

    console.log(`Created collection ${COLLECTION_ID}.`);
  }
}

// Create a string attribute if it does not already exist.
async function ensureStringAttribute(key, size, required) {
  try {
    await databases.getAttribute(DATABASE_ID, COLLECTION_ID, key);
    console.log(`Attribute ${key} already exists.`);
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }

    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, key, size, required);
    console.log(`Created string attribute ${key}.`);
    await waitForAttributeReady(COLLECTION_ID, key);
  }
}

// Create a datetime attribute if it does not already exist.
async function ensureDatetimeAttribute(key, required) {
  try {
    await databases.getAttribute(DATABASE_ID, COLLECTION_ID, key);
    console.log(`Attribute ${key} already exists.`);
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }

    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, key, required);
    console.log(`Created datetime attribute ${key}.`);
    await waitForAttributeReady(COLLECTION_ID, key);
  }
}

async function main() {
  console.log('Setting up chat_messages collection...');

  await ensureCollection();

  // Core chat identity and content fields.
  await ensureStringAttribute('user_id', 255, true);
  await ensureStringAttribute('role', 50, true);
  await ensureStringAttribute('message', 4000, true);
  await ensureStringAttribute('sender', 20, true);

  // Timestamp for sorting and history loading.
  await ensureDatetimeAttribute('timestamp', true);

  // Optional metadata for future extensions such as product/order references.
  await ensureStringAttribute('metadata', 5000, false);

  console.log('chat_messages collection is ready.');
}

main().catch((error) => {
  console.error('Failed to set up chat_messages collection:', error?.message || error);
  process.exit(1);
});
