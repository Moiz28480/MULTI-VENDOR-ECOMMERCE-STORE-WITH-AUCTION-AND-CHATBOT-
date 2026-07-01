import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('69bf4532001c55de99e2')
  .setKey(process.env.APPWRITE_API_KEY || '');

const db = new Databases(client);
const DATABASE_ID = '69c1cfaf003a710f1232';

const run = async () => {
  const [vendors, products, orders, users] = await Promise.all([
    db.listDocuments(DATABASE_ID, 'vendors', [Query.equal('vendorId', ['v_super'])]),
    db.listDocuments(DATABASE_ID, 'products', [Query.equal('vendorId', ['v_super'])]),
    db.listDocuments(DATABASE_ID, 'orders', [Query.equal('vendorId', ['v_super'])]),
    db.listDocuments(DATABASE_ID, 'users', [Query.equal('$id', ['v_super'])]),
  ]);

  console.log('vendors', vendors.documents.length, vendors.documents[0]?.$permissions);
  console.log('products', products.documents.length, products.documents[0]?.$permissions);
  console.log('orders', orders.documents.length, orders.documents[0]?.$permissions);
  console.log('users', users.documents.length, users.documents[0]?.$permissions);
};

run();
