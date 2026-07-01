import { ShieldCheck, Truck } from 'lucide-react';
import '../../styling/checkout/OrderSummary.css';

const normalizeImage = (value) => {
  const image = String(value || '').trim();
  if (!image) {
    return '';
  }

  if (/^(https?:|data:|blob:)/i.test(image)) {
    return image;
  }

  if (image.startsWith('/')) {
    return image;
  }

  return `/${image.replace(/^\.\//, '')}`;
};

const OrderSummary = ({ items = [], subtotal = 0, shipping = 15, tax = 0, total = 0 }) => {
  return (
    <aside className="order-summary-card">
      <h2>Order Summary</h2>

      <div className="order-summary-list">
        {items.map((item) => (
          <article className="order-summary-item" key={item.productId}>
            <img src={normalizeImage(item.imageUrl)} alt={item.name} />
            <div>
              <p className="order-summary-item-name">{item.name}</p>
              <p className="order-summary-item-vendor">{item.vendorName || 'Vendor'}</p>
            </div>
            <strong>${Number(item.lineTotal || 0).toFixed(2)}</strong>
          </article>
        ))}
      </div>

      <div className="order-summary-totals">
        <div><span>Subtotal</span><span>${Number(subtotal).toFixed(2)}</span></div>
        <div><span>Shipping</span><span>${Number(shipping).toFixed(2)}</span></div>
        <div><span>Tax (10%)</span><span>${Number(tax).toFixed(2)}</span></div>
      </div>

      <div className="order-summary-grand">
        <span>Total</span>
        <strong>${Number(total).toFixed(2)}</strong>
      </div>

      <div className="order-summary-features">
        <p><ShieldCheck size={14} /> Secure Checkout <span>SSL encrypted payment</span></p>
        <p><Truck size={14} /> Free Returns <span>30-day return policy</span></p>
      </div>
    </aside>
  );
};

export default OrderSummary;
