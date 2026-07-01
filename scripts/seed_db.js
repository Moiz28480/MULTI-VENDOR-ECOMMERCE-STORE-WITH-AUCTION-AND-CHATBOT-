import { Client, Databases } from 'node-appwrite';

const PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = '69c1cfaf003a710f1232';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const databaseId = DATABASE_ID;

const dataMap = {
  users: [[
    { "$id": "u_1", "name": "Ahmed Ali", "email": "ahmed@test.com", "role": "vendor" },
    { "$id": "u_2", "name": "Sarah Khan", "email": "sarah@test.com", "role": "vendor" },
    { "$id": "u_3", "name": "Usman Tech", "email": "usman@test.com", "role": "vendor" },
    { "$id": "u_4", "name": "Zainab Styles", "email": "zainab@test.com", "role": "vendor" },
    { "$id": "u_5", "name": "Hamza Gadgets", "email": "hamza@test.com", "role": "vendor" },
    { "$id": "u_6", "name": "Fatima Decor", "email": "fatima@test.com", "role": "vendor" },
    { "$id": "u_7", "name": "Bilal Boots", "email": "bilal@test.com", "role": "vendor" },
    { "$id": "u_8", "name": "Amna Organic", "email": "amna@test.com", "role": "vendor" },
    { "$id": "u_9", "name": "Omer PC", "email": "omer@test.com", "role": "vendor" },
    { "$id": "u_10", "name": "Sana Craft", "email": "sana@test.com", "role": "vendor" },
    { "$id": "u_11", "name": "Customer One", "email": "c1@test.com", "role": "customer" },
    { "$id": "u_12", "name": "Customer Two", "email": "c2@test.com", "role": "customer" },
    { "$id": "u_13", "name": "Customer Three", "email": "c3@test.com", "role": "customer" },
    { "$id": "u_14", "name": "Customer Four", "email": "c4@test.com", "role": "customer" },
    { "$id": "u_15", "name": "Customer Five", "email": "c5@test.com", "role": "customer" },
    { "$id": "u_16", "name": "Customer Six", "email": "c6@test.com", "role": "customer" },
    { "$id": "u_17", "name": "Customer Seven", "email": "c7@test.com", "role": "customer" },
    { "$id": "u_18", "name": "Customer Eight", "email": "c8@test.com", "role": "customer" },
    { "$id": "u_19", "name": "Customer Nine", "email": "c9@test.com", "role": "customer" },
    { "$id": "u_20", "name": "Customer Ten", "email": "c10@test.com", "role": "customer" },
    { "$id": "u_21", "name": "Customer Eleven", "email": "c11@test.com", "role": "customer" },
    { "$id": "u_22", "name": "Customer Twelve", "email": "c12@test.com", "role": "customer" },
    { "$id": "u_23", "name": "Customer Thirteen", "email": "c13@test.com", "role": "customer" },
    { "$id": "u_24", "name": "Customer Fourteen", "email": "c14@test.com", "role": "customer" },
    { "$id": "u_25", "name": "Customer Fifteen", "email": "c15@test.com", "role": "customer" }
  ]],
  vendors: [[
    { "$id": "u_1", "vendorId": "u_1", "shopName": "Ahmed Electronics", "shopLogo": "https://picsum.photos/seed/u1/200", "isVerified": true },
    { "$id": "u_2", "vendorId": "u_2", "shopName": "Sarah's Boutique", "shopLogo": "https://picsum.photos/seed/u2/200", "isVerified": true },
    { "$id": "u_3", "vendorId": "u_3", "shopName": "Usman Tech Solutions", "shopLogo": "https://picsum.photos/seed/u3/200", "isVerified": false },
    { "$id": "u_4", "vendorId": "u_4", "shopName": "Zainab's Lawn Hub", "shopLogo": "https://picsum.photos/seed/u4/200", "isVerified": true },
    { "$id": "u_5", "vendorId": "u_5", "shopName": "Hamza Mobile Zone", "shopLogo": "https://picsum.photos/seed/u5/200", "isVerified": false },
    { "$id": "u_6", "vendorId": "u_6", "shopName": "Fatima Home Decor", "shopLogo": "https://picsum.photos/seed/u6/200", "isVerified": true },
    { "$id": "u_7", "vendorId": "u_7", "shopName": "Bilal's Footwear", "shopLogo": "https://picsum.photos/seed/u7/200", "isVerified": false },
    { "$id": "u_8", "vendorId": "u_8", "shopName": "Amna Organic Farm", "shopLogo": "https://picsum.photos/seed/u8/200", "isVerified": true },
    { "$id": "u_9", "vendorId": "u_9", "shopName": "Omer PC Build", "shopLogo": "https://picsum.photos/seed/u9/200", "isVerified": true },
    { "$id": "u_10", "vendorId": "u_10", "shopName": "Sana Craft Shop", "shopLogo": "https://picsum.photos/seed/u10/200", "isVerified": false }
  ]],
  products: [[
    { "$id": "p_1", "name": "Gaming Mouse RGB", "price": 45.00, "description": "High precision optical sensor with RGB lighting.", "imageUrl": "https://picsum.photos/seed/p1/400/300", "vendorId": "u_1", "category": "Electronics" },
    { "$id": "p_2", "name": "Mechanical Keyboard", "price": 85.50, "description": "Blue switch mechanical keyboard for tactile typing.", "imageUrl": "https://picsum.photos/seed/p2/400/300", "vendorId": "u_1", "category": "Electronics" },
    { "$id": "p_3", "name": "Summer Floral Dress", "price": 35.00, "description": "Lightweight cotton dress for summer comfort.", "imageUrl": "https://picsum.photos/seed/p3/400/300", "vendorId": "u_2", "category": "Fashion" },
    { "$id": "p_4", "name": "Silk Scarf", "price": 15.00, "description": "100% pure silk scarf with traditional patterns.", "imageUrl": "https://picsum.photos/seed/p4/400/300", "vendorId": "u_2", "category": "Fashion" },
    { "$id": "p_5", "name": "USB-C Fast Charger", "price": 25.00, "description": "65W fast charging for laptops and phones.", "imageUrl": "https://picsum.photos/seed/p5/400/300", "vendorId": "u_3", "category": "Electronics" },
    { "$id": "p_6", "name": "Designer Lawn Suit", "price": 65.00, "description": "Premium 3-piece unstitched lawn collection.", "imageUrl": "https://picsum.photos/seed/p6/400/300", "vendorId": "u_4", "category": "Fashion" },
    { "$id": "p_7", "name": "iPhone 15 Case", "price": 12.00, "description": "Magsafe compatible silicone protective case.", "imageUrl": "https://picsum.photos/seed/p7/400/300", "vendorId": "u_5", "category": "Electronics" },
    { "$id": "p_8", "name": "Ceramic Table Lamp", "price": 40.00, "description": "Elegant hand-crafted lamp for modern homes.", "imageUrl": "https://picsum.photos/seed/p8/400/300", "vendorId": "u_6", "category": "Home Decor" },
    { "$id": "p_9", "name": "Leather Chelsea Boots", "price": 110.00, "description": "Genuine leather boots with durable sole.", "imageUrl": "https://picsum.photos/seed/p9/400/300", "vendorId": "u_7", "category": "Fashion" },
    { "$id": "p_10", "name": "Organic Wild Honey", "price": 20.00, "description": "100% pure organic honey from Northern areas.", "imageUrl": "https://picsum.photos/seed/p10/400/300", "vendorId": "u_8", "category": "Groceries" },
    { "$id": "p_11", "name": "Gaming PC Case", "price": 95.00, "description": "Mid-tower ATX case with tempered glass.", "imageUrl": "https://picsum.photos/seed/p11/400/300", "vendorId": "u_9", "category": "Electronics" },
    { "$id": "p_12", "name": "Hand-painted Vase", "price": 30.00, "description": "Traditional blue pottery decorative vase.", "imageUrl": "https://picsum.photos/seed/p12/400/300", "vendorId": "u_10", "category": "Home Decor" },
    { "$id": "p_13", "name": "Wireless Earbuds", "price": 55.00, "description": "Noise cancelling Bluetooth 5.3 earbuds.", "imageUrl": "https://picsum.photos/seed/p13/400/300", "vendorId": "u_1", "category": "Electronics" },
    { "$id": "p_14", "name": "Cotton Tote Bag", "price": 10.00, "description": "Eco-friendly reusable shopping bag.", "imageUrl": "https://picsum.photos/seed/p14/400/300", "vendorId": "u_2", "category": "Fashion" },
    { "$id": "p_15", "name": "Velvet Throw Pillow", "price": 18.00, "description": "Soft velvet cushion for sofa decoration.", "imageUrl": "https://picsum.photos/seed/p15/400/300", "vendorId": "u_6", "category": "Home Decor" },
    { "$id": "p_16", "name": "Smartphone Stand", "price": 8.00, "description": "Adjustable aluminum desk stand.", "imageUrl": "https://picsum.photos/seed/p16/400/300", "vendorId": "u_5", "category": "Electronics" },
    { "$id": "p_17", "name": "Suede Loafers", "price": 85.00, "description": "Premium suede slip-on shoes for men.", "imageUrl": "https://picsum.photos/seed/p17/400/300", "vendorId": "u_7", "category": "Fashion" },
    { "$id": "p_18", "name": "Cold Pressed Olive Oil", "price": 28.00, "description": "Extra virgin olive oil for healthy cooking.", "imageUrl": "https://picsum.photos/seed/p18/400/300", "vendorId": "u_8", "category": "Groceries" },
    { "$id": "p_19", "name": "Monitor Arm", "price": 45.00, "description": "Single monitor gas spring mount.", "imageUrl": "https://picsum.photos/seed/p19/400/300", "vendorId": "u_9", "category": "Electronics" },
    { "$id": "p_20", "name": "Handmade Jute Rug", "price": 120.00, "description": "Natural fiber rug for rustic interior.", "imageUrl": "https://picsum.photos/seed/p20/400/300", "vendorId": "u_10", "category": "Home Decor" },
    { "$id": "p_21", "name": "Webcam 1080p", "price": 38.00, "description": "Full HD webcam with built-in microphone.", "imageUrl": "https://picsum.photos/seed/p21/400/300", "vendorId": "u_1", "category": "Electronics" },
    { "$id": "p_22", "name": "Lawn Printed Kurta", "price": 22.00, "description": "Daily wear comfortable cotton kurta.", "imageUrl": "https://picsum.photos/seed/p22/400/300", "vendorId": "u_4", "category": "Fashion" },
    { "$id": "p_23", "name": "Macbook Air Sleeve", "price": 20.00, "description": "Water-resistant padded laptop sleeve.", "imageUrl": "https://picsum.photos/seed/p23/400/300", "vendorId": "u_3", "category": "Electronics" },
    { "$id": "p_24", "name": "Organic Almonds 500g", "price": 14.00, "description": "Premium quality crunchy almonds.", "imageUrl": "https://picsum.photos/seed/p24/400/300", "vendorId": "u_8", "category": "Groceries" },
    { "$id": "p_25", "name": "Wall Clock Modern", "price": 25.00, "description": "Silent non-ticking minimalist clock.", "imageUrl": "https://picsum.photos/seed/p25/400/300", "vendorId": "u_6", "category": "Home Decor" }
  ]],
  orders: [[
    { "$id": "o_1", "customerId": "u_11", "vendorId": "u_1", "productId": "p_1", "quantity": 1, "totalAmount": 45.00, "status": "delivered" },
    { "$id": "o_2", "customerId": "u_12", "vendorId": "u_2", "productId": "p_3", "quantity": 2, "totalAmount": 70.00, "status": "shipped" },
    { "$id": "o_3", "customerId": "u_13", "vendorId": "u_4", "productId": "p_6", "quantity": 1, "totalAmount": 65.00, "status": "pending" },
    { "$id": "o_4", "customerId": "u_14", "vendorId": "u_8", "productId": "p_10", "quantity": 5, "totalAmount": 100.00, "status": "delivered" },
    { "$id": "o_5", "customerId": "u_15", "vendorId": "u_10", "productId": "p_12", "quantity": 1, "totalAmount": 30.00, "status": "processing" },
    { "$id": "o_6", "customerId": "u_16", "vendorId": "u_9", "productId": "p_11", "quantity": 1, "totalAmount": 95.00, "status": "shipped" },
    { "$id": "o_7", "customerId": "u_17", "vendorId": "u_7", "productId": "p_9", "quantity": 1, "totalAmount": 110.00, "status": "delivered" },
    { "$id": "o_8", "customerId": "u_18", "vendorId": "u_6", "productId": "p_8", "quantity": 2, "totalAmount": 80.00, "status": "pending" },
    { "$id": "o_9", "customerId": "u_19", "vendorId": "u_3", "productId": "p_5", "quantity": 1, "totalAmount": 25.00, "status": "delivered" },
    { "$id": "o_10", "customerId": "u_20", "vendorId": "u_5", "productId": "p_7", "quantity": 3, "totalAmount": 36.00, "status": "delivered" },
    { "$id": "o_11", "customerId": "u_21", "vendorId": "u_1", "productId": "p_2", "quantity": 1, "totalAmount": 85.50, "status": "pending" },
    { "$id": "o_12", "customerId": "u_22", "vendorId": "u_2", "productId": "p_14", "quantity": 4, "totalAmount": 40.00, "status": "delivered" },
    { "$id": "o_13", "customerId": "u_23", "vendorId": "u_6", "productId": "p_25", "quantity": 1, "totalAmount": 25.00, "status": "shipped" },
    { "$id": "o_14", "customerId": "u_24", "vendorId": "u_8", "productId": "p_18", "quantity": 2, "totalAmount": 56.00, "status": "processing" },
    { "$id": "o_15", "customerId": "u_25", "vendorId": "u_10", "productId": "p_20", "quantity": 1, "totalAmount": 120.00, "status": "delivered" }
  ]],
  reviews: [[
    { "$id": "r_1", "productId": "p_1", "userId": "u_11", "rating": 5, "comment": "Best gaming mouse I've ever used. Very responsive!" },
    { "$id": "r_2", "productId": "p_1", "userId": "u_12", "rating": 4, "comment": "Good, but the cable is a bit stiff." },
    { "$id": "r_3", "productId": "p_2", "userId": "u_13", "rating": 5, "comment": "The mechanical clicks are so satisfying." },
    { "$id": "r_4", "productId": "p_2", "userId": "u_14", "rating": 3, "comment": "A bit too loud for office use." },
    { "$id": "r_5", "productId": "p_3", "userId": "u_15", "rating": 5, "comment": "Beautiful summer dress, fits perfectly!" },
    { "$id": "r_6", "productId": "p_3", "userId": "u_16", "rating": 4, "comment": "Lovely fabric, but colors are slightly different than photo." },
    { "$id": "r_7", "productId": "p_4", "userId": "u_17", "rating": 5, "comment": "Pure silk as advertised. Very elegant." },
    { "$id": "r_8", "productId": "p_5", "userId": "u_18", "rating": 5, "comment": "Charges my laptop incredibly fast." },
    { "$id": "r_9", "productId": "p_5", "userId": "u_19", "rating": 4, "comment": "Compact and powerful charger." },
    { "$id": "r_10", "productId": "p_6", "userId": "u_20", "rating": 5, "comment": "The lawn quality is premium. Great value." },
    { "$id": "r_11", "productId": "p_6", "userId": "u_21", "rating": 5, "comment": "Beautiful embroidery work." },
    { "$id": "r_12", "productId": "p_7", "userId": "u_22", "rating": 4, "comment": "Fits the iPhone 15 perfectly." },
    { "$id": "r_13", "productId": "p_8", "userId": "u_23", "rating": 5, "comment": "This lamp is a piece of art. Love it!" },
    { "$id": "r_14", "productId": "p_9", "userId": "u_24", "rating": 5, "comment": "High quality leather. Very comfortable." },
    { "$id": "r_15", "productId": "p_10", "userId": "u_25", "rating": 5, "comment": "Pure honey, tastes amazing." },
    { "$id": "r_16", "productId": "p_11", "userId": "u_11", "rating": 4, "comment": "Great airflow in this PC case." },
    { "$id": "r_17", "productId": "p_12", "userId": "u_12", "rating": 5, "comment": "The blue pottery design is stunning." },
    { "$id": "r_18", "productId": "p_13", "userId": "u_13", "rating": 4, "comment": "Sound quality is great for the price." },
    { "$id": "r_19", "productId": "p_14", "userId": "u_14", "rating": 5, "comment": "Strong and eco-friendly. Use it daily." },
    { "$id": "r_20", "productId": "p_15", "userId": "u_15", "rating": 3, "comment": "Pillow is soft but smaller than expected." },
    { "$id": "r_21", "productId": "p_16", "userId": "u_16", "rating": 4, "comment": "Sturdy stand, holds my tablet well." },
    { "$id": "r_22", "productId": "p_17", "userId": "u_17", "rating": 5, "comment": "Classy loafers, perfect for weddings." },
    { "$id": "r_23", "productId": "p_18", "userId": "u_18", "rating": 5, "comment": "Authentic olive oil flavor." },
    { "$id": "r_24", "productId": "p_19", "userId": "u_19", "rating": 5, "comment": "Strong arm, holds my 32 inch monitor easily." },
    { "$id": "r_25", "productId": "p_20", "userId": "u_20", "rating": 4, "comment": "Rug is beautiful but sheds a little." },
    { "$id": "r_26", "productId": "p_21", "userId": "u_21", "rating": 4, "comment": "Clear video quality for Zoom calls." },
    { "$id": "r_27", "productId": "p_22", "userId": "u_22", "rating": 5, "comment": "Very comfortable for daily wear." },
    { "$id": "r_28", "productId": "p_23", "userId": "u_23", "rating": 4, "comment": "Nice padding, keeps my laptop safe." },
    { "$id": "r_29", "productId": "p_24", "userId": "u_24", "rating": 5, "comment": "Fresh and crunchy almonds." },
    { "$id": "r_30", "productId": "p_25", "userId": "u_25", "rating": 5, "comment": "Minimalist design, looks great on my wall." },
    { "$id": "r_31", "productId": "p_1", "userId": "u_13", "rating": 5, "comment": "Highly recommended for FPS players." },
    { "$id": "r_32", "productId": "p_2", "userId": "u_15", "rating": 4, "comment": "Solid build quality." },
    { "$id": "r_33", "productId": "p_3", "userId": "u_17", "rating": 5, "comment": "My favorite dress this season!" },
    { "$id": "r_34", "productId": "p_5", "userId": "u_21", "rating": 5, "comment": "Actually faster than the original charger." },
    { "$id": "r_35", "productId": "p_6", "userId": "u_23", "rating": 4, "comment": "Colors stayed bright after washing." },
    { "$id": "r_36", "productId": "p_9", "userId": "u_25", "rating": 4, "comment": "Needs a few days to break in, then perfect." },
    { "$id": "r_37", "productId": "p_10", "userId": "u_12", "rating": 5, "comment": "Best honey I've bought online." },
    { "$id": "r_38", "productId": "p_11", "userId": "u_14", "rating": 5, "comment": "Easy to build in, plenty of space." },
    { "$id": "r_39", "productId": "p_13", "userId": "u_16", "rating": 3, "comment": "Battery life is okay, not great." },
    { "$id": "r_40", "productId": "p_17", "userId": "u_18", "rating": 5, "comment": "Got many compliments on these." },
    { "$id": "r_41", "productId": "p_19", "userId": "u_20", "rating": 4, "comment": "Saves so much desk space." },
    { "$id": "r_42", "productId": "p_21", "userId": "u_22", "rating": 4, "comment": "Good autofocus." },
    { "$id": "r_43", "productId": "p_24", "userId": "u_24", "rating": 5, "comment": "Very nutritious and fresh." },
    { "$id": "r_44", "productId": "p_25", "userId": "u_11", "rating": 5, "comment": "Silent and accurate." },
    { "$id": "r_45", "productId": "p_8", "userId": "u_13", "rating": 4, "comment": "Perfect bedside lamp." },
    { "$id": "r_46", "productId": "p_12", "userId": "u_15", "rating": 5, "comment": "Matches my decor perfectly." },
    { "$id": "r_47", "productId": "p_4", "userId": "u_19", "rating": 4, "comment": "Very soft material." },
    { "$id": "r_48", "productId": "p_15", "userId": "u_21", "rating": 5, "comment": "Premium feel." },
    { "$id": "r_49", "productId": "p_18", "userId": "u_23", "rating": 5, "comment": "Pure quality oil." },
    { "$id": "r_50", "productId": "p_20", "userId": "u_12", "rating": 5, "comment": "Exceeded my expectations!" }
  ]],
};

const isAlreadyExistsError = (error) => {
  const type = error?.response?.type;
  const code = error?.code ?? error?.response?.code;
  return code === 409 && type === 'document_already_exists';
};

async function seedDatabase() {
  try {
    for (const [collectionId, groups] of Object.entries(dataMap)) {
      const items = Array.isArray(groups) ? groups.flat() : [];

      for (const item of items) {
        const { $id, ...data } = item;

        try {
          await databases.createDocument(databaseId, collectionId, item.$id, data);
        } catch (error) {
          if (!isAlreadyExistsError(error)) {
            throw error;
          }
        }
      }

      const collectionName = collectionId.charAt(0).toUpperCase() + collectionId.slice(1);
      console.log(`Successfully seeded ${collectionName}`);
    }

    console.log('\nTo run this script: node scripts/seed_db.js');
  } catch (error) {
    console.error('Error while seeding database:', error?.message || error);
    process.exit(1);
  }
}

seedDatabase();
