import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const COLLECTION_ID = 'orders';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

const orders = [
  { "$id": "o_16", "customerId": "u_11", "vendorId": "u_1", "productId": "p_1", "quantity": 1, "totalAmount": 45.0, "status": "delivered" },
  { "$id": "o_17", "customerId": "u_12", "vendorId": "u_1", "productId": "p_2", "quantity": 1, "totalAmount": 85.5, "status": "pending" },
  { "$id": "o_18", "customerId": "u_13", "vendorId": "u_1", "productId": "p_13", "quantity": 2, "totalAmount": 110.0, "status": "shipped" },
  { "$id": "o_19", "customerId": "u_14", "vendorId": "u_1", "productId": "p_21", "quantity": 1, "totalAmount": 38.0, "status": "delivered" },
  { "$id": "o_20", "customerId": "u_15", "vendorId": "u_1", "productId": "p_1", "quantity": 3, "totalAmount": 135.0, "status": "processing" },
  { "$id": "o_21", "customerId": "u_16", "vendorId": "u_1", "productId": "p_2", "quantity": 1, "totalAmount": 85.5, "status": "delivered" },
  { "$id": "o_22", "customerId": "u_17", "vendorId": "u_1", "productId": "p_13", "quantity": 1, "totalAmount": 55.0, "status": "pending" },
  { "$id": "o_23", "customerId": "u_18", "vendorId": "u_1", "productId": "p_21", "quantity": 2, "totalAmount": 76.0, "status": "shipped" },
  { "$id": "o_24", "customerId": "u_19", "vendorId": "u_1", "productId": "p_1", "quantity": 1, "totalAmount": 45.0, "status": "delivered" },
  { "$id": "o_25", "customerId": "u_20", "vendorId": "u_1", "productId": "p_2", "quantity": 1, "totalAmount": 85.5, "status": "delivered" },

  { "$id": "o_26", "customerId": "u_21", "vendorId": "u_2", "productId": "p_3", "quantity": 1, "totalAmount": 35.0, "status": "delivered" },
  { "$id": "o_27", "customerId": "u_22", "vendorId": "u_2", "productId": "p_4", "quantity": 3, "totalAmount": 45.0, "status": "shipped" },
  { "$id": "o_28", "customerId": "u_23", "vendorId": "u_2", "productId": "p_14", "quantity": 5, "totalAmount": 50.0, "status": "pending" },
  { "$id": "o_29", "customerId": "u_24", "vendorId": "u_2", "productId": "p_22", "quantity": 1, "totalAmount": 22.0, "status": "delivered" },
  { "$id": "o_30", "customerId": "u_25", "vendorId": "u_2", "productId": "p_3", "quantity": 2, "totalAmount": 70.0, "status": "processing" },
  { "$id": "o_31", "customerId": "u_11", "vendorId": "u_2", "productId": "p_4", "quantity": 1, "totalAmount": 15.0, "status": "delivered" },
  { "$id": "o_32", "customerId": "u_12", "vendorId": "u_2", "productId": "p_14", "quantity": 2, "totalAmount": 20.0, "status": "shipped" },
  { "$id": "o_33", "customerId": "u_13", "vendorId": "u_2", "productId": "p_22", "quantity": 3, "totalAmount": 66.0, "status": "delivered" },
  { "$id": "o_34", "customerId": "u_14", "vendorId": "u_2", "productId": "p_3", "quantity": 1, "totalAmount": 35.0, "status": "pending" },
  { "$id": "o_35", "customerId": "u_15", "vendorId": "u_2", "productId": "p_4", "quantity": 2, "totalAmount": 30.0, "status": "delivered" },

  { "$id": "o_36", "customerId": "u_16", "vendorId": "u_3", "productId": "p_5", "quantity": 1, "totalAmount": 25.0, "status": "delivered" },
  { "$id": "o_37", "customerId": "u_17", "vendorId": "u_3", "productId": "p_23", "quantity": 1, "totalAmount": 20.0, "status": "pending" },
  { "$id": "o_38", "customerId": "u_18", "vendorId": "u_3", "productId": "p_5", "quantity": 4, "totalAmount": 100.0, "status": "shipped" },
  { "$id": "o_39", "customerId": "u_19", "vendorId": "u_3", "productId": "p_23", "quantity": 2, "totalAmount": 40.0, "status": "delivered" },
  { "$id": "o_40", "customerId": "u_20", "vendorId": "u_3", "productId": "p_5", "quantity": 1, "totalAmount": 25.0, "status": "delivered" },
  { "$id": "o_41", "customerId": "u_21", "vendorId": "u_3", "productId": "p_23", "quantity": 1, "totalAmount": 20.0, "status": "processing" },
  { "$id": "o_42", "customerId": "u_22", "vendorId": "u_3", "productId": "p_5", "quantity": 2, "totalAmount": 50.0, "status": "shipped" },
  { "$id": "o_43", "customerId": "u_23", "vendorId": "u_3", "productId": "p_23", "quantity": 3, "totalAmount": 60.0, "status": "delivered" },
  { "$id": "o_44", "customerId": "u_24", "vendorId": "u_3", "productId": "p_5", "quantity": 1, "totalAmount": 25.0, "status": "pending" },
  { "$id": "o_45", "customerId": "u_25", "vendorId": "u_3", "productId": "p_23", "quantity": 1, "totalAmount": 20.0, "status": "delivered" },

  { "$id": "o_46", "customerId": "u_11", "vendorId": "u_4", "productId": "p_6", "quantity": 1, "totalAmount": 65.0, "status": "delivered" },
  { "$id": "o_47", "customerId": "u_12", "vendorId": "u_4", "productId": "p_22", "quantity": 2, "totalAmount": 44.0, "status": "pending" },
  { "$id": "o_48", "customerId": "u_13", "vendorId": "u_4", "productId": "p_6", "quantity": 1, "totalAmount": 65.0, "status": "shipped" },
  { "$id": "o_49", "customerId": "u_14", "vendorId": "u_4", "productId": "p_22", "quantity": 3, "totalAmount": 66.0, "status": "delivered" },
  { "$id": "o_50", "customerId": "u_15", "vendorId": "u_4", "productId": "p_6", "quantity": 1, "totalAmount": 65.0, "status": "processing" },
  { "$id": "o_51", "customerId": "u_16", "vendorId": "u_4", "productId": "p_22", "quantity": 1, "totalAmount": 22.0, "status": "delivered" },
  { "$id": "o_52", "customerId": "u_17", "vendorId": "u_4", "productId": "p_6", "quantity": 2, "totalAmount": 130.0, "status": "pending" },
  { "$id": "o_53", "customerId": "u_18", "vendorId": "u_4", "productId": "p_22", "quantity": 1, "totalAmount": 22.0, "status": "shipped" },
  { "$id": "o_54", "customerId": "u_19", "vendorId": "u_4", "productId": "p_6", "quantity": 1, "totalAmount": 65.0, "status": "delivered" },
  { "$id": "o_55", "customerId": "u_20", "vendorId": "u_4", "productId": "p_22", "quantity": 2, "totalAmount": 44.0, "status": "delivered" },

  { "$id": "o_56", "customerId": "u_21", "vendorId": "u_5", "productId": "p_7", "quantity": 1, "totalAmount": 12.0, "status": "delivered" },
  { "$id": "o_57", "customerId": "u_22", "vendorId": "u_5", "productId": "p_16", "quantity": 2, "totalAmount": 16.0, "status": "shipped" },
  { "$id": "o_58", "customerId": "u_23", "vendorId": "u_5", "productId": "p_7", "quantity": 5, "totalAmount": 60.0, "status": "pending" },
  { "$id": "o_59", "customerId": "u_24", "vendorId": "u_5", "productId": "p_16", "quantity": 1, "totalAmount": 8.0, "status": "delivered" },
  { "$id": "o_60", "customerId": "u_25", "vendorId": "u_5", "productId": "p_7", "quantity": 1, "totalAmount": 12.0, "status": "delivered" },
  { "$id": "o_61", "customerId": "u_11", "vendorId": "u_5", "productId": "p_16", "quantity": 3, "totalAmount": 24.0, "status": "processing" },
  { "$id": "o_62", "customerId": "u_12", "vendorId": "u_5", "productId": "p_7", "quantity": 2, "totalAmount": 24.0, "status": "delivered" },
  { "$id": "o_63", "customerId": "u_13", "vendorId": "u_5", "productId": "p_16", "quantity": 1, "totalAmount": 8.0, "status": "shipped" },
  { "$id": "o_64", "customerId": "u_14", "vendorId": "u_5", "productId": "p_7", "quantity": 1, "totalAmount": 12.0, "status": "pending" },
  { "$id": "o_65", "customerId": "u_15", "vendorId": "u_5", "productId": "p_16", "quantity": 4, "totalAmount": 32.0, "status": "delivered" },

  { "$id": "o_66", "customerId": "u_16", "vendorId": "u_6", "productId": "p_8", "quantity": 1, "totalAmount": 40.0, "status": "delivered" },
  { "$id": "o_67", "customerId": "u_17", "vendorId": "u_6", "productId": "p_15", "quantity": 2, "totalAmount": 36.0, "status": "pending" },
  { "$id": "o_68", "customerId": "u_18", "vendorId": "u_6", "productId": "p_25", "quantity": 1, "totalAmount": 25.0, "status": "shipped" },
  { "$id": "o_69", "customerId": "u_19", "vendorId": "u_6", "productId": "p_8", "quantity": 1, "totalAmount": 40.0, "status": "delivered" },
  { "$id": "o_70", "customerId": "u_20", "vendorId": "u_6", "productId": "p_15", "quantity": 3, "totalAmount": 54.0, "status": "delivered" },
  { "$id": "o_71", "customerId": "u_21", "vendorId": "u_6", "productId": "p_25", "quantity": 1, "totalAmount": 25.0, "status": "processing" },
  { "$id": "o_72", "customerId": "u_22", "vendorId": "u_6", "productId": "p_8", "quantity": 1, "totalAmount": 40.0, "status": "delivered" },
  { "$id": "o_73", "customerId": "u_23", "vendorId": "u_6", "productId": "p_15", "quantity": 1, "totalAmount": 18.0, "status": "shipped" },
  { "$id": "o_74", "customerId": "u_24", "vendorId": "u_6", "productId": "p_25", "quantity": 2, "totalAmount": 50.0, "status": "pending" },
  { "$id": "o_75", "customerId": "u_25", "vendorId": "u_6", "productId": "p_8", "quantity": 1, "totalAmount": 40.0, "status": "delivered" },

  { "$id": "o_76", "customerId": "u_11", "vendorId": "u_7", "productId": "p_9", "quantity": 1, "totalAmount": 110.0, "status": "delivered" },
  { "$id": "o_77", "customerId": "u_12", "vendorId": "u_7", "productId": "p_17", "quantity": 1, "totalAmount": 85.0, "status": "shipped" },
  { "$id": "o_78", "customerId": "u_13", "vendorId": "u_7", "productId": "p_9", "quantity": 1, "totalAmount": 110.0, "status": "pending" },
  { "$id": "o_79", "customerId": "u_14", "vendorId": "u_7", "productId": "p_17", "quantity": 2, "totalAmount": 170.0, "status": "delivered" },
  { "$id": "o_80", "customerId": "u_15", "vendorId": "u_7", "productId": "p_9", "quantity": 1, "totalAmount": 110.0, "status": "delivered" },
  { "$id": "o_81", "customerId": "u_16", "vendorId": "u_7", "productId": "p_17", "quantity": 1, "totalAmount": 85.0, "status": "processing" },
  { "$id": "o_82", "customerId": "u_17", "vendorId": "u_7", "productId": "p_9", "quantity": 1, "totalAmount": 110.0, "status": "shipped" },
  { "$id": "o_83", "customerId": "u_18", "vendorId": "u_7", "productId": "p_17", "quantity": 1, "totalAmount": 85.0, "status": "delivered" },
  { "$id": "o_84", "customerId": "u_19", "vendorId": "u_7", "productId": "p_9", "quantity": 2, "totalAmount": 220.0, "status": "pending" },
  { "$id": "o_85", "customerId": "u_20", "vendorId": "u_7", "productId": "p_17", "quantity": 1, "totalAmount": 85.0, "status": "delivered" },

  { "$id": "o_86", "customerId": "u_21", "vendorId": "u_8", "productId": "p_10", "quantity": 2, "totalAmount": 40.0, "status": "delivered" },
  { "$id": "o_87", "customerId": "u_22", "vendorId": "u_8", "productId": "p_18", "quantity": 1, "totalAmount": 28.0, "status": "shipped" },
  { "$id": "o_88", "customerId": "u_23", "vendorId": "u_8", "productId": "p_24", "quantity": 3, "totalAmount": 42.0, "status": "pending" },
  { "$id": "o_89", "customerId": "u_24", "vendorId": "u_8", "productId": "p_10", "quantity": 1, "totalAmount": 20.0, "status": "delivered" },
  { "$id": "o_90", "customerId": "u_25", "vendorId": "u_8", "productId": "p_18", "quantity": 2, "totalAmount": 56.0, "status": "delivered" },
  { "$id": "o_91", "customerId": "u_11", "vendorId": "u_8", "productId": "p_24", "quantity": 1, "totalAmount": 14.0, "status": "processing" },
  { "$id": "o_92", "customerId": "u_12", "vendorId": "u_8", "productId": "p_10", "quantity": 5, "totalAmount": 100.0, "status": "shipped" },
  { "$id": "o_93", "customerId": "u_13", "vendorId": "u_8", "productId": "p_18", "quantity": 1, "totalAmount": 28.0, "status": "delivered" },
  { "$id": "o_94", "customerId": "u_14", "vendorId": "u_8", "productId": "p_24", "quantity": 2, "totalAmount": 28.0, "status": "pending" },
  { "$id": "o_95", "customerId": "u_15", "vendorId": "u_8", "productId": "p_10", "quantity": 1, "totalAmount": 20.0, "status": "delivered" },

  { "$id": "o_96", "customerId": "u_16", "vendorId": "u_9", "productId": "p_11", "quantity": 1, "totalAmount": 95.0, "status": "delivered" },
  { "$id": "o_97", "customerId": "u_17", "vendorId": "u_9", "productId": "p_19", "quantity": 1, "totalAmount": 45.0, "status": "pending" },
  { "$id": "o_98", "customerId": "u_18", "vendorId": "u_9", "productId": "p_11", "quantity": 2, "totalAmount": 190.0, "status": "shipped" },
  { "$id": "o_99", "customerId": "u_19", "vendorId": "u_9", "productId": "p_19", "quantity": 3, "totalAmount": 135.0, "status": "delivered" },
  { "$id": "o_100", "customerId": "u_20", "vendorId": "u_9", "productId": "p_11", "quantity": 1, "totalAmount": 95.0, "status": "delivered" },
  { "$id": "o_101", "customerId": "u_21", "vendorId": "u_9", "productId": "p_19", "quantity": 1, "totalAmount": 45.0, "status": "processing" },
  { "$id": "o_102", "customerId": "u_22", "vendorId": "u_9", "productId": "p_11", "quantity": 1, "totalAmount": 95.0, "status": "shipped" },
  { "$id": "o_103", "customerId": "u_23", "vendorId": "u_9", "productId": "p_19", "quantity": 2, "totalAmount": 90.0, "status": "delivered" },
  { "$id": "o_104", "customerId": "u_24", "vendorId": "u_9", "productId": "p_11", "quantity": 1, "totalAmount": 95.0, "status": "pending" },
  { "$id": "o_105", "customerId": "u_25", "vendorId": "u_9", "productId": "p_19", "quantity": 1, "totalAmount": 45.0, "status": "delivered" },

  { "$id": "o_106", "customerId": "u_11", "vendorId": "u_10", "productId": "p_12", "quantity": 1, "totalAmount": 30.0, "status": "delivered" },
  { "$id": "o_107", "customerId": "u_12", "vendorId": "u_10", "productId": "p_20", "quantity": 1, "totalAmount": 120.0, "status": "shipped" },
  { "$id": "o_108", "customerId": "u_13", "vendorId": "u_10", "productId": "p_12", "quantity": 2, "totalAmount": 60.0, "status": "pending" },
  { "$id": "o_109", "customerId": "u_14", "vendorId": "u_10", "productId": "p_20", "quantity": 1, "totalAmount": 120.0, "status": "delivered" },
  { "$id": "o_110", "customerId": "u_15", "vendorId": "u_10", "productId": "p_12", "quantity": 3, "totalAmount": 90.0, "status": "delivered" },
  { "$id": "o_111", "customerId": "u_16", "vendorId": "u_10", "productId": "p_20", "quantity": 1, "totalAmount": 120.0, "status": "processing" },
  { "$id": "o_112", "customerId": "u_17", "vendorId": "u_10", "productId": "p_12", "quantity": 1, "totalAmount": 30.0, "status": "shipped" },
  { "$id": "o_113", "customerId": "u_18", "vendorId": "u_10", "productId": "p_20", "quantity": 2, "totalAmount": 240.0, "status": "delivered" },
  { "$id": "o_114", "customerId": "u_19", "vendorId": "u_10", "productId": "p_12", "quantity": 1, "totalAmount": 30.0, "status": "pending" },
  { "$id": "o_115", "customerId": "u_20", "vendorId": "u_10", "productId": "p_20", "quantity": 1, "totalAmount": 120.0, "status": "delivered" }
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isAlreadyExistsError = (error) => {
  const code = error?.code ?? error?.response?.code;
  return code === 409;
};

async function pushOrders() {
  try {
    const total = orders.length;

    for (let index = 0; index < total; index += 1) {
      const order = orders[index];
      const { $id, ...payload } = order;

      console.log(`Inserting order ${index + 1} of ${total}...`);

      try {
        await databases.createDocument(DATABASE_ID, COLLECTION_ID, order.$id, payload);
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          console.log(`Order [${order.$id}] skipped`);
        } else {
          throw error;
        }
      }

      await delay(100);
    }

    console.log(`Done. Processed ${total} orders.`);
  } catch (error) {
    console.error('Error while pushing orders:', error?.message || error);
    process.exit(1);
  }
}

pushOrders();
