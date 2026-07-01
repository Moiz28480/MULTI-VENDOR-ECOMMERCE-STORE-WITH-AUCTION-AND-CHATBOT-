import { Client, Databases, Users } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const COLLECTIONS = {
  vendors: 'vendors',
  users: 'users',
  products: 'products',
  orders: 'orders',
};

const AUTH_VENDOR_PASSWORD = process.env.SEED_VENDOR_PASSWORD || '';

if (!AUTH_VENDOR_PASSWORD) {
  throw new Error('Missing SEED_VENDOR_PASSWORD environment variable.');
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const vendorDocument = {
  id: 'Vendor_001',
  data: {
    shopName: 'TechHaven Store',
    shopLogo: '',
    isVerified: true,
    vendorId: 'Vendor_001',
  },
};

const userDocument = {
  id: 'Vendor_001',
  data: {
    name: 'Abdul Moiz',
    email: 'moizn49@gmail.com',
    role: 'vendor',
  },
};

const authVendorUser = {
  id: 'Vendor_001',
  email: 'moizn49@gmail.com',
  password: AUTH_VENDOR_PASSWORD,
  name: 'Abdul Moiz',
};

const customerDocuments = [
  { id: 'Customer_001', data: { name: 'Sarah Ahmed', email: 'sarah.ahmed.dashboard@test.com', role: 'customer' } },
  { id: 'Customer_002', data: { name: 'John Doe', email: 'john.doe.dashboard@test.com', role: 'customer' } },
  { id: 'Customer_003', data: { name: 'Mike Ross', email: 'mike.ross.dashboard@test.com', role: 'customer' } },
  { id: 'Customer_004', data: { name: 'Jane Smith', email: 'jane.smith.dashboard@test.com', role: 'customer' } },
];

const productDocuments = [
  {
    id: 'Product_001',
    data: {
      name: 'MacBook Pro M3',
      category: 'Electronics',
      price: 1299.99,
      stock: 15,
      description: 'Stock: 15 | Sales: 234',
      imageUrl: 'https://picsum.photos/seed/Product_001/600/400',
      vendorId: 'Vendor_001',
    },
  },
  {
    id: 'Product_002',
    data: {
      name: 'Wireless Mouse',
      category: 'Accessories',
      price: 45.0,
      stock: 120,
      description: 'Stock: 120 | Sales: 89',
      imageUrl: 'https://picsum.photos/seed/Product_002/600/400',
      vendorId: 'Vendor_001',
    },
  },
  {
    id: 'Product_003',
    data: {
      name: 'iPhone 15 Pro',
      category: 'Mobile',
      price: 999.0,
      stock: 8,
      description: 'Stock: 8 | Sales: 456',
      imageUrl: 'https://picsum.photos/seed/Product_003/600/400',
      vendorId: 'Vendor_001',
    },
  },
  {
    id: 'Product_004',
    data: {
      name: 'Sony WH-1000XM5',
      category: 'Audio',
      price: 349.99,
      stock: 0,
      description: 'Stock: 0 | Sales: 312',
      imageUrl: 'https://picsum.photos/seed/Product_004/600/400',
      vendorId: 'Vendor_001',
    },
  },
  {
    id: 'Product_005',
    data: {
      name: 'Mechanical Keyboard',
      category: 'Accessories',
      price: 120.0,
      stock: 45,
      description: 'Stock: 45 | Sales: 150',
      imageUrl: 'https://picsum.photos/seed/Product_005/600/400',
      vendorId: 'Vendor_001',
    },
  },
  {
    id: 'Product_006',
    data: {
      name: 'Samsung S24 Ultra',
      category: 'Mobile',
      price: 1199.0,
      stock: 12,
      description: 'Stock: 12 | Sales: 102',
      imageUrl: 'https://picsum.photos/seed/Product_006/600/400',
      vendorId: 'Vendor_001',
    },
  },
];

const orderDocuments = [
  {
    id: 'Order_001',
    data: {
      customerName: 'Sarah Ahmed',
      productName: 'MacBook Pro M3',
      totalAmount: 1299.99,
      status: 'delivered',
      vendorId: 'Vendor_001',
    },
  },
  {
    id: 'Order_002',
    data: {
      customerName: 'John Doe',
      productName: 'Wireless Mouse',
      totalAmount: 45.0,
      status: 'processing',
      vendorId: 'Vendor_001',
    },
  },
  {
    id: 'Order_003',
    data: {
      customerName: 'Mike Ross',
      productName: 'Sony Headphones',
      totalAmount: 349.99,
      status: 'shipped',
      vendorId: 'Vendor_001',
    },
  },
  {
    id: 'Order_004',
    data: {
      customerName: 'Jane Smith',
      productName: 'iPhone 15 Pro',
      totalAmount: 999.0,
      status: 'pending',
      vendorId: 'Vendor_001',
    },
  },
];

const customerIdByName = {
  'Sarah Ahmed': 'Customer_001',
  'John Doe': 'Customer_002',
  'Mike Ross': 'Customer_003',
  'Jane Smith': 'Customer_004',
};

const productIdByName = {
  'MacBook Pro M3': 'Product_001',
  'Wireless Mouse': 'Product_002',
  'iPhone 15 Pro': 'Product_003',
  'Sony WH-1000XM5': 'Product_004',
  'Sony Headphones': 'Product_004',
  'Mechanical Keyboard': 'Product_005',
  'Samsung S24 Ultra': 'Product_006',
};

const normalizedOrderDocuments = orderDocuments.map((order) => ({
  id: order.id,
  data: {
    customerId: customerIdByName[order.data.customerName] || 'Customer_001',
    vendorId: order.data.vendorId,
    productId: productIdByName[order.data.productName] || 'Product_001',
    quantity: 1,
    totalAmount: Number(order.data.totalAmount || 0),
    status: String(order.data.status || 'pending').toLowerCase(),
  },
}));

const isAlreadyExistsError = (error) => {
  const code = error?.code ?? error?.response?.code;
  const type = error?.type ?? error?.response?.type;
  return code === 409 || type === 'document_already_exists';
};

const createWithLog = async (collectionId, documentId, data) => {
  await databases.createDocument(DATABASE_ID, collectionId, documentId, data);
  console.log(`Inserted ${collectionId}/${documentId}`);
};

const createAuthUserWithLog = async ({ id, email, password, name }) => {
  await users.create(id, email, undefined, password, name);
  console.log(`Inserted auth/${id}`);
};

const seedDashboardData = async () => {
  try {
    await createAuthUserWithLog(authVendorUser);
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      console.log(`Skipped auth/${authVendorUser.id} (already exists)`);
    } else {
      console.log(`Auth section error: ${error?.message || error}`);
    }
  }

  try {
    await createWithLog(COLLECTIONS.vendors, vendorDocument.id, vendorDocument.data);
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      console.log(`Skipped vendors/${vendorDocument.id} (already exists)`);
    } else {
      console.log(`Vendors section error: ${error?.message || error}`);
    }
  }

  try {
    await createWithLog(COLLECTIONS.users, userDocument.id, userDocument.data);

    for (const customer of customerDocuments) {
      try {
        await createWithLog(COLLECTIONS.users, customer.id, customer.data);
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          console.log(`Skipped users/${customer.id} (already exists)`);
        } else {
          console.log(`Users entry error (${customer.id}): ${error?.message || error}`);
        }
      }
    }
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      console.log(`Skipped users/${userDocument.id} (already exists)`);
    } else {
      console.log(`Users section error: ${error?.message || error}`);
    }
  }

  try {
    for (const product of productDocuments) {
      try {
        await createWithLog(COLLECTIONS.products, product.id, product.data);
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          console.log(`Skipped products/${product.id} (already exists)`);
        } else {
          console.log(`Products entry error (${product.id}): ${error?.message || error}`);
        }
      }
    }
  } catch (error) {
    console.log(`Products section error: ${error?.message || error}`);
  }

  try {
    for (const order of normalizedOrderDocuments) {
      try {
        await createWithLog(COLLECTIONS.orders, order.id, order.data);
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          console.log(`Skipped orders/${order.id} (already exists)`);
        } else {
          console.log(`Orders entry error (${order.id}): ${error?.message || error}`);
        }
      }
    }
  } catch (error) {
    console.log(`Orders section error: ${error?.message || error}`);
  }

  console.log('Dashboard test data seeding completed.');
};

seedDashboardData();