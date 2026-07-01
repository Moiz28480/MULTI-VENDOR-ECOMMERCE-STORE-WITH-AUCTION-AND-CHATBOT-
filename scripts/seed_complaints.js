import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const COMPLAINTS_COLLECTION_ID = 'complaints';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const complaints = [
  { $id: 'c_1', orderId: 'o_comp_1', userId: 'u_11', category: 'Damaged', description: 'The Super Smart TV has a cracked screen on arrival.', status: 'Pending' },
  { $id: 'c_2', orderId: 'o_comp_2', userId: 'u_12', category: 'Defective', description: 'Summer Floral Dress has a large hole in the sleeve.', status: 'Pending' },
  { $id: 'c_3', orderId: 'o_comp_3', userId: 'u_13', category: 'Defective', description: 'Gaming Mouse RGB scroll wheel is stuck.', status: 'Pending' },
  { $id: 'c_4', orderId: 'o_comp_4', userId: 'u_14', category: 'Missing Item', description: 'USB-C Fast Charger cable was missing from the box.', status: 'Pending' },
  { $id: 'c_5', orderId: 'o_comp_5', userId: 'u_15', category: 'Quality', description: 'Luxury Table Lamp base is scratched and wobbly.', status: 'Pending' },
  { $id: 'c_6', orderId: 'o_comp_6', userId: 'u_16', category: 'Wrong Item', description: 'iPhone 15 Case is for the wrong model.', status: 'Pending' },
  { $id: 'c_7', orderId: 'o_comp_7', userId: 'u_17', category: 'Defective', description: 'Leather Chelsea Boots sole is peeling off.', status: 'Pending' },
  { $id: 'c_8', orderId: 'o_comp_8', userId: 'u_18', category: 'Late', description: "Ceramic Table Lamp still hasn't shipped after 1 week.", status: 'Pending' },
  { $id: 'c_9', orderId: 'o_comp_9', userId: 'u_19', category: 'Defective', description: "Mechanical Keyboard 'A' key is not registering.", status: 'Pending' },
  { $id: 'c_10', orderId: 'o_comp_10', userId: 'u_20', category: 'Quality', description: 'Silk Scarf material feels like polyester, not silk.', status: 'Pending' },
  { $id: 'c_11', orderId: 'o_comp_11', userId: 'u_21', category: 'Wrong Item', description: 'Designer Winter Jacket color is different from photos.', status: 'Pending' },
  { $id: 'c_12', orderId: 'o_comp_12', userId: 'u_22', category: 'Defective', description: 'Designer Lawn Suit has missing embroidery parts.', status: 'Pending' },
  { $id: 'c_13', orderId: 'o_comp_13', userId: 'u_23', category: 'Missing Item', description: 'Organic Wild Honey jar was empty/leaked in box.', status: 'Pending' },
  { $id: 'c_14', orderId: 'o_comp_14', userId: 'u_24', category: 'Damaged', description: 'Luxury Table Lamp glass is shattered.', status: 'Pending' },
  { $id: 'c_15', orderId: 'o_comp_15', userId: 'u_25', category: 'Defective', description: 'USB-C Fast Charger is making a high-pitched noise.', status: 'Pending' },
];

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

const seedComplaints = async () => {
  for (const complaint of complaints) {
    const { $id, ...data } = complaint;

    try {
      await databases.createDocument(DATABASE_ID, COMPLAINTS_COLLECTION_ID, $id, data);
      console.log(`Successfully added Complaint ${$id}`);
    } catch (error) {
      const code = error?.code ?? error?.response?.code;
      if (code === 409) {
        console.log(`Complaint ${$id} already exists, skipping...`);
      } else {
        console.log(`Error adding Complaint ${$id}: ${error?.message || error}`);
      }
    }
  }

  console.log('All 15 complaints processed!');
};

seedComplaints();
