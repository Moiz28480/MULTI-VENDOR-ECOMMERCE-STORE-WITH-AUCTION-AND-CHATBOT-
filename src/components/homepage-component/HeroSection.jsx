import styled from 'styled-components';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroSearchControls from './HeroSearchControls';

const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/400x300?text=No+Image';

const HeroWrapper = styled.section`
  padding: 40px 0 48px 0;
  max-width: 1400px;
  margin: 0 auto;
`;

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HeroTextSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HeroTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  letter-spacing: -0.5px;
`;

const HeroSubtitle = styled.p`
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
`;

const PopularCategoriesContainer = styled.div`
  margin-top: 32px;
`;

const PopularTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
`;

const PopularGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PopularCard = styled(Link)`
  position: relative;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f5f5f5;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &:hover img {
    transform: scale(1.08);
  }
`;

const PopularCardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.7) 100%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 4px;
  padding: 10px;
`;

const PopularIconBadge = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    color: white;
    width: 12px;
    height: 12px;
  }
`;

const PopularTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PopularCardTitle = styled.p`
  font-size: 19px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1.1;
  max-width: 100%;
  word-wrap: break-word;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const PopularItemCount = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #f3f4f6;
`;

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

const HeroSection = ({ popularCategories, searchValue, onSearchChange, onSearchSubmit }) => {
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

  return (
    <HeroWrapper>
      <HeroContent>
        <HeroTextSection>
          <HeroTitle>Browse Categories</HeroTitle>
          <HeroSubtitle>Explore our wide range of product categories</HeroSubtitle>
        </HeroTextSection>

        <HeroSearchControls
          value={searchValue}
          onChange={onSearchChange}
          onSearch={onSearchSubmit}
        />

        {popularCategories && popularCategories.length > 0 && (
          <PopularCategoriesContainer>
            <PopularTitle>Popular Categories</PopularTitle>
            <PopularGrid>
              {popularCategories.map((category) => {
                const IconComponent = iconMap[category.icon_type] || Icons.Package;
                return (
                  <PopularCard key={category.id} to={`/category/${encodeURIComponent(category.category_name || '')}`}>
                    <img 
                      src={resolveImageSrc(category.image_url)} 
                      alt={category.category_name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_IMAGE_URL;
                      }}
                    />
                    <PopularCardOverlay>
                      <PopularTitleRow>
                        <PopularIconBadge color={category.icon_color}>
                          <IconComponent />
                        </PopularIconBadge>
                        <PopularCardTitle>{category.category_name}</PopularCardTitle>
                      </PopularTitleRow>
                      <PopularItemCount>{category.item_count} items</PopularItemCount>
                    </PopularCardOverlay>
                  </PopularCard>
                );
              })}
            </PopularGrid>
          </PopularCategoriesContainer>
        )}
      </HeroContent>
    </HeroWrapper>
  );
};

export default HeroSection;
