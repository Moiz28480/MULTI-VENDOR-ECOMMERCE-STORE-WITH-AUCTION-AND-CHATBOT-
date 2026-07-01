import { Client, Databases, Permission, Role } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const client = new Client().setEndpoint('https://nyc.cloud.appwrite.io/v1').setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const COLLECTION_PERMISSIONS = [
  Permission.read(Role.any()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const schema = [
  {
    id: 'users',
    name: 'users',
    attrs: [
      { t: 'string', k: 'name', s: 255, r: true },
      { t: 'string', k: 'email', s: 255, r: true },
      { t: 'string', k: 'role', s: 50, r: true },
    ],
    indexes: [
      { key: 'unique_users_email', type: 'unique', attrs: ['email'], orders: ['ASC'] },
    ],
  },
  {
    id: 'vendors',
    name: 'vendors',
    attrs: [
      { t: 'string', k: 'shopName', s: 255, r: false },
      { t: 'string', k: 'shopLogo', s: 2048, r: false },
      { t: 'boolean', k: 'isVerified', r: false, d: false },
      { t: 'string', k: 'vendorId', s: 255, r: true },
    ],
    indexes: [
      { key: 'unique_vendors_vendorId', type: 'unique', attrs: ['vendorId'], orders: ['ASC'] },
    ],
  },
  { id: 'products', name: 'products', attrs: [{ t: 'string', k: 'name', s: 255, r: true }, { t: 'float', k: 'price', r: true, min: 0 }, { t: 'string', k: 'description', s: 1000, r: true }, { t: 'string', k: 'imageUrl', s: 2048, r: true }, { t: 'string', k: 'vendorId', s: 255, r: true }, { t: 'string', k: 'category', s: 255, r: true }] },
  { id: 'reviews', name: 'reviews', attrs: [{ t: 'string', k: 'productId', s: 255, r: true }, { t: 'string', k: 'userId', s: 255, r: true }, { t: 'integer', k: 'rating', r: true, min: 1, max: 5 }, { t: 'string', k: 'comment', s: 500, r: false }] },
  { id: 'orders', name: 'orders', attrs: [{ t: 'string', k: 'orderId', s: 36, r: true }, { t: 'string', k: 'customerId', s: 255, r: true }, { t: 'string', k: 'vendorId', s: 255, r: true }, { t: 'string', k: 'productId', s: 255, r: true }, { t: 'integer', k: 'quantity', r: true, min: 1 }, { t: 'float', k: 'totalAmount', r: true, min: 0 }, { t: 'string', k: 'status', s: 50, r: true }] },
];

const isConflict = (e) => e?.code === 409;
const runSafe = async (task, ok, exists) => {
  try { await task(); console.log(ok); }
  catch (e) { if (isConflict(e)) console.log(exists); else throw e; }
};

async function createAttribute(collectionId, attr) {
  const { t, k, r, s, d, min, max } = attr;
  if (t === 'string') return databases.createStringAttribute(DATABASE_ID, collectionId, k, s, r);
  if (t === 'float') return databases.createFloatAttribute(DATABASE_ID, collectionId, k, r, min, max);
  if (t === 'integer') return databases.createIntegerAttribute(DATABASE_ID, collectionId, k, r, min, max);
  if (t === 'boolean') return databases.createBooleanAttribute(DATABASE_ID, collectionId, k, r, d);
  throw new Error(`Unsupported attribute type: ${t}`);
}

async function createIndex(collectionId, index) {
  return databases.createIndex(
    DATABASE_ID,
    collectionId,
    index.key,
    index.type,
    index.attrs,
    index.orders || [],
  );
}

async function setupDatabase() {
  try {
    console.log('Starting database setup...\n');
    for (const collection of schema) {
      await runSafe(
        () => databases.createCollection(DATABASE_ID, collection.id, collection.name, COLLECTION_PERMISSIONS),
        `✓ ${collection.name} collection created successfully`,
        `✓ ${collection.name} collection already exists`
      );
      for (const attr of collection.attrs) {
        await runSafe(
          () => createAttribute(collection.id, attr),
          `  ✓ ${attr.k} attribute created`,
          `  ✓ ${attr.k} attribute already exists`
        );
      }

      const indexes = collection.indexes || [];
      for (const index of indexes) {
        await runSafe(
          () => createIndex(collection.id, index),
          `  ✓ ${index.key} index created`,
          `  ✓ ${index.key} index already exists`
        );
      }

      console.log('');
    }
    console.log('To finish setup: 1. Open your terminal. 2. Run: node scripts/setup_db.js');
  } catch (error) {
    console.error('Error during database setup:', error.message);
    process.exit(1);
  }
}

setupDatabase();
