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

const products = [
  /* Sports and Fitness */
  { "$id": "p_sf_1", "name": "Adjustable Dumbbell Set", "price": 150.00, "category": "Sports and Fitness", "vendorId": "69c1dd11003135481878", "stock": 10, "description": "Steel dumbbells with weight adjustment.", "imageUrl": "https://picsum.photos/seed/sf1/400/300" },
  { "$id": "p_sf_2", "name": "Yoga Mat Premium", "price": 25.00, "category": "Sports and Fitness", "vendorId": "v_super", "stock": 40, "description": "Non-slip eco-friendly rubber mat.", "imageUrl": "https://picsum.photos/seed/sf2/400/300" },
  { "$id": "p_sf_3", "name": "Resistance Bands Kit", "price": 15.00, "category": "Sports and Fitness", "vendorId": "69c31492001e2155fc91", "stock": 100, "description": "Set of 5 elastic bands.", "imageUrl": "https://picsum.photos/seed/sf3/400/300" },
  { "$id": "p_sf_4", "name": "Treadmill X-Pro", "price": 850.00, "category": "Sports and Fitness", "vendorId": "v_super", "stock": 5, "description": "Foldable motorized treadmill.", "imageUrl": "https://picsum.photos/seed/sf4/400/300" },
  { "$id": "p_sf_5", "name": "Basketball Official", "price": 35.00, "category": "Sports and Fitness", "vendorId": "69c31497001777c4c836", "stock": 25, "description": "Durable indoor/outdoor basketball.", "imageUrl": "https://picsum.photos/seed/sf5/400/300" },

  /* Books and Media */
  { "$id": "p_bm_1", "name": "Coding for Beginners", "price": 20.00, "category": "Books and Media", "vendorId": "69c3149a000bda936fe0", "stock": 15, "description": "Step-by-step guide to coding.", "imageUrl": "https://picsum.photos/seed/bm1/400/300" },
  { "$id": "p_bm_2", "name": "Mystery of the Void", "price": 12.00, "category": "Books and Media", "vendorId": "69c3149100141f9eeec0", "stock": 50, "description": "Best-selling thriller novel.", "imageUrl": "https://picsum.photos/seed/bm2/400/300" },
  { "$id": "p_bm_3", "name": "Vintage Vinyl Record", "price": 45.00, "category": "Books and Media", "vendorId": "69c314960011d63a7bd2", "stock": 5, "description": "Classic rock album.", "imageUrl": "https://picsum.photos/seed/bm3/400/300" },
  { "$id": "p_bm_4", "name": "UI/UX Masterclass", "price": 35.00, "category": "Books and Media", "vendorId": "69c31499000f8e8776ca", "stock": 20, "description": "Hardcover design book.", "imageUrl": "https://picsum.photos/seed/bm4/400/300" },
  { "$id": "p_bm_5", "name": "Sci-Fi Trilogy Box Set", "price": 55.00, "category": "Books and Media", "vendorId": "69c3149a000bda936fe0", "stock": 10, "description": "Three-part galactic war series.", "imageUrl": "https://picsum.photos/seed/bm5/400/300" },

  /* Baby and Kids */
  { "$id": "p_bk_1", "name": "Soft Cotton Onesie Set", "price": 30.00, "category": "Baby and Kids", "vendorId": "69c31493003de0d2bcf2", "stock": 50, "description": "5-pack organic cotton bodysuits.", "imageUrl": "https://picsum.photos/seed/bk1/400/300" },
  { "$id": "p_bk_2", "name": "Building Blocks Set", "price": 25.00, "category": "Baby and Kids", "vendorId": "69c3149a000bda936fe0", "stock": 30, "description": "Colorful wooden blocks.", "imageUrl": "https://picsum.photos/seed/bk2/400/300" },
  { "$id": "p_bk_3", "name": "Musical Baby Mobile", "price": 40.00, "category": "Baby and Kids", "vendorId": "69c314960011d63a7bd2", "stock": 12, "description": "Crib attachment with lullabies.", "imageUrl": "https://picsum.photos/seed/bk3/400/300" },
  { "$id": "p_bk_4", "name": "Kids Tricycle", "price": 75.00, "category": "Baby and Kids", "vendorId": "v_super", "stock": 8, "description": "Sturdy 3-wheel bike.", "imageUrl": "https://picsum.photos/seed/bk4/400/300" },
  { "$id": "p_bk_5", "name": "Plush Teddy Bear", "price": 18.00, "category": "Baby and Kids", "vendorId": "69c3149100141f9eeec0", "stock": 100, "description": "Ultra-soft stuffed bear.", "imageUrl": "https://picsum.photos/seed/bk5/400/300" },

  /* Beauty and Personal Care */
  { "$id": "p_bc_1", "name": "Organic Face Serum", "price": 35.00, "category": "Beauty and Personal Care", "vendorId": "69c3149100141f9eeec0", "stock": 45, "description": "Vitamin C glowing serum.", "imageUrl": "https://picsum.photos/seed/bc1/400/300" },
  { "$id": "p_bc_2", "name": "Matte Lipstick Set", "price": 40.00, "category": "Beauty and Personal Care", "vendorId": "69c3149800148cda06d3", "stock": 60, "description": "Waterproof lip colors.", "imageUrl": "https://picsum.photos/seed/bc2/400/300" },
  { "$id": "p_bc_3", "name": "Electric Cleanser", "price": 50.00, "category": "Beauty and Personal Care", "vendorId": "69c314900007b96eaa44", "stock": 15, "description": "Silicone sonic brush.", "imageUrl": "https://picsum.photos/seed/bc3/400/300" },
  { "$id": "p_bc_4", "name": "Argan Oil Hair Mask", "price": 22.00, "category": "Beauty and Personal Care", "vendorId": "69c31493003de0d2bcf2", "stock": 30, "description": "Deep conditioning mask.", "imageUrl": "https://picsum.photos/seed/bc4/400/300" },
  { "$id": "p_bc_5", "name": "Makeup Brushes Set", "price": 28.00, "category": "Beauty and Personal Care", "vendorId": "69c3149100141f9eeec0", "stock": 25, "description": "12-piece brush set.", "imageUrl": "https://picsum.photos/seed/bc5/400/300" },

  /* Health and Wellness */
  { "$id": "p_hw_1", "name": "Herbal Green Tea", "price": 15.00, "category": "Health and Wellness", "vendorId": "69c3149800148cda06d3", "stock": 80, "description": "Natural detox tea.", "imageUrl": "https://picsum.photos/seed/hw1/400/300" },
  { "$id": "p_hw_2", "name": "Cold-Pressed Flax Oil", "price": 18.00, "category": "Health and Wellness", "vendorId": "69c3149800148cda06d3", "stock": 40, "description": "Rich in Omega-3.", "imageUrl": "https://picsum.photos/seed/hw2/400/300" },
  { "$id": "p_hw_3", "name": "BP Monitor Digital", "price": 55.00, "category": "Health and Wellness", "vendorId": "69c31492001e2155fc91", "stock": 10, "description": "Upper arm monitor.", "imageUrl": "https://picsum.photos/seed/hw3/400/300" },
  { "$id": "p_hw_4", "name": "Multivitamins 60ct", "price": 25.00, "category": "Health and Wellness", "vendorId": "69c3149500004862f61b", "stock": 100, "description": "Essential vitamins.", "imageUrl": "https://picsum.photos/seed/hw4/400/300" },
  { "$id": "p_hw_5", "name": "Aromatherapy Diffuser", "price": 32.00, "category": "Health and Wellness", "vendorId": "69c314960011d63a7bd2", "stock": 20, "description": "Ultrasonic LED diffuser.", "imageUrl": "https://picsum.photos/seed/hw5/400/300" },

  /* Gaming */
  { "$id": "p_ga_1", "name": "RTX 4070 GPU", "price": 650.00, "category": "Gaming", "vendorId": "69c31499000f8e8776ca", "stock": 4, "description": "High-performance GPU.", "imageUrl": "https://picsum.photos/seed/ga1/400/300" },
  { "$id": "p_ga_2", "name": "Mechanical Keyboard", "price": 85.00, "category": "Gaming", "vendorId": "69c314900007b96eaa44", "stock": 30, "description": "RGB tactile switches.", "imageUrl": "https://picsum.photos/seed/ga2/400/300" },
  { "$id": "p_ga_3", "name": "Wireless Gaming Mouse", "price": 45.00, "category": "Gaming", "vendorId": "69c31499000f8e8776ca", "stock": 50, "description": "16k DPI ultra-light mouse.", "imageUrl": "https://picsum.photos/seed/ga3/400/300" },
  { "$id": "p_ga_4", "name": "Gaming Chair Pro", "price": 220.00, "category": "Gaming", "vendorId": "v_super", "stock": 6, "description": "Ergonomic racing chair.", "imageUrl": "https://picsum.photos/seed/ga4/400/300" },
  { "$id": "p_ga_5", "name": "27-inch 165Hz Monitor", "price": 280.00, "category": "Gaming", "vendorId": "69c31499000f8e8776ca", "stock": 10, "description": "IPS 1ms response time.", "imageUrl": "https://picsum.photos/seed/ga5/400/300" },

  /* Automotive */
  { "$id": "p_au_1", "name": "Car Dash Cam HD", "price": 95.00, "category": "Automotive", "vendorId": "69c1dd11003135481878", "stock": 15, "description": "1080p night vision cam.", "imageUrl": "https://picsum.photos/seed/au1/400/300" },
  { "$id": "p_au_2", "name": "Portable Tire Inflator", "price": 40.00, "category": "Automotive", "vendorId": "69c31492001e2155fc91", "stock": 25, "description": "Digital air pump.", "imageUrl": "https://picsum.photos/seed/au2/400/300" },
  { "$id": "p_au_3", "name": "Synthetic Engine Oil", "price": 35.00, "category": "Automotive", "vendorId": "69c1dd11003135481878", "stock": 40, "description": "Premium 4-liter oil.", "imageUrl": "https://picsum.photos/seed/au3/400/300" },
  { "$id": "p_au_4", "name": "Car Vacuum Cleaner", "price": 30.00, "category": "Automotive", "vendorId": "v_super", "stock": 20, "description": "High-suction handheld.", "imageUrl": "https://picsum.photos/seed/au4/400/300" },
  { "$id": "p_au_5", "name": "Bluetooth Transmitter", "price": 18.00, "category": "Automotive", "vendorId": "69c3149500004862f61b", "stock": 60, "description": "FM transmitter + charging.", "imageUrl": "https://picsum.photos/seed/au5/400/300" },

  /* Pet Supplies */
  { "$id": "p_ps_1", "name": "Smart Pet Feeder", "price": 110.00, "category": "Pet Supplies", "vendorId": "69c31492001e2155fc91", "stock": 10, "description": "WiFi automatic feeder.", "imageUrl": "https://picsum.photos/seed/ps1/400/300" },
  { "$id": "p_ps_2", "name": "GPS Pet Tracker", "price": 45.00, "category": "Pet Supplies", "vendorId": "69c314900007b96eaa44", "stock": 30, "description": "Real-time location tracking.", "imageUrl": "https://picsum.photos/seed/ps2/400/300" },
  { "$id": "p_ps_3", "name": "Orthopedic Dog Bed", "price": 65.00, "category": "Pet Supplies", "vendorId": "69c314960011d63a7bd2", "stock": 15, "description": "Memory foam bed.", "imageUrl": "https://picsum.photos/seed/ps3/400/300" },
  { "$id": "p_ps_4", "name": "Interactive Cat Laser", "price": 20.00, "category": "Pet Supplies", "vendorId": "69c31492001e2155fc91", "stock": 50, "description": "Automatic laser toy.", "imageUrl": "https://picsum.photos/seed/ps4/400/300" },
  { "$id": "p_ps_5", "name": "Pet Grooming Kit", "price": 35.00, "category": "Pet Supplies", "vendorId": "69c3149800148cda06d3", "stock": 20, "description": "Electric silent clippers.", "imageUrl": "https://picsum.photos/seed/ps5/400/300" },

  /* Musical Instruments */
  { "$id": "p_mu_1", "name": "Acoustic Guitar", "price": 130.00, "category": "Musical Instruments", "vendorId": "69c314960011d63a7bd2", "stock": 8, "description": "Full-size steel-string.", "imageUrl": "https://picsum.photos/seed/mu1/400/300" },
  { "$id": "p_mu_2", "name": "Electronic Keyboard", "price": 110.00, "category": "Musical Instruments", "vendorId": "69c3149a000bda936fe0", "stock": 12, "description": "Portable 61-key piano.", "imageUrl": "https://picsum.photos/seed/mu2/400/300" },
  { "$id": "p_mu_3", "name": "Electric Violin Set", "price": 180.00, "category": "Musical Instruments", "vendorId": "v_super", "stock": 4, "description": "Silent practice violin.", "imageUrl": "https://picsum.photos/seed/mu3/400/300" },
  { "$id": "p_mu_4", "name": "Drum Practice Pad", "price": 35.00, "category": "Musical Instruments", "vendorId": "69c314960011d63a7bd2", "stock": 25, "description": "Durable training pad.", "imageUrl": "https://picsum.photos/seed/mu4/400/300" },
  { "$id": "p_mu_5", "name": "Harmonica C-Major", "price": 15.00, "category": "Musical Instruments", "vendorId": "69c3149500004862f61b", "stock": 50, "description": "Classic blues harmonica.", "imageUrl": "https://picsum.photos/seed/mu5/400/300" },

  /* Art and Craft */
  { "$id": "p_ac_1", "name": "Acrylic Paint Set", "price": 28.00, "category": "Art and Craft", "vendorId": "69c3149a000bda936fe0", "stock": 40, "description": "24 vibrant colors.", "imageUrl": "https://picsum.photos/seed/ac1/400/300" },
  { "$id": "p_ac_2", "name": "Canvas Panels 10pk", "price": 22.00, "category": "Art and Craft", "vendorId": "69c314960011d63a7bd2", "stock": 60, "description": "Acid-free cotton panels.", "imageUrl": "https://picsum.photos/seed/ac2/400/300" },
  { "$id": "p_ac_3", "name": "Pottery Clay 5kg", "price": 18.00, "category": "Art and Craft", "vendorId": "69c3149a000bda936fe0", "stock": 30, "description": "Natural air-dry clay.", "imageUrl": "https://picsum.photos/seed/ac3/400/300" },
  { "$id": "p_ac_4", "name": "Artist Sketch Pencils", "price": 12.00, "category": "Art and Craft", "vendorId": "69c3149100141f9eeec0", "stock": 100, "description": "4H to 6B with charcoal.", "imageUrl": "https://picsum.photos/seed/ac4/400/300" },
  { "$id": "p_ac_5", "name": "Calligraphy Dip Pen", "price": 35.00, "category": "Art and Craft", "vendorId": "69c3149a000bda936fe0", "stock": 15, "description": "Vintage style pen kit.", "imageUrl": "https://picsum.photos/seed/ac5/400/300" },

  /* Kitchen and Dinning */
  { "$id": "p_kd_1", "name": "Non-Stick Cookware", "price": 140.00, "category": "Kitchen and Dinning", "vendorId": "69c314960011d63a7bd2", "stock": 10, "description": "10-piece pot/pan set.", "imageUrl": "https://picsum.photos/seed/kd1/400/300" },
  { "$id": "p_kd_2", "name": "Digital Air Fryer", "price": 95.00, "category": "Kitchen and Dinning", "vendorId": "v_super", "stock": 18, "description": "Oil-free 5L fryer.", "imageUrl": "https://picsum.photos/seed/kd2/400/300" },
  { "$id": "p_kd_3", "name": "Chef's Knife", "price": 45.00, "category": "Kitchen and Dinning", "vendorId": "69c314960011d63a7bd2", "stock": 25, "description": "High-carbon steel blade.", "imageUrl": "https://picsum.photos/seed/kd3/400/300" },
  { "$id": "p_kd_4", "name": "Dinnerware Set", "price": 110.00, "category": "Kitchen and Dinning", "vendorId": "69c3149800148cda06d3", "stock": 8, "description": "24-piece ceramic set.", "imageUrl": "https://picsum.photos/seed/kd4/400/300" },
  { "$id": "p_kd_5", "name": "Milk Frother", "price": 30.00, "category": "Kitchen and Dinning", "vendorId": "69c31492001e2155fc91", "stock": 30, "description": "Electric frother.", "imageUrl": "https://picsum.photos/seed/kd5/400/300" },

  /* Watch and Jewellery */
  { "$id": "p_wj_1", "name": "Minimalist Silver Watch", "price": 75.00, "category": "Watch and Jewellery", "vendorId": "69c31497001777c4c836", "stock": 15, "description": "Quartz mesh strap.", "imageUrl": "https://picsum.photos/seed/wj1/400/300" },
  { "$id": "p_wj_2", "name": "Gold Plated Necklace", "price": 45.00, "category": "Watch and Jewellery", "vendorId": "69c3149100141f9eeec0", "stock": 20, "description": "18k gold chain pendant.", "imageUrl": "https://picsum.photos/seed/wj2/400/300" },
  { "$id": "p_wj_3", "name": "Smart Fitness Watch", "price": 60.00, "category": "Watch and Jewellery", "vendorId": "69c3149500004862f61b", "stock": 40, "description": "Health tracking watch.", "imageUrl": "https://picsum.photos/seed/wj3/400/300" },
  { "$id": "p_wj_4", "name": "Surgical Steel Earrings", "price": 15.00, "category": "Watch and Jewellery", "vendorId": "69c31497001777c4c836", "stock": 100, "description": "Hypoallergenic studs.", "imageUrl": "https://picsum.photos/seed/wj4/400/300" },
  { "$id": "p_wj_5", "name": "Leather Strap Chronograph", "price": 120.00, "category": "Watch and Jewellery", "vendorId": "v_super", "stock": 5, "description": "Premium analog watch.", "imageUrl": "https://picsum.photos/seed/wj5/400/300" }
];

const isAlreadyExistsError = (error) => {
  const type = error?.response?.type;
  const code = error?.code ?? error?.response?.code;
  return code === 409 && type === 'document_already_exists';
};

async function seedProducts() {
  try {
    let successCount = 0;
    let skipCount = 0;
    const collectionId = 'products';

    for (const item of products) {
      const { $id, ...data } = item;

      try {
        await databases.createDocument(databaseId, collectionId, item.$id, data);
        successCount++;
        console.log(`✓ Created product: ${item.name} (${item.$id})`);
      } catch (error) {
        if (isAlreadyExistsError(error)) {
          skipCount++;
          console.log(`⊘ Skipped (already exists): ${item.name} (${item.$id})`);
        } else {
          console.error(`✗ Error creating ${item.name} (${item.$id}):`, error?.message || error);
        }
      }
    }

    console.log(`\n✓ Successfully created ${successCount} products`);
    if (skipCount > 0) {
      console.log(`⊘ Skipped ${skipCount} products (already exist)`);
    }
    console.log(`\nTo run this script: node scripts/seed_products_extended.js`);
  } catch (error) {
    console.error('Error while seeding products:', error?.message || error);
    process.exit(1);
  }
}

seedProducts();
