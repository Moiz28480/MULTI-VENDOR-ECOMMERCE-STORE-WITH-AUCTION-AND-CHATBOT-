import styled from 'styled-components';
import CategoryCard from './CategoryCard';

const FALLBACK_IMAGE_URL = 'https://via.placeholder.com/400x300?text=No+Image';

const SectionWrapper = styled.section`
  padding: 48px 0;
  max-width: 1400px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 32px 0;
  letter-spacing: -0.5px;
`;

const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const AllCategoriesSection = ({ allCategories }) => {
  const safeCategories = Array.isArray(allCategories)
    ? allCategories.map((category) => ({
        ...category,
        image_url: category?.image_url || FALLBACK_IMAGE_URL
      }))
    : [];

  return (
    <SectionWrapper>
      <SectionTitle>All Categories</SectionTitle>
      <CategoriesGrid>
        {safeCategories.map((category) => (
          <CategoryCard key={category.id} categoryData={category} />
        ))}
      </CategoriesGrid>
    </SectionWrapper>
  );
};

export default AllCategoriesSection;
