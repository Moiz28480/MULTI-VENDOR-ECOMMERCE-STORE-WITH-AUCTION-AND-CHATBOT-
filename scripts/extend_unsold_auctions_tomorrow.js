import { Client, Databases, Query } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const AUCTIONS_COLLECTION_ID = 'auctions';
const EXTEND_MS = 24 * 60 * 60 * 1000; // 1 day

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const listAllDocuments = async (collectionId, baseQueries = []) => {
  const documents = [];
  let cursor = null;

  while (true) {
    const queries = [...baseQueries, Query.limit(100)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    const batch = response?.documents || [];

    if (!batch.length) {
      break;
    }

    documents.push(...batch);

    if (batch.length < 100) {
      break;
    }

    cursor = batch[batch.length - 1].$id;
  }

  return documents;
};

async function run() {
  console.log('Loading all auctions...');

  const auctions = await listAllDocuments(AUCTIONS_COLLECTION_ID);

  // Filter for unsold auctions:
  // - status is not 'ended', OR
  // - status is 'ended' but no highest_bidder_id (no winner)
  const unsoldAuctions = auctions.filter((auction) => {
    const auctionId = String(auction?.$id || '').trim();
    if (!auctionId) {
      return false;
    }

    const status = String(auction?.status || '').trim();
    const highestBidderId = String(auction?.highest_bidder_id || '').trim();

    // Not sold if: status is not 'ended' OR (status is 'ended' but no winner)
    const isNotSold = status !== 'ended' || (status === 'ended' && !highestBidderId);

    return isNotSold && Boolean(parseDate(auction?.end_time));
  });

  if (!unsoldAuctions.length) {
    console.log(`Found ${auctions.length} auctions total.`);
    console.log('No unsold auctions found to extend.');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const auction of unsoldAuctions) {
    const endDate = parseDate(auction.end_time);
    if (!endDate) {
      continue;
    }

    const extendedEndTime = new Date(endDate.getTime() + EXTEND_MS).toISOString();

    try {
      await databases.updateDocument(DATABASE_ID, AUCTIONS_COLLECTION_ID, auction.$id, {
        end_time: extendedEndTime,
      });
      updated += 1;
    } catch (error) {
      failed += 1;
      console.log(`Failed to extend auction ${auction.$id}: ${error?.message || error}`);
    }
  }

  console.log(`\nExtension Summary:`);
  console.log(`  Total auctions: ${auctions.length}`);
  console.log(`  Unsold auctions: ${unsoldAuctions.length}`);
  console.log(`  Successfully extended: ${updated}`);
  console.log(`  Failed updates: ${failed}`);

  const sample = unsoldAuctions.slice(0, 5).map((auction) => ({
    id: auction.$id,
    status: auction.status,
    currentEndTime: auction.end_time,
  }));
  if (sample.length) {
    console.log('\nSample extended auctions:');
    sample.forEach((item) => {
      console.log(`  - ID: ${item.id}, Status: ${item.status}, Current End: ${item.currentEndTime}`);
    });
  }
}

run().catch((error) => {
  console.error('Extension script failed:', error?.message || error);
  process.exit(1);
});
