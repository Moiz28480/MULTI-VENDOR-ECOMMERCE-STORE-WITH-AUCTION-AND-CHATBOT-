import { Client, Databases, ID, Query } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const PRODUCTS_COLLECTION = 'products';
const VENDORS_COLLECTION = 'vendors';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const MOCK_AUCTION_PRODUCTS = [
  {
    name: 'Vintage Swiss Mechanical Watch - Auction Demo',
    description: 'Collector-grade mechanical watch in working condition. Auction demo listing.',
    price: 450,
    stock: 1,
    category: 'Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Gaming Laptop RTX Series - Auction Demo',
    description: 'High-performance laptop with dedicated GPU. Auction demo listing.',
    price: 1200,
    stock: 1,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Antique Wooden Writing Desk - Auction Demo',
    description: 'Restored hardwood desk with brass handles. Auction demo listing.',
    price: 780,
    stock: 1,
    category: 'Furniture',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Mirrorless Camera Pro Kit - Auction Demo',
    description: 'Mirrorless body with 24-70mm lens bundle. Auction demo listing.',
    price: 950,
    stock: 1,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Signed Football Jersey - Auction Demo',
    description: 'Framed signed jersey with certificate placeholder. Auction demo listing.',
    price: 300,
    stock: 1,
    category: 'Sports',
    imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Limited Edition Sneaker Pair - Auction Demo',
    description: 'Deadstock limited release sneakers. Auction demo listing.',
    price: 520,
    stock: 1,
    category: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Electric Guitar Sunburst - Auction Demo',
    description: 'Classic style electric guitar with hard case. Auction demo listing.',
    price: 670,
    stock: 1,
    category: 'Music',
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Drone 4K Cinematic Bundle - Auction Demo',
    description: '4K drone with extra battery kit. Auction demo listing.',
    price: 880,
    stock: 1,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80',
  },
];

async function getVendorIds() {
  const allVendorIds = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const page = await databases.listDocuments(DATABASE_ID, VENDORS_COLLECTION, [
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (!page.documents.length) break;

    for (const doc of page.documents) {
      if (doc.vendorId && typeof doc.vendorId === 'string') {
        allVendorIds.push(doc.vendorId);
      }
    }

    offset += page.documents.length;
    if (offset >= page.total) break;
  }

  const uniqueVendorIds = [...new Set(allVendorIds)];
  return uniqueVendorIds;
}

async function productExistsByName(name) {
  const result = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION, [
    Query.equal('name', name),
    Query.limit(1),
  ]);
  return result.total > 0;
}

async function seedAuctionProducts() {
  console.log('Seeding mock auction products...');

  const vendorIds = await getVendorIds();
  if (!vendorIds.length) {
    throw new Error('No vendors found in vendors table. Cannot attach auction products to valid vendors.');
  }

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < MOCK_AUCTION_PRODUCTS.length; i += 1) {
    const mock = MOCK_AUCTION_PRODUCTS[i];
    const vendorId = vendorIds[i % vendorIds.length];

    const exists = await productExistsByName(mock.name);
    if (exists) {
      skipped += 1;
      continue;
    }

    await databases.createDocument(DATABASE_ID, PRODUCTS_COLLECTION, ID.unique(), {
      name: mock.name,
      description: mock.description,
      price: mock.price,
      stock: mock.stock,
      imageUrl: mock.imageUrl,
      vendorId,
      category: mock.category,
      list_type: 'auction',
    });

    inserted += 1;
  }

  console.log(`Vendors available: ${vendorIds.length}`);
  console.log(`Inserted auction products: ${inserted}`);
  console.log(`Skipped existing products: ${skipped}`);
}

seedAuctionProducts().catch((error) => {
  console.error('Auction product seed failed:', error?.message || error);
  process.exit(1);
});
