const { Client, Databases, Query, Users } = require('node-appwrite');

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const USERS_COLLECTION_ID = 'users';
const VENDORS_COLLECTION_ID = 'vendors';
const PRODUCTS_COLLECTION_ID = 'products';
const ORDERS_COLLECTION_ID = 'orders';
const REVIEWS_COLLECTION_ID = 'reviews';

const applyMode = process.argv.includes('--apply');

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const usersApi = new Users(client);

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeRole = (value) => String(value || 'customer').trim().toLowerCase();

const rolePriority = {
  admin: 3,
  vendor: 2,
  customer: 1,
};

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

const chooseBestRole = (users) => {
  let bestRole = 'customer';
  let bestRank = 0;

  for (const user of users) {
    const role = normalizeRole(user.role);
    const rank = rolePriority[role] || 0;

    if (rank > bestRank) {
      bestRank = rank;
      bestRole = role;
    }
  }

  return bestRole;
};

const pickCanonicalId = ({ ids, authIds }) => {
  const authMatch = ids.find((id) => authIds.has(id));
  if (authMatch) return authMatch;

  const nonLegacy = ids.find((id) => !/^u_\d+$/i.test(id));
  if (nonLegacy) return nonLegacy;

  return ids[0];
};

const updateProductsVendorId = async (oldUserId, newUserId) => {
  const products = await fetchAllDocuments(PRODUCTS_COLLECTION_ID, [
    Query.equal('vendorId', [oldUserId]),
  ]);

  if (applyMode) {
    for (const product of products) {
      await databases.updateDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, product.$id, {
        name: product.name,
        price: Number(product.price ?? 0),
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        vendorId: newUserId,
        category: product.category || 'Uncategorized',
      });
    }
  }

  return products.length;
};

const updateOrdersVendorId = async (oldUserId, newUserId) => {
  const orders = await fetchAllDocuments(ORDERS_COLLECTION_ID, [
    Query.equal('vendorId', [oldUserId]),
  ]);

  if (applyMode) {
    for (const order of orders) {
      await databases.updateDocument(DATABASE_ID, ORDERS_COLLECTION_ID, order.$id, {
        customerId: order.customerId,
        vendorId: newUserId,
        productId: order.productId,
        quantity: Number(order.quantity ?? 1),
        totalAmount: Number(order.totalAmount ?? 0),
        status: String(order.status || 'pending').toLowerCase(),
      });
    }
  }

  return orders.length;
};

const updateOrdersCustomerId = async (oldUserId, newUserId) => {
  const orders = await fetchAllDocuments(ORDERS_COLLECTION_ID, [
    Query.equal('customerId', [oldUserId]),
  ]);

  if (applyMode) {
    for (const order of orders) {
      await databases.updateDocument(DATABASE_ID, ORDERS_COLLECTION_ID, order.$id, {
        customerId: newUserId,
        vendorId: order.vendorId,
        productId: order.productId,
        quantity: Number(order.quantity ?? 1),
        totalAmount: Number(order.totalAmount ?? 0),
        status: String(order.status || 'pending').toLowerCase(),
      });
    }
  }

  return orders.length;
};

const updateReviewsUserId = async (oldUserId, newUserId) => {
  const reviews = await fetchAllDocuments(REVIEWS_COLLECTION_ID, [
    Query.equal('userId', [oldUserId]),
  ]);

  if (applyMode) {
    for (const review of reviews) {
      await databases.updateDocument(DATABASE_ID, REVIEWS_COLLECTION_ID, review.$id, {
        productId: review.productId,
        userId: newUserId,
        rating: Number(review.rating ?? 0),
        comment: review.comment || '',
      });
    }
  }

  return reviews.length;
};

const updateVendorsVendorId = async (oldUserId, newUserId) => {
  const vendorDocs = await fetchAllDocuments(VENDORS_COLLECTION_ID, [
    Query.equal('vendorId', [oldUserId]),
  ]);

  if (applyMode) {
    for (const vendorDoc of vendorDocs) {
      await databases.updateDocument(DATABASE_ID, VENDORS_COLLECTION_ID, vendorDoc.$id, {
        shopName: vendorDoc.shopName || '',
        shopLogo: vendorDoc.shopLogo || '',
        isVerified: Boolean(vendorDoc.isVerified ?? false),
        vendorId: newUserId,
      });
    }
  }

  return vendorDocs.length;
};

