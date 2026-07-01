import { Client, Databases, Query, Users } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const USERS_COLLECTION_ID = 'users';
const VENDORS_COLLECTION_ID = 'vendors';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const usersApi = new Users(client);

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const fetchAllDocuments = async (collectionId, baseQueries = []) => {
  const all = [];
  let cursor = null;

  do {
    const queries = [...baseQueries, Query.limit(100)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    const docs = response?.documents || [];

    all.push(...docs);
    cursor = docs.length ? docs[docs.length - 1].$id : null;

    if (docs.length < 100) {
      break;
    }
  } while (cursor);

  return all;
};

const fetchAllAuthUsers = async () => {
  const all = [];
  let offset = 0;

  while (true) {
    const response = await usersApi.list([Query.limit(100), Query.offset(offset)]);
    const users = response?.users || [];

    all.push(...users);

    if (users.length < 100) {
      break;
    }

    offset += users.length;
  }

  return all;
};

const ensureUserDocForAuthId = async (authUser, sameEmailDbUsers = []) => {
  const authId = authUser?.$id;

  if (!authId) {
    throw new Error('Auth user id missing.');
  }

  const existingById = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
    Query.equal('$id', [authId]),
    Query.limit(1),
  ]);

  const existingDoc = existingById?.documents?.[0];

  const fallbackRole = sameEmailDbUsers.find((doc) => String(doc.role || '').toLowerCase() === 'vendor')?.role
    || sameEmailDbUsers[0]?.role
    || 'vendor';

  const payload = {
    name: authUser?.name || sameEmailDbUsers[0]?.name || 'Vendor',
    email: normalizeEmail(authUser?.email || sameEmailDbUsers[0]?.email),
    role: String(fallbackRole || 'vendor').toLowerCase(),
  };

  if (existingDoc) {
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, authId, payload);
    return authId;
  }

  await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, authId, payload);
  return authId;
};

const ensureVendorDocForAuthId = async (authId, sourceVendorDoc) => {
  const existing = await databases.listDocuments(DATABASE_ID, VENDORS_COLLECTION_ID, [
    Query.equal('vendorId', [authId]),
    Query.limit(1),
  ]);

  const existingDoc = existing?.documents?.[0];

  if (existingDoc) {
    await databases.updateDocument(DATABASE_ID, VENDORS_COLLECTION_ID, existingDoc.$id, {
      shopName: existingDoc.shopName || sourceVendorDoc?.shopName || '',
      shopLogo: existingDoc.shopLogo || sourceVendorDoc?.shopLogo || '',
      isVerified: Boolean(existingDoc.isVerified ?? sourceVendorDoc?.isVerified ?? false),
      vendorId: authId,
    });
    return existingDoc.$id;
  }

  const created = await databases.createDocument(DATABASE_ID, VENDORS_COLLECTION_ID, authId, {
    shopName: sourceVendorDoc?.shopName || '',
    shopLogo: sourceVendorDoc?.shopLogo || '',
    isVerified: Boolean(sourceVendorDoc?.isVerified ?? false),
    vendorId: authId,
  });

  return created.$id;
};

const migrateVendorProducts = async (sourceVendorId, targetVendorId) => {
  const sourceProducts = await fetchAllDocuments(PRODUCTS_COLLECTION_ID, [Query.equal('vendorId', [sourceVendorId])]);

  for (const product of sourceProducts) {
    await databases.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, product.$id, {
      name: product.name,
      price: Number(product.price ?? 0),
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      vendorId: targetVendorId,
      category: product.category || 'Uncategorized',
    });
  }

  return sourceProducts.length;
};

const migrateVendorOrders = async (sourceVendorId, targetVendorId) => {
  const sourceOrders = await fetchAllDocuments(ORDERS_COLLECTION_ID, [Query.equal('vendorId', [sourceVendorId])]);

  for (const order of sourceOrders) {
    await databases.updateDocument(DATABASE_ID, ORDERS_COLLECTION_ID, order.$id, {
      customerId: order.customerId,
      vendorId: targetVendorId,
      productId: order.productId,
      quantity: Number(order.quantity ?? 1),
      totalAmount: Number(order.totalAmount ?? 0),
      status: String(order.status || 'pending').toLowerCase(),
    });
  }

  return sourceOrders.length;
};

const syncVendorDataToAuthIds = async () => {
  const authUsers = await fetchAllAuthUsers();
  let migratedAccounts = 0;
  let migratedProductsTotal = 0;
  let migratedOrdersTotal = 0;

  for (const authUser of authUsers) {
    const normalizedEmail = normalizeEmail(authUser.email);

    if (!normalizedEmail) {
      continue;
    }

    const dbUsers = await fetchAllDocuments(USERS_COLLECTION_ID, [Query.equal('email', [normalizedEmail])]);

    await ensureUserDocForAuthId(authUser, dbUsers);

    const legacyUsers = dbUsers.filter((doc) => doc.$id !== authUser.$id);

    if (!legacyUsers.length) {
      continue;
    }

    let accountMigratedProducts = 0;
    let accountMigratedOrders = 0;

    for (const legacyUser of legacyUsers) {
      const sourceVendorId = legacyUser.$id;
      const targetVendorId = authUser.$id;

      const [sourceProducts, sourceOrders] = await Promise.all([
        fetchAllDocuments(PRODUCTS_COLLECTION_ID, [Query.equal('vendorId', [sourceVendorId])]),
        fetchAllDocuments(ORDERS_COLLECTION_ID, [Query.equal('vendorId', [sourceVendorId])]),
      ]);

      if (!sourceProducts.length && !sourceOrders.length) {
        continue;
      }

      const sourceVendorDocs = await fetchAllDocuments(VENDORS_COLLECTION_ID, [Query.equal('vendorId', [sourceVendorId])]);
      const sourceVendorDoc = sourceVendorDocs?.[0] || null;

      await ensureVendorDocForAuthId(targetVendorId, sourceVendorDoc);

      const migratedProducts = await migrateVendorProducts(sourceVendorId, targetVendorId);
      const migratedOrders = await migrateVendorOrders(sourceVendorId, targetVendorId);

      accountMigratedProducts += migratedProducts;
      accountMigratedOrders += migratedOrders;

      console.log(`Migrated ${normalizedEmail}: products=${migratedProducts}, orders=${migratedOrders}, from=${sourceVendorId}, to=${targetVendorId}`);
    }

    if (accountMigratedProducts || accountMigratedOrders) {
      migratedAccounts += 1;
      migratedProductsTotal += accountMigratedProducts;
      migratedOrdersTotal += accountMigratedOrders;
    }
  }

  console.log(`Vendor data sync completed. accounts=${migratedAccounts}, products=${migratedProductsTotal}, orders=${migratedOrdersTotal}`);
};

syncVendorDataToAuthIds().catch((error) => {
  console.error('Sync failed:', error?.message || error);
  process.exit(1);
});
