export const CATEGORY_ALIASES = {
  Electronics: ['electronics'],
  'Home Decor': ['home decor'],
  Grocery: ['grocery', 'groceries'],
  'Fashion & Apparel': ['fashion', 'fashion and apparel', 'fashion apparel'],
  'Sports & Fitness': ['sports and fitness', 'sports & fitness', 'sports fitness'],
  'Books & Media': ['books and media', 'books & media', 'books media'],
  'Baby & Kids': ['baby and kids', 'baby & kids', 'baby kids'],
  'Beauty & Personal Care': ['beauty and personal care', 'beauty & personal care', 'beauty personal care'],
  Gaming: ['gaming'],
  Automotive: ['automotive'],
  'Pet Supplies': ['pet supplies'],
  'Musical Instruments': ['musical instruments'],
  'Art & Crafts': ['art and craft', 'art and crafts', 'art & crafts', 'art & craft'],
  'Kitchen & Dining': ['kitchen and dinning', 'kitchen and dining', 'kitchen & dining'],
  'Watches & Jewelry': ['watch and jewellery', 'watches and jewelry', 'watches & jewelry', 'watch and jewelry'],
  'Health & Wellness': ['health and wellness', 'health & wellness']
};

export const CATEGORIES_DB_RESPONSE = [
  {
    id: 'cat_001',
    category_name: 'Electronics',
    description: 'Laptops, phones, tablets & accessories',
    item_count: 1250,
    icon_type: 'monitor',
    icon_color: 'blue',
    image_url: 'https://loremflickr.com/1200/800/electronics?lock=1001',
    is_popular: true
  },
  {
    id: 'cat_002',
    category_name: 'Home Decor',
    description: 'Furniture, lighting & home accessories',
    item_count: 890,
    icon_type: 'home',
    icon_color: 'purple',
    image_url: 'https://loremflickr.com/1200/800/living-room,interior-design?lock=1102',
    is_popular: true
  },
  {
    id: 'cat_003',
    category_name: 'Grocery',
    description: 'Fresh produce, pantry & beverages',
    item_count: 2340,
    icon_type: 'shopping-cart',
    icon_color: 'amber',
    image_url: 'https://loremflickr.com/1200/800/grocery-store,fresh-produce?lock=1103',
    is_popular: true
  },
  {
    id: 'cat_004',
    category_name: 'Fashion & Apparel',
    description: 'Clothing, shoes & accessories',
    item_count: 1890,
    icon_type: 'shirt',
    icon_color: 'pink',
    image_url: '/images/categories/fashion-apparel.svg',
    is_popular: true
  },
  {
    id: 'cat_005',
    category_name: 'Sports & Fitness',
    description: 'Equipment, activewear & supplements',
    item_count: 670,
    icon_type: 'dumbbell',
    icon_color: 'orange',
    image_url: 'https://loremflickr.com/1200/800/fitness?lock=1005',
    is_popular: false
  },
  {
    id: 'cat_006',
    category_name: 'Books & Media',
    description: 'Books, magazines & digital media',
    item_count: 1120,
    icon_type: 'book',
    icon_color: 'indigo',
    image_url: 'https://loremflickr.com/1200/800/books?lock=1006',
    is_popular: false
  },
  {
    id: 'cat_007',
    category_name: 'Baby & Kids',
    description: 'Toys, clothing & baby care products',
    item_count: 780,
    icon_type: 'baby',
    icon_color: 'yellow',
    image_url: 'https://loremflickr.com/1200/800/newborn,baby?lock=1207',
    is_popular: false
  },
  {
    id: 'cat_008',
    category_name: 'Beauty & Personal Care',
    description: 'Cosmetics, skincare & grooming',
    item_count: 940,
    icon_type: 'sparkles',
    icon_color: 'rose',
    image_url: 'https://loremflickr.com/1200/800/skincare,cosmetics?lock=1108',
    is_popular: false
  },
  {
    id: 'cat_009',
    category_name: 'Gaming',
    description: 'Consoles, games & gaming accessories',
    item_count: 820,
    icon_type: 'gamepad2',
    icon_color: 'cyan',
    image_url: 'https://loremflickr.com/1200/800/video-game,game-controller?lock=1109',
    is_popular: false
  },
  {
    id: 'cat_010',
    category_name: 'Automotive',
    description: 'Car parts, tools & accessories',
    item_count: 450,
    icon_type: 'car',
    icon_color: 'lime',
    image_url: 'https://loremflickr.com/1200/800/automotive?lock=1010',
    is_popular: false
  },
  {
    id: 'cat_011',
    category_name: 'Pet Supplies',
    description: 'Food, toys & pet care products',
    item_count: 530,
    icon_type: 'paw',
    icon_color: 'orange',
    image_url: 'https://loremflickr.com/1200/800/pets?lock=1011',
    is_popular: false
  },
  {
    id: 'cat_012',
    category_name: 'Musical Instruments',
    description: 'Instruments, audio equipment & accessories',
    item_count: 380,
    icon_type: 'music',
    icon_color: 'violet',
    image_url: 'https://loremflickr.com/1200/800/music?lock=1012',
    is_popular: false
  },
  {
    id: 'cat_013',
    category_name: 'Art & Crafts',
    description: 'Art supplies, crafts & DIY materials',
    item_count: 520,
    icon_type: 'palette',
    icon_color: 'fuchsia',
    image_url: 'https://loremflickr.com/1200/800/art-supplies,craft?lock=1113',
    is_popular: false
  },
  {
    id: 'cat_014',
    category_name: 'Kitchen & Dining',
    description: 'Cookware, appliances & dining essentials',
    item_count: 750,
    icon_type: 'utensils',
    icon_color: 'red',
    image_url: 'https://loremflickr.com/1200/800/kitchen?lock=1014',
    is_popular: false
  },
  {
    id: 'cat_015',
    category_name: 'Watches & Jewelry',
    description: 'Timepieces, jewelry & accessories',
    item_count: 450,
    icon_type: 'watch',
    icon_color: 'cyan',
    image_url: 'https://loremflickr.com/1200/800/watch,jewelry?lock=1115',
    is_popular: false
  },
  {
    id: 'cat_016',
    category_name: 'Health & Wellness',
    description: 'Medical supplies & health products',
    item_count: 560,
    icon_type: 'activity',
    icon_color: 'teal',
    image_url: 'https://loremflickr.com/1200/800/health?lock=1016',
    is_popular: false
  }
];

export const normalizeCategoryValue = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/\s+/g, ' ');

export const matchesCategorySearch = (categoryName, rawQuery) => {
  const query = normalizeCategoryValue(rawQuery);
  if (!query) {
    return true;
  }

  const target = normalizeCategoryValue(categoryName);
  if (!target) {
    return false;
  }

  if (target.startsWith(query)) {
    return true;
  }

  return target.split(' ').some((word) => word.startsWith(query));
};
