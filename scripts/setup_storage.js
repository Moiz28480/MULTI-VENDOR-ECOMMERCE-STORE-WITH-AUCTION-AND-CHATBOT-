import { Client, Permission, Role, Storage } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';

const BUCKET_ID = 'product_images';
const BUCKET_NAME = 'Product Images';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const storage = new Storage(client);

const permissions = [
  Permission.read(Role.any()),
  Permission.create(Role.users()),
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const setupStorage = async () => {
  try {
    await storage.createBucket(
      BUCKET_ID,
      BUCKET_NAME,
      permissions,
      true,
      true,
      MAX_FILE_SIZE_BYTES,
    );

    console.log('Storage Bucket [product_images] is ready!');
  } catch (error) {
    const code = error?.code ?? error?.response?.code;
    const type = error?.type ?? error?.response?.type;

    if (code === 409 || type === 'bucket_already_exists') {
      console.log('Bucket already exists: product_images');
      console.log('Storage Bucket [product_images] is ready!');
      return;
    }

    console.error(`Storage setup failed: ${error?.message || error}`);
    process.exit(1);
  }
};

setupStorage();