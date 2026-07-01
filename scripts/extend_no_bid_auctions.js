import { Client, Databases, Query } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const AUCTIONS_COLLECTION_ID = 'auctions';
const BIDS_COLLECTION_ID = 'bids';
const EXTEND_MS = 2 * 24 * 60 * 60 * 1000;

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

const collectAuctionIdsWithBids = (bids) => {
  const ids = new Set();

  for (const bid of bids) {
    const auctionId = String(bid?.auction_id || '').trim();
    if (auctionId) {
      ids.add(auctionId);
    }
  }

  return ids;
};

async function run() {
  console.log('Loading auctions and bids...');

  const [auctions, bids] = await Promise.all([
    listAllDocuments(AUCTIONS_COLLECTION_ID),
    listAllDocuments(BIDS_COLLECTION_ID),
  ]);

  const auctionsWithBids = collectAuctionIdsWithBids(bids);

  const eligibleAuctions = auctions.filter((auction) => {
    const auctionId = String(auction?.$id || '').trim();
    if (!auctionId) {
      return false;
    }

    if (auctionsWithBids.has(auctionId)) {
      return false;
    }

    return Boolean(parseDate(auction?.end_time));
  });

  if (!eligibleAuctions.length) {
    console.log(`Found ${auctions.length} auctions total.`);
    console.log('No auctions without bidders required extension.');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const auction of eligibleAuctions) {
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

  console.log(`Auctions total: ${auctions.length}`);
  console.log(`Auctions with bids: ${auctionsWithBids.size}`);
  console.log(`Auctions eligible (no bidders): ${eligibleAuctions.length}`);
  console.log(`Auctions extended by 2 days: ${updated}`);
  console.log(`Failed updates: ${failed}`);

  const sample = eligibleAuctions.slice(0, 10).map((auction) => auction.$id);
  if (sample.length) {
    console.log('Sample extended auction IDs:');
    sample.forEach((id) => console.log(`- ${id}`));
  }
}

run().catch((error) => {
  console.error('Extension script failed:', error?.message || error);
  process.exit(1);
});
