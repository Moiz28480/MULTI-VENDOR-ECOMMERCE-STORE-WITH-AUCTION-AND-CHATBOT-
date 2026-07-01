const { Client, Databases, Query } = require('node-appwrite');

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('69bf4532001c55de99e2')
  .setKey(process.env.APPWRITE_API_KEY || '');

const db = new Databases(client);
const DB = '69c1cfaf003a710f1232';
const SOURCE = 'u_9';
const TARGET = '69c31499000f8e8776ca';

const fetchAll = async (collectionId, queries) => {
  const response = await db.listDocuments(DB, collectionId, [...queries, Query.limit(200)]);
  return response.documents || [];
};

(async () => {
  const sourceVendorDocs = await fetchAll('vendors', [Query.equal('vendorId', [SOURCE])]);
  const targetVendorDocs = await fetchAll('vendors', [Query.equal('vendorId', [TARGET])]);

  const sourceVendor = sourceVendorDocs[0] || null;
  const targetVendor = targetVendorDocs[0] || null;

  if (!targetVendor) {
    await db.createDocument(DB, 'vendors', TARGET, {
      shopName: sourceVendor?.shopName || 'Omer PC Build',
      shopLogo: sourceVendor?.shopLogo || '',
      isVerified: Boolean(sourceVendor?.isVerified ?? true),
      vendorId: TARGET,
    });
  } else {
    await db.updateDocument(DB, 'vendors', targetVendor.$id, {
      shopName: targetVendor.shopName || sourceVendor?.shopName || 'Omer PC Build',
      shopLogo: targetVendor.shopLogo || sourceVendor?.shopLogo || '',
      isVerified: Boolean(targetVendor.isVerified ?? sourceVendor?.isVerified ?? true),
      vendorId: TARGET,
    });
  }

  const sourceProducts = await fetchAll('products', [Query.equal('vendorId', [SOURCE])]);
  for (const product of sourceProducts) {
    await db.updateDocument(DB, 'products', product.$id, {
      name: product.name,
      price: Number(product.price ?? 0),
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      vendorId: TARGET,
      category: product.category || 'Uncategorized',
    });
  }

  const sourceOrders = await fetchAll('orders', [Query.equal('vendorId', [SOURCE])]);
  for (const order of sourceOrders) {
    await db.updateDocument(DB, 'orders', order.$id, {
      customerId: order.customerId,
      vendorId: TARGET,
      productId: order.productId,
      quantity: Number(order.quantity ?? 1),
      totalAmount: Number(order.totalAmount ?? 0),
      status: String(order.status || 'pending').toLowerCase(),
    });
  }

  const [targetProducts, targetOrders] = await Promise.all([
    fetchAll('products', [Query.equal('vendorId', [TARGET])]),
    fetchAll('orders', [Query.equal('vendorId', [TARGET])]),
  ]);

  console.log('migrated', {
    sourceProducts: sourceProducts.length,
    sourceOrders: sourceOrders.length,
    targetProducts: targetProducts.length,
    targetOrders: targetOrders.length,
  });
})();
