import { Client, Databases, Query } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const COLLECTION_ID = 'products';
const ATTRIBUTE_KEY = 'list_type';
const RETAIL_VALUE = 'retail';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isConflict = (error) => error?.code === 409;

async function ensureAttribute() {
  try {
    await databases.createEnumAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      ATTRIBUTE_KEY,
      ['retail', 'auction'],
      false,
    );
    console.log('Created products.list_type attribute');
  } catch (error) {
    if (isConflict(error)) {
      console.log('products.list_type attribute already exists');
    } else {
      throw error;
    }
  }

  for (let i = 0; i < 240; i += 1) {
    const attribute = await databases.getAttribute(DATABASE_ID, COLLECTION_ID, ATTRIBUTE_KEY);
    if (attribute.status === 'available') {
      console.log('products.list_type is available');
      return;
    }
    if (attribute.status === 'failed') {
      throw new Error(`products.list_type failed: ${attribute.error || 'unknown error'}`);
    }

    if (i % 10 === 0) {
      console.log('Waiting for products.list_type to become available...');
    }
    await sleep(1000);
  }

  throw new Error('Timed out waiting for products.list_type attribute');
}

async function updateAllProductsToRetail() {
  let offset = 0;
  const limit = 100;
  let totalUpdated = 0;
  let totalSeen = 0;

  while (true) {
    const page = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (!page.documents.length) break;

    for (const doc of page.documents) {
      totalSeen += 1;
      if (doc[ATTRIBUTE_KEY] === RETAIL_VALUE) continue;

      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        [ATTRIBUTE_KEY]: RETAIL_VALUE,
      });
      totalUpdated += 1;
    }

    offset += page.documents.length;
    if (offset >= page.total) break;
  }

  console.log(`Processed ${totalSeen} products`);
  console.log(`Updated ${totalUpdated} products to list_type=retail`);
}

async function run() {
  console.log('Starting migration: add products.list_type and set all to retail');
  await ensureAttribute();
  await updateAllProductsToRetail();
  console.log('Migration completed successfully');
}

run().catch((error) => {
  console.error('Migration failed:', error?.message || error);
  process.exit(1);
});
