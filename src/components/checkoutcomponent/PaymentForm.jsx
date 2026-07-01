import { CreditCard, Truck, User, CalendarDays, Lock, ArrowLeft } from 'lucide-react';
import '../../styling/checkout/PaymentForm.css';

const PaymentForm = ({
  values,
  onChange,
  onMethodChange,
  onToggleBillingSameAsShipping,
  onBack,
  onSubmit,
  submitting = false
}) => {
  const isCard = values.method === 'card';
  const isCod = values.method === 'cod';

  return (
    <section className="payment-form-card">
      <div className="payment-form-head">
        <h2>Payment Method</h2>
        <p>Choose how you would like to pay</p>
      </div>

      <div className="payment-method-list" role="radiogroup" aria-label="Payment methods">
        <button
          type="button"
          className={`payment-method-item ${isCard ? 'is-active' : ''}`}
          onClick={() => onMethodChange('card')}
        >
          <span className="payment-method-dot" />
          <CreditCard size={14} />
          <div>
            <strong>Credit / Debit Card</strong>
            <p>Visa, Mastercard</p>
          </div>
        </button>

        <button
          type="button"
          className={`payment-method-item ${isCod ? 'is-active' : ''}`}
          onClick={() => onMethodChange('cod')}
        >
          <span className="payment-method-dot" />
          <Truck size={14} />
          <div>
            <strong>Cash on Delivery</strong>
            <p>Pay when your order is delivered</p>
          </div>
        </button>
      </div>

      <form className="payment-form-grid" onSubmit={onSubmit}>
        {isCard ? (
          <>
            <label className="payment-field payment-field--full">
              <span>Card Number *</span>
              <div className="payment-input-wrap">
                <CreditCard size={14} />
                <input
                  name="cardNumber"
                  value={values.cardNumber}
                  onChange={onChange}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>
            </label>

            <label className="payment-field payment-field--full">
              <span>Cardholder Name *</span>
              <div className="payment-input-wrap">
                <User size={14} />
                <input
                  name="cardholderName"
                  value={values.cardholderName}
                  onChange={onChange}
                  placeholder="John Doe"
                  required
                />
              </div>
            </label>

            <label className="payment-field">
              <span>Expiry Date *</span>
              <div className="payment-input-wrap">
                <CalendarDays size={14} />
                <input
                  name="expiryDate"
                  value={values.expiryDate}
                  onChange={onChange}
                  placeholder="MM/YY"
                  required
                />
              </div>
            </label>

            <label className="payment-field">
              <span>CVV *</span>
              <div className="payment-input-wrap">
                <Lock size={14} />
                <input
                  name="cvv"
                  value={values.cvv}
                  onChange={onChange}
                  placeholder="123"
                  required
                />
              </div>
            </label>

            <label className="payment-check payment-field--full">
              <input
                type="checkbox"
                checked={values.billingSameAsShipping}
                onChange={onToggleBillingSameAsShipping}
              />
              <span>Same as shipping address</span>
            </label>
          </>
        ) : (
          <p className="payment-cod-note payment-field--full">
            Cash on Delivery selected. You can place the order directly.
          </p>
        )}

        <div className="payment-actions payment-field--full">
          <button type="button" className="payment-back" onClick={onBack}>
            <ArrowLeft size={14} />
            Back to Shipping
          </button>

          <button type="submit" className="payment-submit" disabled={submitting}>
            {submitting ? 'Placing Order...' : isCod ? 'Checkout' : 'Checkout'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default PaymentForm;
