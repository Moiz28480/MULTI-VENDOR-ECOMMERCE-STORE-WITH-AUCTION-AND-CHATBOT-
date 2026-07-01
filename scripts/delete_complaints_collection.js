import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const COLLECTION_ID = 'complaints';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const deleteComplaintsCollection = async () => {
  try {
    await databases.deleteCollection(DATABASE_ID, COLLECTION_ID);
    console.log('Complaints collection deleted successfully.');
  } catch (error) {
    const code = error?.code ?? error?.response?.code;
    if (code === 404) {
      console.log('Complaints collection does not exist.');
      return;
    }

    console.error(`Failed to delete complaints collection: ${error?.message || error}`);
    process.exit(1);
  }
};

deleteComplaintsCollection();
