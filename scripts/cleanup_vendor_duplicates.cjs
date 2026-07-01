const { Client, Databases, Query, Users } = require('node-appwrite');

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const USERS_COLLECTION_ID = 'users';
const VENDORS_COLLECTION_ID = 'vendors';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';

const applyMode = process.argv.includes('--apply');

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

  while (true) {
    const queries = [...baseQueries, Query.limit(100)];
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    const docs = response?.documents || [];

    all.push(...docs);

    if (docs.length < 100) {
      break;
    }

    cursor = docs[docs.length - 1].$id;
  }

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

const updateVendorReferences = async (oldVendorId, newVendorId) => {
  const sourceProducts = await fetchAllDocuments(PRODUCTS_COLLECTION_ID, [
    Query.equal('vendorId', [oldVendorId]),
  ]);

  const sourceOrders = await fetchAllDocuments(ORDERS_COLLECTION_ID, [
    Query.equal('vendorId', [oldVendorId]),
  ]);

  if (applyMode) {
    for (const product of sourceProducts) {
      await databases.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, product.$id, {
        name: product.name,
        price: Number(product.price ?? 0),
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        vendorId: newVendorId,
        category: product.category || 'Uncategorized',
      });
    }

    for (const order of sourceOrders) {
      await databases.updateDocument(DATABASE_ID, ORDERS_COLLECTION_ID, order.$id, {
        customerId: order.customerId,
        vendorId: newVendorId,
        productId: order.productId,
        quantity: Number(order.quantity ?? 1),
        totalAmount: Number(order.totalAmount ?? 0),
        status: String(order.status || 'pending').toLowerCase(),
      });
    }
  }

  return {
    productsUpdated: sourceProducts.length,
    ordersUpdated: sourceOrders.length,
  };
};

const ensureCanonicalVendorDoc = async ({ canonicalId, canonicalDoc, sourceDoc }) => {
  if (canonicalDoc) {
    return canonicalDoc;
  }

  if (!sourceDoc) {
    return null;
  }

  if (applyMode) {
    await databases.createDocument(DATABASE_ID, VENDORS_COLLECTION_ID, canonicalId, {
      shopName: sourceDoc.shopName || '',
      shopLogo: sourceDoc.shopLogo || '',
      isVerified: Boolean(sourceDoc.isVerified ?? false),
      vendorId: canonicalId,
    });
  }

  return {
    $id: canonicalId,
    vendorId: canonicalId,
    shopName: sourceDoc.shopName || '',
    shopLogo: sourceDoc.shopLogo || '',
    isVerified: Boolean(sourceDoc.isVerified ?? false),
  };
};

const pickCanonicalId = ({ ids, authUserIdByEmail }) => {
  const authMatches = ids.filter((id) => authUserIdByEmail.has(id));

  if (authMatches.length) {
    return authMatches[0];
  }

  // Prefer newer Appwrite-like ids over legacy seed ids (e.g. u_1).
  const nonLegacy = ids.find((id) => !/^u_\d+$/i.test(id));
  if (nonLegacy) {
    return nonLegacy;
  }

  return ids[0];
};

const run = async () => {
  const authUsers = await fetchAllAuthUsers();
  const dbUsers = await fetchAllDocuments(USERS_COLLECTION_ID);
  const vendorDocs = await fetchAllDocuments(VENDORS_COLLECTION_ID);

  const authUserIdByEmail = new Map(authUsers.map((u) => [u.$id, normalizeEmail(u.email)]));

  const vendorUsers = dbUsers.filter((user) => String(user.role || '').trim().toLowerCase() === 'vendor');

  const vendorIdsByEmail = new Map();
  for (const user of vendorUsers) {
    const email = normalizeEmail(user.email);
    if (!email) continue;

    if (!vendorIdsByEmail.has(email)) {
      vendorIdsByEmail.set(email, []);
    }

    vendorIdsByEmail.get(email).push(user.$id);
  }

  const duplicateEmailGroups = [...vendorIdsByEmail.entries()].filter(([, ids]) => ids.length > 1);

  if (!duplicateEmailGroups.length) {
    console.log('No duplicate vendor emails found. Nothing to clean.');
    return;
  }

  const vendorDocByVendorId = new Map();
  for (const vendorDoc of vendorDocs) {
    vendorDocByVendorId.set(String(vendorDoc.vendorId || ''), vendorDoc);
  }

  let groupsProcessed = 0;
  let productsUpdatedTotal = 0;
  let ordersUpdatedTotal = 0;
  let vendorDocsDeleted = 0;
  let vendorDocsCreated = 0;

  for (const [email, ids] of duplicateEmailGroups) {
    const canonicalId = pickCanonicalId({ ids, authUserIdByEmail });
    const duplicateIds = ids.filter((id) => id !== canonicalId);

    const canonicalVendorDoc = vendorDocByVendorId.get(canonicalId) || null;
    const firstDuplicateVendorDoc = duplicateIds
      .map((id) => vendorDocByVendorId.get(id))
      .find(Boolean) || null;

    const ensuredCanonical = await ensureCanonicalVendorDoc({
      canonicalId,
      canonicalDoc: canonicalVendorDoc,
      sourceDoc: firstDuplicateVendorDoc,
    });

    if (!canonicalVendorDoc && ensuredCanonical) {
      vendorDocsCreated += 1;
    }

    console.log(`\nEmail: ${email}`);
    console.log(`- Canonical vendorId: ${canonicalId}`);
    console.log(`- Duplicate vendorIds: ${duplicateIds.join(', ') || '(none)'}`);

    for (const duplicateId of duplicateIds) {
      const refs = await updateVendorReferences(duplicateId, canonicalId);
      productsUpdatedTotal += refs.productsUpdated;
      ordersUpdatedTotal += refs.ordersUpdated;

      console.log(`  - Repoint ${duplicateId} -> ${canonicalId}: products=${refs.productsUpdated}, orders=${refs.ordersUpdated}`);

      const duplicateVendorDoc = vendorDocByVendorId.get(duplicateId);
      if (duplicateVendorDoc) {
        if (applyMode) {
          await databases.deleteDocument(DATABASE_ID, VENDORS_COLLECTION_ID, duplicateVendorDoc.$id);
        }

        vendorDocsDeleted += 1;
        console.log(`  - ${applyMode ? 'Deleted' : 'Would delete'} vendors/${duplicateVendorDoc.$id}`);
      }
    }

    groupsProcessed += 1;
  }

  console.log('\nCleanup summary:');
  console.log(`- Mode: ${applyMode ? 'APPLY' : 'DRY RUN'}`);
  console.log(`- Duplicate email groups processed: ${groupsProcessed}`);
  console.log(`- Vendor docs ${applyMode ? 'created' : 'to create'}: ${vendorDocsCreated}`);
  console.log(`- Vendor docs ${applyMode ? 'deleted' : 'to delete'}: ${vendorDocsDeleted}`);
  console.log(`- Product refs ${applyMode ? 'updated' : 'to update'}: ${productsUpdatedTotal}`);
  console.log(`- Order refs ${applyMode ? 'updated' : 'to update'}: ${ordersUpdatedTotal}`);
};

run().catch((error) => {
  console.error('Cleanup failed:', error?.message || error);
  process.exit(1);
});
