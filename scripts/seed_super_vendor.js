import { Client, Databases, Permission, Role, Users } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const COLLECTIONS = {
  users: 'users',
  vendors: 'vendors',
  products: 'products',
  orders: 'orders',
  reviews: 'reviews',
};

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const superUser = {
  $id: 'v_super',
  name: 'Super Multi-Store',
  email: 'super@test.com',
  role: 'vendor',
};

const superVendor = {
  $id: 'v_super',
  vendorId: 'v_super',
  shopName: 'The Universal Mall',
  isVerified: true,
};

const superProducts = [
  {
    $id: 'p_super_1',
    name: 'Super Smart TV',
    category: 'Electronics',
    price: 1599.99,
    stock: 22,
    description: 'Premium 75-inch smart TV for universal mall showcase.',
    imageUrl: 'https://picsum.photos/seed/p_super_1/600/400',
    vendorId: 'v_super',
  },
  {
    $id: 'p_super_2',
    name: 'Designer Winter Jacket',
    category: 'Fashion',
    price: 199.5,
    stock: 75,
    description: 'Signature fashion line jacket from The Universal Mall.',
    imageUrl: 'https://picsum.photos/seed/p_super_2/600/400',
    vendorId: 'v_super',
  },
  {
    $id: 'p_super_3',
    name: 'Luxury Table Lamp',
    category: 'Home Decor',
    price: 129.0,
    stock: 40,
    description: 'Elegant home decor lamp crafted for modern interiors.',
    imageUrl: 'https://picsum.photos/seed/p_super_3/600/400',
    vendorId: 'v_super',
  },
];

const superOrders = [
  {
    $id: 'o_super_1',
    customerId: 'Customer_001',
    vendorId: 'v_super',
    productId: 'p_super_1',
    quantity: 1,
    totalAmount: 1599.99,
    status: 'delivered',
  },
  {
    $id: 'o_super_2',
    customerId: 'Customer_002',
    vendorId: 'v_super',
    productId: 'p_super_2',
    quantity: 2,
    totalAmount: 399.0,
    status: 'processing',
  },
  {
    $id: 'o_super_3',
    customerId: 'Customer_003',
    vendorId: 'v_super',
    productId: 'p_super_3',
    quantity: 1,
    totalAmount: 129.0,
    status: 'shipped',
  },
  {
    $id: 'o_super_4',
    customerId: 'Customer_004',
    vendorId: 'v_super',
    productId: 'p_super_1',
    quantity: 1,
    totalAmount: 1599.99,
    status: 'pending',
  },
  {
    $id: 'o_super_5',
    customerId: 'Customer_001',
    vendorId: 'v_super',
    productId: 'p_super_2',
    quantity: 1,
    totalAmount: 199.5,
    status: 'delivered',
  },
];

const superReviews = [
  {
    $id: 'r_super_1',
    productId: 'p_super_1',
    userId: 'Customer_001',
    rating: 5,
    comment: 'Excellent quality and premium experience.',
  },
  {
    $id: 'r_super_2',
    productId: 'p_super_2',
    userId: 'Customer_002',
    rating: 4,
    comment: 'Great fashion item and fast delivery.',
  },
];

const isAlreadyExists = (error) => {
  const code = error?.code ?? error?.response?.code;
  const type = error?.type ?? error?.response?.type;
  return code === 409 || type === 'document_already_exists' || type === 'user_already_exists';
};

const getPermissionsForOwner = (ownerId) => ([
  Permission.read(Role.user(ownerId)),
  Permission.update(Role.user(ownerId)),
  Permission.delete(Role.user(ownerId)),
]);

const superOwnerPermissions = getPermissionsForOwner('v_super');

const getDocumentPermissions = (collectionId, documentId) => {
  if (collectionId === COLLECTIONS.users && documentId !== 'v_super') {
    return [Permission.read(Role.user('v_super'))];
  }

  return superOwnerPermissions;
};

const tryCreateAuthUser = async () => {
  try {
    await users.create('v_super', 'super@test.com', undefined, 'password123', 'Super Multi-Store');
    console.log('Created: v_super');
  } catch (error) {
    if (isAlreadyExists(error)) {
      console.log('Skipping: v_super');
      return;
    }

    console.log(`Auth error (v_super): ${error?.message || error}`);
  }
};

const tryCreateDocument = async (collectionId, id, data) => {
  const permissions = getDocumentPermissions(collectionId, id);

  try {
    await databases.createDocument(DATABASE_ID, collectionId, id, data, permissions);
    console.log(`Created: ${id}`);
  } catch (error) {
    if (isAlreadyExists(error)) {
      try {
        await databases.updateDocument(DATABASE_ID, collectionId, id, data, permissions);
        console.log(`Updated: ${id}`);
      } catch (updateError) {
        console.log(`Skipping: ${id}`);
        console.log(`Update error (${id}): ${updateError?.message || updateError}`);
      }
      return;
    }

    console.log(`Error (${id}): ${error?.message || error}`);
  }
};

const seedSuperVendor = async () => {
  await tryCreateAuthUser();

  await tryCreateDocument(COLLECTIONS.users, superUser.$id, {
    name: superUser.name,
    email: superUser.email,
    role: superUser.role,
  });

  await tryCreateDocument(COLLECTIONS.vendors, superVendor.$id, {
    vendorId: superVendor.vendorId,
    shopName: superVendor.shopName,
    isVerified: superVendor.isVerified,
    shopLogo: '',
  });

  for (const product of superProducts) {
    await tryCreateDocument(COLLECTIONS.products, product.$id, {
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      description: product.description,
      imageUrl: product.imageUrl,
      vendorId: product.vendorId,
    });
  }

  for (const order of superOrders) {
    await tryCreateDocument(COLLECTIONS.orders, order.$id, {
      customerId: order.customerId,
      vendorId: order.vendorId,
      productId: order.productId,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
    });
  }

  for (const review of superReviews) {
    await tryCreateDocument(COLLECTIONS.reviews, review.$id, {
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
    });
  }

  console.log('Demo Vendor Setup Complete!');
};

seedSuperVendor();