import styled from 'styled-components';

const Panel = styled.aside`
  border: 1px solid #d9dbe5;
  border-radius: 14px;
  background: #ffffff;
  padding: 16px;
  position: sticky;
  top: 96px;
`;

const Title = styled.h2`
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #334155;
  font-size: 14px;
`;

const TotalRow = styled(Row)`
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
`;

const CheckoutButton = styled.button`
  width: 100%;
  margin-top: 16px;
  height: 46px;
  border: none;
  border-radius: 10px;
  background: #4f46e5;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const Hint = styled.p`
  margin: 10px 0 0;
  font-size: 12px;
  color: #059669;
`;

const CartSummaryCard = ({
  subtotal = 0,
  shipping = 0,
  tax = 0,
  total = 0,
  disableCheckout = false,
  onCheckout = () => {}
}) => {
  return (
    <Panel>
      <Title>Order Summary</Title>

      <Row>
        <span>Subtotal</span>
        <span>${Number(subtotal).toFixed(2)}</span>
      </Row>

      <Row>
        <span>Shipping</span>
        <span>{shipping === 0 ? 'FREE' : `$${Number(shipping).toFixed(2)}`}</span>
      </Row>

      <Row>
        <span>Tax (10%)</span>
        <span>${Number(tax).toFixed(2)}</span>
      </Row>

      <TotalRow>
        <span>Total</span>
        <span>${Number(total).toFixed(2)}</span>
      </TotalRow>

      <CheckoutButton type="button" disabled={disableCheckout} onClick={onCheckout}>
        Proceed to Checkout
      </CheckoutButton>

      <Hint>Secure checkout enabled</Hint>
    </Panel>
  );
};

export default CartSummaryCard;
