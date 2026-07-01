import { Client, Databases } from 'node-appwrite';

const requiredEnv = (key) => {
  const value = String(process.env[key] || '').trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const PROJECT_ID = requiredEnv('APPWRITE_PROJECT_ID');
const DATABASE_ID = requiredEnv('APPWRITE_DATABASE_ID');
const API_KEY = requiredEnv('APPWRITE_API_KEY');
const ENDPOINT = String(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1').trim();

const COLLECTION_ID = String(process.env.APPWRITE_SHIPPING_COLLECTION_ID || 'shipping_info').trim();
const COLLECTION_NAME = 'ShippingInfo';

const parsePermissions = () => {
  const raw = String(process.env.APPWRITE_COLLECTION_PERMISSIONS || '').trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    }
  } catch {
    throw new Error('APPWRITE_COLLECTION_PERMISSIONS must be a valid JSON array string.');
  }

  throw new Error('APPWRITE_COLLECTION_PERMISSIONS must be a valid JSON array string.');
};

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const COLLECTION_PERMISSIONS = parsePermissions();

const isConflictError = (error) => {
  const code = error?.code ?? error?.response?.code;
  return code === 409;
};

const attributes = [
  { type: 'string', key: 'userId', size: 36, required: true },
  { type: 'string', key: 'customerId', size: 36, required: true },
  { type: 'string', key: 'vendorId', size: 36, required: true },
  { type: 'string', key: 'productId', size: 255, required: true },
  { type: 'string', key: 'orderId', size: 36, required: true },
  { type: 'string', key: 'firstName', size: 100, required: true },
  { type: 'string', key: 'lastName', size: 100, required: true },
  { type: 'string', key: 'email', size: 255, required: true },
  { type: 'string', key: 'phone', size: 20, required: true },
  { type: 'string', key: 'streetAddress', size: 500, required: true },
  { type: 'string', key: 'apartment', size: 255, required: false },
  { type: 'string', key: 'city', size: 100, required: true },
  { type: 'string', key: 'state', size: 100, required: true },
  { type: 'string', key: 'zipCode', size: 20, required: true },
  { type: 'boolean', key: 'useInfoForNextOrder', required: true, default: false }
];

const createCollectionIfNeeded = async () => {
  try {
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      COLLECTION_NAME,
      COLLECTION_PERMISSIONS
    );

    console.log(`Created collection: ${COLLECTION_NAME} (${COLLECTION_ID})`);
  } catch (error) {
    if (isConflictError(error)) {
      console.log(`Collection already exists: ${COLLECTION_NAME} (${COLLECTION_ID})`);
      return;
    }

    throw error;
  }
};

const createAttribute = async (attribute) => {
  if (attribute.type === 'string') {
    return databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      attribute.key,
      attribute.size,
      attribute.required
    );
  }

  if (attribute.type === 'boolean') {
    try {
      return await databases.createBooleanAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        attribute.key,
        attribute.required,
        attribute.default
      );
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();

      // Appwrite does not allow default values for required attributes.
      if (message.includes('cannot set default value for required attribute') && attribute.required) {
        console.log(`Appwrite constraint for ${attribute.key}: retrying without default.`);
        return databases.createBooleanAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          attribute.key,
          attribute.required
        );
      }

      throw error;
    }
  }

  throw new Error(`Unsupported attribute type: ${attribute.type}`);
};

const setupShippingInfoCollection = async () => {
  try {
    await createCollectionIfNeeded();

    // Create attributes one-by-one to avoid API burst/rate-limit issues.
    for (const attribute of attributes) {
      try {
        await createAttribute(attribute);
        console.log(`Created attribute: ${attribute.key}`);
      } catch (error) {
        if (isConflictError(error)) {
          console.log(`Attribute already exists: ${attribute.key}`);
          continue;
        }

        throw error;
      }
    }

    console.log('ShippingInfo collection setup completed successfully.');
  } catch (error) {
    console.error(`Failed to setup ShippingInfo collection: ${error?.message || error}`);
    process.exit(1);
  }
};

setupShippingInfoCollection();
