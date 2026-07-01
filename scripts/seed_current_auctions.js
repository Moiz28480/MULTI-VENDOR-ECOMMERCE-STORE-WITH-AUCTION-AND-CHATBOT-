import { Client, Databases, ID, Query } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const PRODUCTS_COLLECTION = 'products';
const AUCTIONS_COLLECTION = 'auctions';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeStartingBid(price) {
  const base = Math.max(1, toNumber(price, 1));
  const start = Math.floor(base * 0.7);
  return Math.max(1, start);
}

function computeEndTimeIso(hoursFromNow) {
  const end = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  return end.toISOString();
}

async function listAuctionProducts() {
  let offset = 0;
  const limit = 100;
  const docs = [];

  while (true) {
    const page = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION, [
      Query.equal('list_type', 'auction'),
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (!page.documents.length) break;
    docs.push(...page.documents);
    offset += page.documents.length;
    if (offset >= page.total) break;
  }

  return docs;
}

async function hasAuctionForProduct(productId) {
  const result = await databases.listDocuments(DATABASE_ID, AUCTIONS_COLLECTION, [
    Query.equal('product_id', productId),
    Query.limit(1),
  ]);
  return result.total > 0;
}

async function waitForEndTimeAttribute(maxRetries = 900) {
  for (let i = 0; i < maxRetries; i += 1) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, AUCTIONS_COLLECTION, 'end_time');
      if (attr.status === 'available') {
        console.log('auctions.end_time is available');
        return true;
      }
      if (attr.status === 'failed') {
        throw new Error(`auctions.end_time failed: ${attr.error || 'unknown error'}`);
      }
    } catch (error) {
      if (error?.code !== 404) {
        throw error;
      }
    }

    if (i % 15 === 0) {
      console.log('Waiting for auctions.end_time attribute to become available...');
    }
    await sleep(1000);
  }

  return false;
}

async function seedCurrentAuctions() {
  console.log('Seeding current auctions from products(list_type=auction)...');

  const ready = await waitForEndTimeAttribute();
  if (!ready) {
    throw new Error('auctions.end_time is still processing. Retry later.');
  }

  const products = await listAuctionProducts();
  if (!products.length) {
    console.log('No auction-type products found. Nothing to seed.');
    return;
  }

  let created = 0;
  let skippedExisting = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];

    const exists = await hasAuctionForProduct(product.$id);
    if (exists) {
      skippedExisting += 1;
      continue;
    }

    const startBid = computeStartingBid(product.price);
    const endTime = computeEndTimeIso(24 + (i % 5) * 6);

    const payload = {
      product_id: product.$id,
      seller_id: product.vendorId,
      title: product.name,
      starting_bid: startBid,
      current_bid: startBid,
      status: 'active',
      end_time: endTime,
      bid_count: 0,
      version: 1,
    };

    try {
      await databases.createDocument(DATABASE_ID, AUCTIONS_COLLECTION, ID.unique(), payload);
      created += 1;
    } catch (error) {
      failed += 1;
      console.log(`Failed to create auction for product ${product.$id}: ${error?.message || error}`);
    }
  }

  console.log(`Auction products found: ${products.length}`);
  console.log(`Created auctions: ${created}`);
  console.log(`Skipped existing auctions: ${skippedExisting}`);
  console.log(`Failed inserts: ${failed}`);
}

seedCurrentAuctions().catch((error) => {
  console.error('Auction seeding failed:', error?.message || error);
  process.exit(1);
});
