import { Client, Databases, Permission, Query, Role, Users } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const USERS_COLLECTION_ID = 'users';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DEFAULT_PASSWORD = process.env.APPWRITE_DEFAULT_USER_PASSWORD || '';

if (!DEFAULT_PASSWORD) {
  throw new Error('Missing APPWRITE_DEFAULT_USER_PASSWORD environment variable.');
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const users = new Users(client);
const databases = new Databases(client);

const normalizeRole = (rawRole) => {
  const role = String(rawRole || '').trim().toLowerCase();

  if (role === 'vendor') return 'vendor';
  if (role === 'admin') return 'admin';
  if (role === 'customer') return 'customer';

  return null;
};

const getAllAuthUsers = async () => {
  const all = [];
  let offset = 0;

  while (true) {
    const response = await users.list([
      Query.limit(100),
      Query.offset(offset),
    ]);

    const items = response?.users || [];
    all.push(...items);

    if (items.length < 100) {
      break;
    }

    offset += 100;
  }

  return all;
};

const getProfileById = async (id) => {
  const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
    Query.equal('$id', [id]),
    Query.limit(1),
  ]);

  return response?.documents?.[0] || null;
};

const getProfileByEmail = async (email) => {
  if (!email) {
    return null;
  }

  const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
    Query.equal('email', [String(email).toLowerCase()]),
    Query.limit(1),
  ]);

  return response?.documents?.[0] || null;
};

const resolveRoleForUser = (authUser, profileById, profileByEmail) => {
  return (
    normalizeRole(authUser?.prefs?.role)
    || normalizeRole(profileById?.role)
    || normalizeRole(profileByEmail?.role)
    || 'customer'
  );
};

const syncUser = async (authUser) => {
  const userId = authUser.$id;
  const email = String(authUser.email || '').toLowerCase();
  const name = authUser.name || email || userId;

  await users.updatePassword(userId, DEFAULT_PASSWORD);
  console.log(`Password updated: ${userId}`);

  const profileById = await getProfileById(userId);
  const profileByEmail = profileById ? null : await getProfileByEmail(email);
  const role = resolveRoleForUser(authUser, profileById, profileByEmail);

  const payload = {
    name,
    email,
    role,
  };

  const permissions = [
    Permission.read(Role.users()),
  ];

  if (profileById) {
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, profileById.$id, payload, permissions);
    console.log(`Role synced: ${userId} -> ${role}`);
    return;
  }

  if (profileByEmail) {
    await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, profileByEmail.$id, payload, permissions);
    console.log(`Role synced by email: ${profileByEmail.$id} (${email}) -> ${role}`);
    return;
  }

  await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, payload, permissions);
  console.log(`Profile created: ${userId} -> ${role}`);
};

const run = async () => {
  try {
    const authUsers = await getAllAuthUsers();

    for (const authUser of authUsers) {
      try {
        await syncUser(authUser);
      } catch (error) {
        console.log(`Failed to sync ${authUser?.$id}: ${error?.message || error}`);
      }
    }

    console.log('All auth account passwords set to password123 and roles synced.');
  } catch (error) {
    console.error(`Sync failed: ${error?.message || error}`);
    process.exit(1);
  }
};

run();
