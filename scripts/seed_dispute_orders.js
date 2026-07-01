import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const ORDERS_COLLECTION_ID = 'orders';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const disputeOrders = [
  { $id: 'o_comp_1', customerId: 'u_11', vendorId: 'v_super', productId: 'p_super_1', quantity: 1, totalAmount: 2599.99, status: 'delivered' },
  { $id: 'o_comp_2', customerId: 'u_12', vendorId: '69c3149100141f9eeec0', productId: 'p_3', quantity: 1, totalAmount: 35.0, status: 'delivered' },
  { $id: 'o_comp_3', customerId: 'u_13', vendorId: '69c314900007b96eaa44', productId: 'p_1', quantity: 1, totalAmount: 45.0, status: 'delivered' },
  { $id: 'o_comp_4', customerId: 'u_14', vendorId: '69c31492001e2155fc91', productId: 'p_5', quantity: 1, totalAmount: 25.0, status: 'delivered' },
  { $id: 'o_comp_5', customerId: 'u_15', vendorId: 'v_super', productId: 'p_super_3', quantity: 1, totalAmount: 129.0, status: 'delivered' },
  { $id: 'o_comp_6', customerId: 'u_16', vendorId: '69c3149500004862f61b', productId: 'p_7', quantity: 1, totalAmount: 12.0, status: 'delivered' },
  { $id: 'o_comp_7', customerId: 'u_17', vendorId: '69c31497001777c4c836', productId: 'p_9', quantity: 1, totalAmount: 110.0, status: 'delivered' },
  { $id: 'o_comp_8', customerId: 'u_18', vendorId: '69c314960011d63a7bd2', productId: 'p_8', quantity: 1, totalAmount: 40.0, status: 'processing' },
  { $id: 'o_comp_9', customerId: 'u_19', vendorId: '69c314900007b96eaa44', productId: 'p_2', quantity: 1, totalAmount: 85.0, status: 'delivered' },
  { $id: 'o_comp_10', customerId: 'u_20', vendorId: '69c3149100141f9eeec0', productId: 'p_4', quantity: 1, totalAmount: 15.0, status: 'delivered' },
  { $id: 'o_comp_11', customerId: 'u_21', vendorId: 'v_super', productId: 'p_super_2', quantity: 1, totalAmount: 199.5, status: 'delivered' },
  { $id: 'o_comp_12', customerId: 'u_22', vendorId: '69c31493003de0d2bcf2', productId: 'p_6', quantity: 1, totalAmount: 65.0, status: 'delivered' },
  { $id: 'o_comp_13', customerId: 'u_23', vendorId: '69c3149800148cda06d3', productId: 'p_10', quantity: 1, totalAmount: 20.0, status: 'delivered' },
  { $id: 'o_comp_14', customerId: 'u_24', vendorId: 'v_super', productId: 'p_super_3', quantity: 1, totalAmount: 129.0, status: 'delivered' },
  { $id: 'o_comp_15', customerId: 'u_25', vendorId: '69c31492001e2155fc91', productId: 'p_5', quantity: 2, totalAmount: 50.0, status: 'delivered' },
];

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const seedDisputeOrders = async () => {
  for (const order of disputeOrders) {
    const { $id, ...data } = order;

    try {
      await databases.createDocument(DATABASE_ID, ORDERS_COLLECTION_ID, $id, data);
      console.log(`Successfully added Order ${$id}`);
    } catch (error) {
      const code = error?.code ?? error?.response?.code;

      if (code === 409) {
        console.log(`Order ${$id} already exists, skipping...`);
      } else {
        console.log(`Error adding Order ${$id}: ${error?.message || error}`);
      }
    }
  }

  console.log('All 15 Multi-Vendor dispute orders processed!');
};

seedDisputeOrders();
