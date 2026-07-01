import styled from 'styled-components';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/400x300?text=No+Image';

const CATEGORY_IMAGE_KEYS = {
  Electronics: 'electronics',
  'Home Decor': 'home-decor',
  Grocery: 'grocery',
  'Fashion & Apparel': 'fashion-apparel',
  'Sports & Fitness': 'sports-fitness',
  'Books & Media': 'books-media',
  'Baby & Kids': 'baby-kids',
  'Beauty & Personal Care': 'beauty-personal-care',
  Gaming: 'gaming',
  Automotive: 'automotive',
  'Pet Supplies': 'pet-supplies',
  'Musical Instruments': 'musical-instruments',
  'Art & Crafts': 'art-crafts',
  'Kitchen & Dining': 'kitchen-dining',
  'Watches & Jewelry': 'watches-jewelry',
  'Health & Wellness': 'health-wellness'
};

const CATEGORY_FLICKR_TAGS = {
  Electronics: ['electronics', 'technology', 'gadgets'],
  'Home Decor': ['living-room', 'interior-design', 'home-decor'],
  Grocery: ['grocery-store', 'fresh-produce', 'supermarket'],
  'Fashion & Apparel': ['fashion', 'clothing', 'style'],
  'Sports & Fitness': ['fitness', 'sports', 'gym'],
  'Books & Media': ['books', 'library', 'reading'],
  'Baby & Kids': ['newborn', 'baby', 'infant'],
  'Beauty & Personal Care': ['skincare', 'cosmetics', 'beauty-products'],
  Gaming: ['video-game', 'game-controller', 'gaming-setup'],
  Automotive: ['car', 'automotive', 'vehicle'],
  'Pet Supplies': ['pets', 'dog', 'cat'],
  'Musical Instruments': ['music', 'guitar', 'instrument'],
  'Art & Crafts': ['art-supplies', 'craft', 'diy-art'],
  'Kitchen & Dining': ['kitchen', 'cooking', 'dining'],
  'Watches & Jewelry': ['watch', 'jewelry', 'luxury-watch'],
  'Health & Wellness': ['health', 'wellness', 'medical']
};

const CardContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  background: #f5f5f5;

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    transition: transform 0.4s ease-in-out;
  }
`;

const ImageLink = styled(Link)`
  display: block;
  text-decoration: none;
`;

const IconBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background-color: ${props => {
    const colors = {
      blue: '#3b82f6',
      purple: '#a855f7',
      pink: '#ec4899',
      orange: '#f97316',
      amber: '#fbbf24',
      red: '#ef4444',
      cyan: '#06b6d4',
      lime: '#84cc16',
      violet: '#7c3aed',
      teal: '#14b8a6',
      indigo: '#4f46e5',
      yellow: '#eab308',
      rose: '#f43f5e',
      fuchsia: '#d946ef',
      green: '#22c55e'
    };
    return colors[props.color] || '#3b82f6';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  svg {
    color: white;
    width: 24px;
    height: 24px;
  }
`;

const ContentContainer = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const CategoryName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 6px 0;
  line-height: 1.3;
`;

const Description = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemCount = styled.p`
  font-size: 12px;
  color: #9ca3af;
  margin: 0 0 12px 0;
  font-weight: 500;
`;

const BrowseLink = styled(Link)`
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: #2563eb;
  }

  &::after {
    content: '→';
    transition: transform 0.2s ease;
  }

  &:hover::after {
    transform: translateX(4px);
  }
`;

// Icon mapping
const iconMap = {
  monitor: Icons.Monitor,
  home: Icons.Home,
  'shopping-cart': Icons.ShoppingCart,
  shirt: Icons.Shirt,
  dumbbell: Icons.Dumbbell,
  book: Icons.Book,
  baby: Icons.Baby,
  sparkles: Icons.Sparkles,
  gamepad2: Icons.Gamepad2,
  car: Icons.Car,
  paw: Icons.Heart,
  music: Icons.Music,
  palette: Icons.Palette,
  utensils: Icons.Utensils,
  watch: Icons.Watch,
  activity: Icons.Activity
};

const CategoryCard = ({ categoryData }) => {
  const IconComponent = iconMap[categoryData.icon_type] || Icons.Package;

  const resolveImageSrc = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return FALLBACK_IMAGE_URL;
    }

    const trimmed = imageUrl.trim();
    if (!trimmed) {
      return FALLBACK_IMAGE_URL;
    }

    if (/^(https?:|data:|blob:)/i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('/')) {
      return trimmed;
    }

    if (trimmed.startsWith('./')) {
      return `/${trimmed.slice(2)}`;
    }

    if (trimmed.startsWith('../')) {
      return `/${trimmed.replace(/^(\.\.\/)+/, '')}`;
    }

    return `/${trimmed}`;
  };

  const imageCandidates = useMemo(() => {
    const categoryName = String(categoryData?.category_name || '').trim();
    const categoryKey = CATEGORY_IMAGE_KEYS[categoryName] || '';
    const localFallback = categoryKey ? `/images/categories/${categoryKey}.svg` : '';

    const flickrTags = CATEGORY_FLICKR_TAGS[categoryName] || [];
    const flickrUrls = flickrTags.map((tag, index) => `https://loremflickr.com/1200/800/${tag}?lock=${6000 + index}`);

    const base = [];

    const primary = resolveImageSrc(categoryData?.image_url);
    if (primary) {
      base.push(primary);
    }

    flickrUrls.forEach((url) => {
      if (!base.includes(url)) {
        base.push(url);
      }
    });

    if (localFallback && !base.includes(localFallback)) {
      base.push(localFallback);
    }

    if (!base.includes(FALLBACK_IMAGE_URL)) {
      base.push(FALLBACK_IMAGE_URL);
    }

    return base;
  }, [categoryData]);

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [imageCandidates]);

  const imageSrc = imageCandidates[Math.min(imageIndex, imageCandidates.length - 1)] || FALLBACK_IMAGE_URL;
  const categoryRoute = `/category/${encodeURIComponent(categoryData?.category_name || '')}`;

  return (
    <CardContainer>
      <ImageLink to={categoryRoute} aria-label={`Open ${categoryData.category_name || 'category'} products`}>
        <ImageContainer>
          <img
            src={imageSrc}
            alt={categoryData.category_name || 'Category image'}
            onError={() => {
              setImageIndex((current) => {
                if (current >= imageCandidates.length - 1) {
                  return current;
                }

                return current + 1;
              });
            }}
          />
          <IconBadge color={categoryData.icon_color}>
            <IconComponent />
          </IconBadge>
        </ImageContainer>
      </ImageLink>
      <ContentContainer>
        <CategoryName>{categoryData.category_name}</CategoryName>
        <Description>{categoryData.description}</Description>
        <ItemCount>{categoryData.item_count.toLocaleString()} items</ItemCount>
        <BrowseLink to={categoryRoute}>
          Browse
        </BrowseLink>
      </ContentContainer>
    </CardContainer>
  );
};

export default CategoryCard;