const run = async () => {
  const [dbUsers, authUsers] = await Promise.all([
    fetchAllDocuments(USERS_COLLECTION_ID),
    fetchAllAuthUsers(),
  ]);

  const authIds = new Set(authUsers.map((user) => user.$id));

  const usersByEmail = new Map();
  for (const user of dbUsers) {
    const email = normalizeEmail(user.email);
    if (!email) continue;

    if (!usersByEmail.has(email)) {
      usersByEmail.set(email, []);
    }

    usersByEmail.get(email).push(user);
  }

  const duplicateGroups = [...usersByEmail.entries()].filter(([, users]) => users.length > 1);

  if (!duplicateGroups.length) {
    console.log('No duplicate user emails found. Nothing to clean.');
    return;
  }

  let groupsProcessed = 0;
  let usersDeleted = 0;
  let productsUpdated = 0;
  let ordersVendorUpdated = 0;
  let ordersCustomerUpdated = 0;
  let reviewsUpdated = 0;
  let vendorDocsUpdated = 0;

  for (const [email, users] of duplicateGroups) {
    const ids = users.map((user) => user.$id);
    const canonicalId = pickCanonicalId({ ids, authIds });
    const duplicateIds = ids.filter((id) => id !== canonicalId);
    const canonicalUser = users.find((user) => user.$id === canonicalId);

    const canonicalName = canonicalUser?.name || users[0]?.name || 'User';
    const canonicalRole = chooseBestRole(users);

    if (applyMode) {
      if (canonicalUser) {
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, canonicalId, {
          name: canonicalName,
          email,
          role: canonicalRole,
        });
      } else {
        await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, canonicalId, {
          name: canonicalName,
          email,
          role: canonicalRole,
        });
      }
    }

    console.log(`\nEmail: ${email}`);
    console.log(`- Canonical userId: ${canonicalId}`);
    console.log(`- Duplicate userIds: ${duplicateIds.join(', ')}`);

    for (const duplicateId of duplicateIds) {
      const [movedProducts, movedOrderVendors, movedOrderCustomers, movedReviews, movedVendors] = await Promise.all([
        updateProductsVendorId(duplicateId, canonicalId),
        updateOrdersVendorId(duplicateId, canonicalId),
        updateOrdersCustomerId(duplicateId, canonicalId),
        updateReviewsUserId(duplicateId, canonicalId),
        updateVendorsVendorId(duplicateId, canonicalId),
      ]);

      productsUpdated += movedProducts;
      ordersVendorUpdated += movedOrderVendors;
      ordersCustomerUpdated += movedOrderCustomers;
      reviewsUpdated += movedReviews;
      vendorDocsUpdated += movedVendors;

      console.log(`  - Repoint ${duplicateId} -> ${canonicalId}: products=${movedProducts}, orders(vendor)=${movedOrderVendors}, orders(customer)=${movedOrderCustomers}, reviews=${movedReviews}, vendors=${movedVendors}`);

      if (applyMode) {
        await databases.deleteDocument(DATABASE_ID, USERS_COLLECTION_ID, duplicateId);
      }

      usersDeleted += 1;
      console.log(`  - ${applyMode ? 'Deleted' : 'Would delete'} users/${duplicateId}`);
    }

    groupsProcessed += 1;
  }

  console.log('\nCleanup summary:');
  console.log(`- Mode: ${applyMode ? 'APPLY' : 'DRY RUN'}`);
  console.log(`- Duplicate email groups processed: ${groupsProcessed}`);
  console.log(`- User docs ${applyMode ? 'deleted' : 'to delete'}: ${usersDeleted}`);
  console.log(`- Product refs ${applyMode ? 'updated' : 'to update'}: ${productsUpdated}`);
  console.log(`- Order vendor refs ${applyMode ? 'updated' : 'to update'}: ${ordersVendorUpdated}`);
  console.log(`- Order customer refs ${applyMode ? 'updated' : 'to update'}: ${ordersCustomerUpdated}`);
  console.log(`- Review refs ${applyMode ? 'updated' : 'to update'}: ${reviewsUpdated}`);
  console.log(`- Vendor refs ${applyMode ? 'updated' : 'to update'}: ${vendorDocsUpdated}`);
};

run().catch((error) => {
  console.error('Cleanup failed:', error?.message || error);
  process.exit(1);
});
