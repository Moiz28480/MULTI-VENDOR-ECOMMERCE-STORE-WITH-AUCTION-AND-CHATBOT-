import styled from 'styled-components';

const BannerWrap = styled.section`
  margin-bottom: 18px;
`;

const BannerTitle = styled.h1`
  margin: 0;
  font-size: 40px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #0f172a;
  font-weight: 800;

  @media (max-width: 768px) {
    font-size: 30px;
  }
`;

const Label = styled.span`
  color: #0f172a;
  font-weight: 700;
`;

const CategoryName = styled.span`
  color: #4f46e5;
  font-weight: 900;
`;

const BannerSubtext = styled.p`
  margin: 8px 0 0;
  font-size: 15px;
  line-height: 1.4;
  color: #64748b;
  font-weight: 500;
`;

const HeaderBanner = ({ categoryName }) => {
  const resolvedCategory = String(categoryName || '').trim() || 'All Products';

  return (
    <BannerWrap>
      <BannerTitle>
        <Label>Category: </Label>
        <CategoryName>{resolvedCategory}</CategoryName>
      </BannerTitle>
      <BannerSubtext>Browse incredible products in this collection</BannerSubtext>
    </BannerWrap>
  );
};

export default HeaderBanner;
