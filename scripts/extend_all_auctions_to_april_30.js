import { Client, Databases, Query } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
  process.env.APPWRITE_API_KEY ||
  process.env.APPWRITE_API_KEY || '';

const AUCTIONS_COLLECTION_ID = 'auctions';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

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

  if (!auctions.length) {
    console.log('No auctions found.');
    return;
  }

  // Set all auctions to end on April 30th, 2026 at 11:59:59 PM
  const targetEndTime = new Date('2026-04-30T23:59:59Z').toISOString();

  let updated = 0;
  let failed = 0;

  for (const auction of auctions) {
    try {
      await databases.updateDocument(DATABASE_ID, AUCTIONS_COLLECTION_ID, auction.$id, {
        end_time: targetEndTime,
      });
      updated += 1;
    } catch (error) {
      failed += 1;
      console.log(`Failed to extend auction ${auction.$id}: ${error?.message || error}`);
    }
  }

  console.log(`\nExtension Summary:`);
  console.log(`  Total auctions: ${auctions.length}`);
  console.log(`  Successfully extended to April 30th: ${updated}`);
  console.log(`  Failed updates: ${failed}`);
  console.log(`  Target end time: ${targetEndTime}`);

  const sample = auctions.slice(0, 5).map((auction) => ({
    id: auction.$id,
    status: auction.status,
    previousEndTime: auction.end_time,
  }));
  if (sample.length) {
    console.log('\nSample extended auctions:');
    sample.forEach((item) => {
      console.log(`  - ID: ${item.id}, Status: ${item.status}, Previous End: ${item.previousEndTime}`);
    });
  }
}

run().catch((error) => {
  console.error('Extension script failed:', error?.message || error);
  process.exit(1);
});
