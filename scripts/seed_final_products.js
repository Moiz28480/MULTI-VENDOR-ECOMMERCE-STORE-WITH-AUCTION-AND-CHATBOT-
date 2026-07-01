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

// Helper function to generate Unsplash URL based on product keywords
const generateUnsplashUrl = (productName, category) => {
  // Extract key keywords from product name and category
  const nameKeywords = productName.toLowerCase().split(' ').slice(0, 2).join(',');
  const categoryKeyword = category.toLowerCase().split(' ')[0];
  const keywords = `${nameKeywords},${categoryKeyword}`;
  return `https://source.unsplash.com/featured/?${keywords}`;
};

const products = [
  /* Sports and Fitness */
  { "$id": "p_sf_1", "name": "Adjustable Dumbbell Set", "price": 150.00, "category": "Sports and Fitness", "vendorId": "69c1dd11003135481878", "stock": 10, "description": "Steel dumbbells with weight adjustment." },
  { "$id": "p_sf_2", "name": "Yoga Mat Premium", "price": 25.00, "category": "Sports and Fitness", "vendorId": "v_super", "stock": 40, "description": "Non-slip eco-friendly rubber mat." },
  { "$id": "p_sf_3", "name": "Resistance Bands Kit", "price": 15.00, "category": "Sports and Fitness", "vendorId": "69c31492001e2155fc91", "stock": 100, "description": "Set of 5 elastic bands." },
  { "$id": "p_sf_4", "name": "Treadmill X-Pro", "price": 850.00, "category": "Sports and Fitness", "vendorId": "v_super", "stock": 5, "description": "Foldable motorized treadmill." },
  { "$id": "p_sf_5", "name": "Basketball Official", "price": 35.00, "category": "Sports and Fitness", "vendorId": "69c31497001777c4c836", "stock": 25, "description": "Durable indoor/outdoor basketball." },

  /* Books and Media */
  { "$id": "p_bm_1", "name": "Coding for Beginners", "price": 20.00, "category": "Books and Media", "vendorId": "69c3149a000bda936fe0", "stock": 15, "description": "Step-by-step guide to coding." },
  { "$id": "p_bm_2", "name": "Mystery of the Void", "price": 12.00, "category": "Books and Media", "vendorId": "69c3149100141f9eeec0", "stock": 50, "description": "Best-selling thriller novel." },
  { "$id": "p_bm_3", "name": "Vintage Vinyl Record", "price": 45.00, "category": "Books and Media", "vendorId": "69c314960011d63a7bd2", "stock": 5, "description": "Classic rock album." },
  { "$id": "p_bm_4", "name": "UI/UX Masterclass", "price": 35.00, "category": "Books and Media", "vendorId": "69c31499000f8e8776ca", "stock": 20, "description": "Hardcover design book." },
  { "$id": "p_bm_5", "name": "Sci-Fi Trilogy Box Set", "price": 55.00, "category": "Books and Media", "vendorId": "69c3149a000bda936fe0", "stock": 10, "description": "Three-part galactic war series." },

  /* Baby and Kids */
  { "$id": "p_bk_1", "name": "Soft Cotton Onesie Set", "price": 30.00, "category": "Baby and Kids", "vendorId": "69c31493003de0d2bcf2", "stock": 50, "description": "5-pack organic cotton bodysuits." },
  { "$id": "p_bk_2", "name": "Building Blocks Set", "price": 25.00, "category": "Baby and Kids", "vendorId": "69c3149a000bda936fe0", "stock": 30, "description": "Colorful wooden blocks." },
  { "$id": "p_bk_3", "name": "Musical Baby Mobile", "price": 40.00, "category": "Baby and Kids", "vendorId": "69c314960011d63a7bd2", "stock": 12, "description": "Crib attachment with lullabies." },
  { "$id": "p_bk_4", "name": "Kids Tricycle", "price": 75.00, "category": "Baby and Kids", "vendorId": "v_super", "stock": 8, "description": "Sturdy 3-wheel bike." },
  { "$id": "p_bk_5", "name": "Plush Teddy Bear", "price": 18.00, "category": "Baby and Kids", "vendorId": "69c3149100141f9eeec0", "stock": 100, "description": "Ultra-soft stuffed bear." },

  /* Beauty and Personal Care */
  { "$id": "p_bc_1", "name": "Organic Face Serum", "price": 35.00, "category": "Beauty and Personal Care", "vendorId": "69c3149100141f9eeec0", "stock": 45, "description": "Vitamin C glowing serum." },
  { "$id": "p_bc_2", "name": "Matte Lipstick Set", "price": 40.00, "category": "Beauty and Personal Care", "vendorId": "69c3149800148cda06d3", "stock": 60, "description": "Waterproof lip colors." },
  { "$id": "p_bc_3", "name": "Electric Cleanser", "price": 50.00, "category": "Beauty and Personal Care", "vendorId": "69c314900007b96eaa44", "stock": 15, "description": "Silicone sonic brush." },
  { "$id": "p_bc_4", "name": "Argan Oil Hair Mask", "price": 22.00, "category": "Beauty and Personal Care", "vendorId": "69c31493003de0d2bcf2", "stock": 30, "description": "Deep conditioning mask." },
  { "$id": "p_bc_5", "name": "Makeup Brushes Set", "price": 28.00, "category": "Beauty and Personal Care", "vendorId": "69c3149100141f9eeec0", "stock": 25, "description": "12-piece brush set." },

  /* Health and Wellness */
  { "$id": "p_hw_1", "name": "Herbal Green Tea", "price": 15.00, "category": "Health and Wellness", "vendorId": "69c3149800148cda06d3", "stock": 80, "description": "Natural detox tea." },
  { "$id": "p_hw_2", "name": "Cold-Pressed Flax Oil", "price": 18.00, "category": "Health and Wellness", "vendorId": "69c3149800148cda06d3", "stock": 40, "description": "Rich in Omega-3." },
  { "$id": "p_hw_3", "name": "BP Monitor Digital", "price": 55.00, "category": "Health and Wellness", "vendorId": "69c31492001e2155fc91", "stock": 10, "description": "Upper arm monitor." },
  { "$id": "p_hw_4", "name": "Multivitamins 60ct", "price": 25.00, "category": "Health and Wellness", "vendorId": "69c3149500004862f61b", "stock": 100, "description": "Essential vitamins." },
  { "$id": "p_hw_5", "name": "Aromatherapy Diffuser", "price": 32.00, "category": "Health and Wellness", "vendorId": "69c314960011d63a7bd2", "stock": 20, "description": "Ultrasonic LED diffuser." },

  /* Gaming */
  { "$id": "p_ga_1", "name": "RTX 4070 GPU", "price": 650.00, "category": "Gaming", "vendorId": "69c31499000f8e8776ca", "stock": 4, "description": "High-performance GPU." },
  { "$id": "p_ga_2", "name": "Mechanical Keyboard", "price": 85.00, "category": "Gaming", "vendorId": "69c314900007b96eaa44", "stock": 30, "description": "RGB tactile switches." },
  { "$id": "p_ga_3", "name": "Wireless Gaming Mouse", "price": 45.00, "category": "Gaming", "vendorId": "69c31499000f8e8776ca", "stock": 50, "description": "16k DPI ultra-light mouse." },
  { "$id": "p_ga_4", "name": "Gaming Chair Pro", "price": 220.00, "category": "Gaming", "vendorId": "v_super", "stock": 6, "description": "Ergonomic racing chair." },
  { "$id": "p_ga_5", "name": "27-inch 165Hz Monitor", "price": 280.00, "category": "Gaming", "vendorId": "69c31499000f8e8776ca", "stock": 10, "description": "IPS 1ms response time." },

  /* Automotive */
  { "$id": "p_au_1", "name": "Car Dash Cam HD", "price": 95.00, "category": "Automotive", "vendorId": "69c1dd11003135481878", "stock": 15, "description": "1080p night vision cam." },
  { "$id": "p_au_2", "name": "Portable Tire Inflator", "price": 40.00, "category": "Automotive", "vendorId": "69c31492001e2155fc91", "stock": 25, "description": "Digital air pump." },
  { "$id": "p_au_3", "name": "Synthetic Engine Oil", "price": 35.00, "category": "Automotive", "vendorId": "69c1dd11003135481878", "stock": 40, "description": "Premium 4-liter oil." },
  { "$id": "p_au_4", "name": "Car Vacuum Cleaner", "price": 30.00, "category": "Automotive", "vendorId": "v_super", "stock": 20, "description": "High-suction handheld." },
  { "$id": "p_au_5", "name": "Bluetooth Transmitter", "price": 18.00, "category": "Automotive", "vendorId": "69c3149500004862f61b", "stock": 60, "description": "FM transmitter + charging." },

  /* Pet Supplies */
  { "$id": "p_ps_1", "name": "Smart Pet Feeder", "price": 110.00, "category": "Pet Supplies", "vendorId": "69c31492001e2155fc91", "stock": 10, "description": "WiFi automatic feeder." },
  { "$id": "p_ps_2", "name": "GPS Pet Tracker", "price": 45.00, "category": "Pet Supplies", "vendorId": "69c314900007b96eaa44", "stock": 30, "description": "Real-time location tracking." },
  { "$id": "p_ps_3", "name": "Orthopedic Dog Bed", "price": 65.00, "category": "Pet Supplies", "vendorId": "69c314960011d63a7bd2", "stock": 15, "description": "Memory foam bed." },
  { "$id": "p_ps_4", "name": "Interactive Cat Laser", "price": 20.00, "category": "Pet Supplies", "vendorId": "69c31492001e2155fc91", "stock": 50, "description": "Automatic laser toy." },
  { "$id": "p_ps_5", "name": "Pet Grooming Kit", "price": 35.00, "category": "Pet Supplies", "vendorId": "69c3149800148cda06d3", "stock": 20, "description": "Electric silent clippers." },

  /* Musical Instruments */
  { "$id": "p_mu_1", "name": "Acoustic Guitar", "price": 130.00, "category": "Musical Instruments", "vendorId": "69c314960011d63a7bd2", "stock": 8, "description": "Full-size steel-string." },
  { "$id": "p_mu_2", "name": "Electronic Keyboard", "price": 110.00, "category": "Musical Instruments", "vendorId": "69c3149a000bda936fe0", "stock": 12, "description": "Portable 61-key piano." },
  { "$id": "p_mu_3", "name": "Electric Violin Set", "price": 180.00, "category": "Musical Instruments", "vendorId": "v_super", "stock": 4, "description": "Silent practice violin." },
  { "$id": "p_mu_4", "name": "Drum Practice Pad", "price": 35.00, "category": "Musical Instruments", "vendorId": "69c314960011d63a7bd2", "stock": 25, "description": "Durable training pad." },
  { "$id": "p_mu_5", "name": "Harmonica C-Major", "price": 15.00, "category": "Musical Instruments", "vendorId": "69c3149500004862f61b", "stock": 50, "description": "Classic blues harmonica." },

  /* Art and Craft */
  { "$id": "p_ac_1", "name": "Acrylic Paint Set", "price": 28.00, "category": "Art and Craft", "vendorId": "69c3149a000bda936fe0", "stock": 40, "description": "24 vibrant colors." },
  { "$id": "p_ac_2", "name": "Canvas Panels 10pk", "price": 22.00, "category": "Art and Craft", "vendorId": "69c314960011d63a7bd2", "stock": 60, "description": "Acid-free cotton panels." },
  { "$id": "p_ac_3", "name": "Pottery Clay 5kg", "price": 18.00, "category": "Art and Craft", "vendorId": "69c3149a000bda936fe0", "stock": 30, "description": "Natural air-dry clay." },
  { "$id": "p_ac_4", "name": "Artist Sketch Pencils", "price": 12.00, "category": "Art and Craft", "vendorId": "69c3149100141f9eeec0", "stock": 100, "description": "4H to 6B with charcoal." },
  { "$id": "p_ac_5", "name": "Calligraphy Dip Pen", "price": 35.00, "category": "Art and Craft", "vendorId": "69c3149a000bda936fe0", "stock": 15, "description": "Vintage style pen kit." },

  /* Kitchen and Dinning */
  { "$id": "p_kd_1", "name": "Non-Stick Cookware", "price": 140.00, "category": "Kitchen and Dinning", "vendorId": "69c314960011d63a7bd2", "stock": 10, "description": "10-piece pot/pan set." },
  { "$id": "p_kd_2", "name": "Digital Air Fryer", "price": 95.00, "category": "Kitchen and Dinning", "vendorId": "v_super", "stock": 18, "description": "Oil-free 5L fryer." },
  { "$id": "p_kd_3", "name": "Chef's Knife", "price": 45.00, "category": "Kitchen and Dinning", "vendorId": "69c314960011d63a7bd2", "stock": 25, "description": "High-carbon steel blade." },
  { "$id": "p_kd_4", "name": "Dinnerware Set", "price": 110.00, "category": "Kitchen and Dinning", "vendorId": "69c3149800148cda06d3", "stock": 8, "description": "24-piece ceramic set." },
  { "$id": "p_kd_5", "name": "Milk Frother", "price": 30.00, "category": "Kitchen and Dinning", "vendorId": "69c31492001e2155fc91", "stock": 30, "description": "Electric frother." },

  /* Watch and Jewellery */
  { "$id": "p_wj_1", "name": "Minimalist Silver Watch", "price": 75.00, "category": "Watch and Jewellery", "vendorId": "69c31497001777c4c836", "stock": 15, "description": "Quartz mesh strap." },
  { "$id": "p_wj_2", "name": "Gold Plated Necklace", "price": 45.00, "category": "Watch and Jewellery", "vendorId": "69c3149100141f9eeec0", "stock": 20, "description": "18k gold chain pendant." },
  { "$id": "p_wj_3", "name": "Smart Fitness Watch", "price": 60.00, "category": "Watch and Jewellery", "vendorId": "69c3149500004862f61b", "stock": 40, "description": "Health tracking watch." },
  { "$id": "p_wj_4", "name": "Surgical Steel Earrings", "price": 15.00, "category": "Watch and Jewellery", "vendorId": "69c31497001777c4c836", "stock": 100, "description": "Hypoallergenic studs." },
  { "$id": "p_wj_5", "name": "Leather Strap Chronograph", "price": 120.00, "category": "Watch and Jewellery", "vendorId": "v_super", "stock": 5, "description": "Premium analog watch." }
];

