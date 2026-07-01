import { Client, Databases, Permission, Role } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const COLLECTION_ID = 'chat_messages';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForAttributeAvailable(collectionId, attributeKey, maxRetries = 240) {
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, collectionId, attributeKey);
      if (attr.status === 'available') return true;
      if (attr.status === 'failed') {
        throw new Error(`Attribute failed: ${attr.error || 'unknown error'}`);
      }
    } catch (error) {
      if (error?.code !== 404) {
        throw error;
      }
    }

    if (i % 15 === 0) {
      console.log(`Waiting for ${collectionId}.${attributeKey} to be available...`);
    }
    await sleep(1000);
  }
  return false;
}

async function ensureAttributeExists(collectionId, attributeKey, createFn) {
  try {
    const attr = await databases.getAttribute(DATABASE_ID, collectionId, attributeKey);
    console.log(`✓ ${collectionId}.${attributeKey} already exists (status: ${attr.status})`);

    if (attr.status !== 'available') {
      const ready = await waitForAttributeAvailable(collectionId, attributeKey);
      if (!ready) {
        throw new Error(`Attribute ${attributeKey} is still not available after waiting.`);
      }
    }
    return;
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }
  }

  console.log(`Creating ${collectionId}.${attributeKey}...`);
  await createFn();

  const ready = await waitForAttributeAvailable(collectionId, attributeKey);
  if (!ready) {
    throw new Error(`Timed out waiting for ${attributeKey} to become available.`);
  }
  console.log(`✓ ${collectionId}.${attributeKey} is now available`);
}

async function ensureIndexExists(collectionId, indexKey, keys) {
  try {
    const indexes = await databases.listIndexes(DATABASE_ID, collectionId);
    const exists = indexes.indexes.some((idx) => idx.key === indexKey);
    if (exists) {
      console.log(`✓ ${collectionId}.${indexKey} index already exists`);
      return;
    }
  } catch {
    // Continue if listing fails
  }

  console.log(`Creating ${collectionId}.${indexKey} index...`);
  try {
    await databases.createIndex(DATABASE_ID, collectionId, indexKey, 'key', keys);
    console.log(`✓ ${collectionId}.${indexKey} index created`);
  } catch (error) {
    if (error?.code === 409) {
      console.log(`✓ ${collectionId}.${indexKey} index already exists (conflict)`);
    } else {
      throw error;
    }
  }
}

async function setupChatMessagesCollection() {
  console.log('Setting up chat_messages collection...\n');

  try {
    const collection = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    console.log(`✓ ${COLLECTION_ID} collection already exists\n`);
  } catch (error) {
    if (error?.code !== 404) {
      throw error;
    }

    console.log(`Creating ${COLLECTION_ID} collection...`);
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      COLLECTION_ID,
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,
      true,
    );
    console.log(`✓ ${COLLECTION_ID} collection created\n`);
  }

  await ensureAttributeExists(COLLECTION_ID, 'user_id', () =>
    databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'user_id', 36, true)
  );

  await ensureAttributeExists(COLLECTION_ID, 'role', () =>
    databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'role', 20, true)
  );

  await ensureAttributeExists(COLLECTION_ID, 'user_message', () =>
    databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'user_message', 2000, true)
  );

  await ensureAttributeExists(COLLECTION_ID, 'ai_response', () =>
    databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'ai_response', 4000, true)
  );

  await ensureAttributeExists(COLLECTION_ID, 'timestamp', () =>
    databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'timestamp', true)
  );

  await ensureAttributeExists(COLLECTION_ID, 'metadata_json', () =>
    databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'metadata_json', 4000, false)
  );

  await ensureIndexExists(COLLECTION_ID, 'idx_user_timestamp', ['user_id', 'timestamp']);
  await ensureIndexExists(COLLECTION_ID, 'idx_role', ['role']);

  console.log('\n✓ chat_messages collection setup completed successfully!');
}

setupChatMessagesCollection().catch((error) => {
  console.error('Collection setup failed:', error?.message || error);
  process.exit(1);
});
