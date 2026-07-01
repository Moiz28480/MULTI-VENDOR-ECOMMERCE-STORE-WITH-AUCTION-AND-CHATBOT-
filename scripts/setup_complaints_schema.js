import { Client, Databases, Permission, Role } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const COLLECTION_ID = 'complaints';
const COLLECTION_NAME = 'Complaints';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const isConflictError = (error) => {
  const code = error?.code ?? error?.response?.code;
  return code === 409;
};

const resolveAdminRole = () => {
  if (typeof Role.label === 'function') {
    return Role.label('admin');
  }

  const adminUserId = String(process.env.APPWRITE_ADMIN_USER_ID || '').trim();
  if (adminUserId) {
    return Role.user(adminUserId);
  }

  return null;
};

const createCollectionIfNeeded = async () => {
  const adminRole = resolveAdminRole();
  const permissions = [
    Permission.create(Role.member()),
    Permission.read(Role.any()),
    Permission.read(Role.member()),
  ];

  if (adminRole) {
    permissions.push(
      Permission.create(adminRole),
      Permission.read(adminRole),
      Permission.update(adminRole),
      Permission.delete(adminRole),
    );
  } else {
    console.log('Admin role binding not found; set APPWRITE_ADMIN_USER_ID if Role.label is unavailable.');
  }

  try {
    await databases.createCollection(DATABASE_ID, COLLECTION_ID, COLLECTION_NAME, permissions);
    console.log('Complaints collection created successfully');
  } catch (error) {
    if (isConflictError(error)) {
      console.log('Collection already exists');
      return;
    }

    throw error;
  }
};

const createStringAttributeIfNeeded = async ({ key, size, required = true, defaultValue }) => {
  try {
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      key,
      size,
      required,
      defaultValue,
    );
    console.log(`Attribute ${key} created`);
  } catch (error) {
    if (isConflictError(error)) {
      console.log(`Attribute ${key} already exists, skipping...`);
      return;
    }

    throw error;
  }
};

const setupComplaintsSchema = async () => {
  try {
    await createCollectionIfNeeded();
    await createStringAttributeIfNeeded({ key: 'orderId', size: 255, required: true });
    await createStringAttributeIfNeeded({ key: 'userId', size: 255, required: true });
    await createStringAttributeIfNeeded({ key: 'category', size: 100, required: true });
    await createStringAttributeIfNeeded({ key: 'description', size: 1000, required: true });
    await createStringAttributeIfNeeded({ key: 'status', size: 50, required: false, defaultValue: 'Pending' });

    console.log('Complaints Schema [orderId, userId, category, description, status] created successfully!');
  } catch (error) {
    console.error(`Error setting up complaints schema: ${error?.message || error}`);
    process.exit(1);
  }
};

setupComplaintsSchema();
