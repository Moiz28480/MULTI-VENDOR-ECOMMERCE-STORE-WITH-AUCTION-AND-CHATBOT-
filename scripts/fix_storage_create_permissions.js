import { Client, Permission, Role, Storage } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY =
    process.env.APPWRITE_API_KEY || '';

const BUCKET_ID = 'product_images';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const storage = new Storage(client);

const permissions = [
    Permission.read(Role.any()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
];

const run = async () => {
    const bucket = await storage.getBucket(BUCKET_ID);

    await storage.updateBucket(
        BUCKET_ID,
        bucket.name,
        permissions,
        bucket.fileSecurity,
        bucket.enabled,
        bucket.maximumFileSize,
        bucket.allowedFileExtensions,
        bucket.compression,
        bucket.encryption,
        bucket.antivirus,
    );

    console.log('Storage bucket permissions updated for product_images.');
};

run().catch((error) => {
    console.error(`Storage permission fix failed: ${error?.message || error}`);
    process.exit(1);
});
