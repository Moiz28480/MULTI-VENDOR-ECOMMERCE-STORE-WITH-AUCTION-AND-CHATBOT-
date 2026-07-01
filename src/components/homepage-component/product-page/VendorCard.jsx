import { ShieldCheck, Star } from 'lucide-react';
import '../../../styling/product/VendorCard.css';

const VendorCard = ({ vendor = {}, onVisitStore = () => {} }) => {
  const rating = Number(vendor?.rating || 0).toFixed(1);

  return (
    <aside className="vendor-card" aria-label="Vendor profile">
      <h3>Vendor Profile</h3>

      <div className="vendor-card-header">
        <p className="vendor-card-name">{vendor?.name || 'Vendor'}</p>
        <span className="vendor-card-verified">
          <ShieldCheck size={13} />
          Verified Seller
        </span>
      </div>

      <ul className="vendor-card-metrics">
        <li>
          <span>Products</span>
          <strong>{Number(vendor?.productsCount || 0)}</strong>
        </li>
        <li>
          <span>Rating</span>
          <strong>
            <Star size={12} />
            {rating}
          </strong>
        </li>
        <li>
          <span>Response Time</span>
          <strong>{vendor?.responseTime || 'Within 2 hours'}</strong>
        </li>
      </ul>

      <p className="vendor-card-bio">{vendor?.bio || 'Committed to quality products and responsive customer service.'}</p>

      <button type="button" className="vendor-card-button" onClick={onVisitStore}>
        Visit Store
      </button>
    </aside>
  );
};

export default VendorCard;
