import styled from 'styled-components';
import { Star, Eye, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const buildInlineFallbackImage = (title = 'No Image') => {
  const safeTitle = String(title || 'No Image').replace(/&/g, 'and').replace(/</g, '').replace(/>/g, '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 700'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#e2e8f0'/><stop offset='100%' stop-color='#cbd5e1'/></linearGradient></defs><rect width='900' height='700' fill='url(#g)'/><circle cx='730' cy='90' r='120' fill='rgba(255,255,255,0.25)'/><circle cx='120' cy='620' r='170' fill='rgba(255,255,255,0.15)'/><text x='46' y='622' fill='#334155' font-size='54' font-family='Segoe UI, Arial, sans-serif' font-weight='700'>${safeTitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const CardShell = styled.article`
  background: #ffffff;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02);
`;

const ImageWrap = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  background: #f1f5f9;
  overflow: hidden;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
`;

const RatingBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.16);

  svg {
    width: 13px;
    height: 13px;
    color: #facc15;
    fill: #facc15;
  }
`;

const OutOfStockBadge = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  background: #ef233c;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(239, 35, 60, 0.36);
`;

const InfoSection = styled.div`
  padding: 10px 10px 12px;
`;

const CategoryLabel = styled.p`
  margin: 0;
  color: #6366f1;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
`;

const ProductTitle = styled.h3`
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 29px;
  font-weight: 700;
  line-height: 1.18;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 19px;
  }
`;

const ReviewsText = styled.p`
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
`;

const PriceRow = styled.div`
  margin-top: 8px;
`;

const PriceValue = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 38px;
  font-weight: 800;
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ButtonRow = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

const ActionButton = styled.button`
  height: 34px;
  border: none;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(0.98);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ViewButton = styled(ActionButton)`
  background: #4f46e5;
  color: #ffffff;
`;

const BuyButton = styled(ActionButton)`
  background: #0f172a;
  color: #ffffff;

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    opacity: 0.8;
    transform: none;
    filter: none;
  }
`;

const normalizeCategoryName = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .split(/[\s_]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const ProductCard = ({ product, onBuy = () => {}, buyBusy = false }) => {
  const navigate = useNavigate();
  const fallbackImage = buildInlineFallbackImage(product?.name || 'No Image');

  const resolveImageSrc = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return fallbackImage;
    }

    const trimmed = imageUrl.trim();
    if (!trimmed) {
      return fallbackImage;
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

  const averageRating = Number(product?.average_rating || 0);
  const totalReviews = Number(product?.total_reviews || 0);
  const isOutOfStock = Number(product?.stock || 0) === 0;

  const safePrice = Number(product?.price || 0);
  const categoryLabel = normalizeCategoryName(product?.category);
  const imageSrc = resolveImageSrc(product?.image_url || product?.imageUrl || product?.image);
  const resolvedProductId = String(product?.id || product?.$id || '').trim();

  return (
    <CardShell>
      <ImageWrap>
        <ProductImage
          src={imageSrc}
          alt={product?.name || 'Product image'}
          loading="lazy"
          onError={(event) => {
            if (event.currentTarget.dataset.fallbackApplied === '1') {
              return;
            }

            event.currentTarget.dataset.fallbackApplied = '1';
            event.currentTarget.src = fallbackImage;
          }}
        />

        <RatingBadge>
          <Star />
          {averageRating.toFixed(1)}
        </RatingBadge>

        {isOutOfStock && <OutOfStockBadge>Out of Stock</OutOfStockBadge>}
      </ImageWrap>

      <InfoSection>
        <CategoryLabel>{categoryLabel || 'Category'}</CategoryLabel>
        <ProductTitle title={product?.name}>{product?.name || 'Untitled Product'}</ProductTitle>
        <ReviewsText>{totalReviews.toLocaleString()} reviews</ReviewsText>

        <PriceRow>
          <PriceValue>${safePrice.toFixed(2)}</PriceValue>
        </PriceRow>

        <ButtonRow>
          <ViewButton
            type="button"
            onClick={() => {
              if (!resolvedProductId) {
                return;
              }

              navigate(`/product/${encodeURIComponent(resolvedProductId)}`);
            }}
          >
            <Eye />
            View
          </ViewButton>

          <BuyButton type="button" disabled={isOutOfStock || buyBusy} onClick={() => onBuy(product)}>
            <ShoppingCart />
            {buyBusy ? 'Adding...' : 'Buy'}
          </BuyButton>
        </ButtonRow>
      </InfoSection>
    </CardShell>
  );
};

export default ProductCard;
