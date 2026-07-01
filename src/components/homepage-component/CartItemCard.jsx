import styled from 'styled-components';
import { Minus, Plus, Trash2 } from 'lucide-react';

const Card = styled.article`
  border: 1px solid #d9dbe5;
  background: #ffffff;
  border-radius: 14px;
  padding: 14px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;

  &.out-of-stock {
    border-color: #f2c2c2;
    background: #fffafb;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ProductImage = styled.img`
  width: 92px;
  height: 92px;
  border-radius: 12px;
  object-fit: cover;
  background: #eef2f7;
`;

const InfoSection = styled.div`
  min-width: 0;
`;

const ProductTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
`;

const SecondaryText = styled.p`
  margin: 2px 0 0;
  color: #64748b;
  font-size: 13px;
`;

const DangerText = styled.p`
  margin: 4px 0 0;
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
`;

const QuantityRow = styled.div`
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const QuantityButton = styled.button`
  width: 28px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const QuantityValue = styled.span`
  min-width: 22px;
  text-align: center;
  font-weight: 700;
  color: #0f172a;
`;

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;

  @media (max-width: 760px) {
    align-items: flex-start;
  }
`;

const RemoveButton = styled.button`
  border: none;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  padding: 0;

  svg {
    width: 17px;
    height: 17px;
  }
`;

const TotalPrice = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
`;

const UnitPrice = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 12px;
`;

const CartItemCard = ({ item, onIncrease, onDecrease, onRemove }) => {
  const isOutOfStock = Number(item?.stock || 0) <= 0;
  const reachedStockLimit = Number(item?.quantity || 0) >= Number(item?.stock || 0);
  const imageUrl = item?.imageUrl || 'https://via.placeholder.com/220x220?text=No+Image';

  return (
    <Card className={isOutOfStock ? 'out-of-stock' : ''}>
      <ProductImage src={imageUrl} alt={item?.name || 'Product image'} loading="lazy" />

      <InfoSection>
        <ProductTitle>{item?.name || 'Product'}</ProductTitle>
        <SecondaryText>{item?.category || 'Category'}</SecondaryText>
        {isOutOfStock ? <DangerText>Out of stock</DangerText> : null}

        <QuantityRow>
          <QuantityButton type="button" onClick={() => onDecrease(item)}>
            <Minus />
          </QuantityButton>
          <QuantityValue>{item?.quantity || 1}</QuantityValue>
          <QuantityButton type="button" onClick={() => onIncrease(item)} disabled={isOutOfStock || reachedStockLimit}>
            <Plus />
          </QuantityButton>
        </QuantityRow>
      </InfoSection>

      <PriceBlock>
        <RemoveButton type="button" onClick={() => onRemove(item)} aria-label="Remove from cart">
          <Trash2 />
        </RemoveButton>
        <TotalPrice>${Number(item?.lineTotal || 0).toFixed(2)}</TotalPrice>
        <UnitPrice>${Number(item?.price || 0).toFixed(2)} each</UnitPrice>
      </PriceBlock>
    </Card>
  );
};

export default CartItemCard;
