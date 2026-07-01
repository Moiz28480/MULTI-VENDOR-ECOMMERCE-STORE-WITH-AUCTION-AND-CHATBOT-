import { Link, useLocation, useNavigate } from 'react-router-dom';
import HeaderComponent from '../components/homepage-component/HeaderComponent.jsx';
import { useAuth } from '../lib/auth-context.js';
import { getCartCount } from '../lib/cart.js';
import { logout } from '../lib/appwrite.js';
import '../styling/checkout/CheckoutReviewPage.css';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const CheckoutReviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, setUser, setRole } = useAuth();

  const details = location.state || null;
  const profilePath = role === 'Vendor' ? '/vendor-profile' : '/profile';
  const userId = user?.$id || '';

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setRole(null);
    navigate('/login');
  };

  if (!details?.orderId) {
    return (
      <div className="checkout-review-page">
        <HeaderComponent
          userEmail={user?.email || user?.name || 'Account'}
          profilePath={profilePath}
          cartPath="/cart"
          cartCount={getCartCount(userId)}
          onLogout={handleLogout}
        />
        <main className="checkout-review-main">
          <section className="checkout-review-card">
            <h1>Order Review</h1>
            <p className="checkout-review-empty">No recent checkout details found.</p>
            <Link to="/store-home" className="checkout-review-home-btn">Go to Home Page</Link>
          </section>
        </main>
      </div>
    );
  }

  const items = Array.isArray(details.items) ? details.items : [];
  const address = details.shippingAddress || {};

  return (
    <div className="checkout-review-page">
      <HeaderComponent
        userEmail={user?.email || user?.name || 'Account'}
        profilePath={profilePath}
        cartPath="/cart"
        cartCount={getCartCount(userId)}
        onLogout={handleLogout}
      />

      <main className="checkout-review-main">
        <section className="checkout-review-hero">
          <h1>Order Completed</h1>
          <p>Your order has been placed successfully.</p>
          <span>Order ID: {details.orderId}</span>
        </section>

        <section className="checkout-review-grid">
          <article className="checkout-review-card">
            <h2>Order Details</h2>
            <ul className="checkout-review-items">
              {items.map((item, index) => (
                <li key={`${item.productId || item.name}-${index}`}>
                  <div>
                    <strong>{item.name || 'Product'}</strong>
                    <p>{item.vendorName || 'Vendor'} • Qty: {item.quantity || 1}</p>
                  </div>
                  <span>{currency.format(Number(item.lineTotal || 0))}</span>
                </li>
              ))}
            </ul>

            <div className="checkout-review-totals">
              <p><span>Subtotal</span><strong>{currency.format(Number(details.subtotal || 0))}</strong></p>
              <p><span>Shipping</span><strong>{currency.format(Number(details.shipping || 0))}</strong></p>
              <p><span>Tax</span><strong>{currency.format(Number(details.tax || 0))}</strong></p>
              <p className="is-total"><span>Total</span><strong>{currency.format(Number(details.total || 0))}</strong></p>
            </div>
          </article>

          <article className="checkout-review-card">
            <h2>Delivery Information</h2>
            <div className="checkout-review-address">
              <p><strong>{`${address.firstName || ''} ${address.lastName || ''}`.trim() || 'Customer'}</strong></p>
              <p>{address.streetAddress || '-'}</p>
              {address.apartment ? <p>{address.apartment}</p> : null}
              <p>{[address.city, address.state, address.zipCode].filter(Boolean).join(', ') || '-'}</p>
              <p>{address.phone || '-'}</p>
              <p>{address.email || '-'}</p>
            </div>

            <p className="checkout-review-payment">Payment Method: {details.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit / Debit Card'}</p>

            <Link to="/store-home" className="checkout-review-home-btn">Back to Home Page</Link>
          </article>
        </section>
      </main>
    </div>
  );
};

export default CheckoutReviewPage;