const isAlreadyExistsError = (error) => {
  const errorMsg = error?.message || error?.toString() || '';
  return errorMsg.includes('already exists') || error?.code === 409;
};

async function seedFinalProducts() {
  try {
    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    const collectionId = 'products';

    for (const item of products) {
      const { $id, ...data } = item;
      
      // Generate Unsplash URL based on product name and category
      const imageUrl = generateUnsplashUrl(item.name, item.category);
      const documentData = { ...data, imageUrl };

      try {
        await databases.createDocument(databaseId, collectionId, item.$id, documentData);
        successCount++;
        console.log(`✓ Created: ${item.name} (${item.$id})`);
      } catch (error) {
        const errorStr = JSON.stringify(error);
        if (errorStr.includes('already exists') || error?.toString().includes('already exists')) {
          // Update existing products with new Unsplash image URLs
          try {
            await databases.updateDocument(databaseId, collectionId, item.$id, { imageUrl });
            updateCount++;
            console.log(`↻ Updated: ${item.name} - Unsplash image`);
          } catch (updateError) {
            errorCount++;
            console.error(`✗ Failed to update ${item.name}:`, updateError?.message);
          }
        } else {
          errorCount++;
          console.error(`✗ Error with ${item.name}:`, error?.message || error);
        }
      }
    }

    console.log(`\n════════════════════════════════════════════`);
    console.log(`✓ Successfully created ${successCount} new products`);
    if (updateCount > 0) {
      console.log(`↻ Updated ${updateCount} products with Unsplash images`);
    }
    if (errorCount > 0) {
      console.log(`✗ Encountered ${errorCount} errors`);
    }
    console.log(`════════════════════════════════════════════`);
    console.log(`\nℹ Image Source: Unsplash (via keyword search)`);
    console.log(`📝 To run this script: node scripts/seed_final_products.js`);
  } catch (error) {
    console.error('Error while seeding products:', error?.message || error);
    process.exit(1);
  }
}

seedFinalProducts();
