import { ShieldCheck, Star, Truck, PackageCheck, BadgeCheck, Minus, Plus } from 'lucide-react';
import '../../../styling/product/ProductInfo.css';

const ProductInfo = ({
  product,
  averageRating = 0,
  reviewCount = 0,
  quantity = 1,
  onIncrement = () => {},
  onDecrement = () => {},
  onAddToCart = () => {},
  addToCartBusy = false,
  addToCartMessage = ''
}) => {
  const safePrice = Number(product?.price || 0).toFixed(2);
  const trustedVendor = Number(product?.vendorRating || 0) >= 4.5 || product?.trustedVendor === true;

  return (
    <section className="product-info-card" aria-label="Product information">
      <h1 className="product-info-title">{product?.name || 'Untitled Product'}</h1>
      <p className="product-info-price">${safePrice}</p>

      <div className="product-info-badges">
        {trustedVendor && (
          <span className="product-info-badge product-info-badge--trusted">
            <ShieldCheck size={14} />
            Trusted Vendor
          </span>
        )}
        <span className="product-info-badge">{product?.category || 'Category'}</span>
      </div>

      <div className="product-info-reviews">
        <Star size={15} />
        <strong>{Number(averageRating || 0).toFixed(1)}</strong>
        <span>{reviewCount} reviews</span>
      </div>

      <ul className="product-info-features">
        <li>
          <Truck size={15} />
          <div>
            <strong>Fast Delivery</strong>
            <p>{product?.shippingEstimate || 'Delivered in 2-3 business days'}</p>
          </div>
        </li>
        <li>
          <PackageCheck size={15} />
          <div>
            <strong>Secure Packaging</strong>
            <p>{product?.packagingNote || 'Carefully packed for safe delivery'}</p>
          </div>
        </li>
        <li>
          <BadgeCheck size={15} />
          <div>
            <strong>Warranty Support</strong>
            <p>{product?.warranty || '1-year service support included'}</p>
          </div>
        </li>
      </ul>

      <div className="product-info-actions">
        <div className="product-info-qty" role="group" aria-label="Select quantity">
          <button type="button" onClick={onDecrement} aria-label="Decrease quantity">
            <Minus size={14} />
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={onIncrement} aria-label="Increase quantity">
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          className="product-info-add-cart"
          onClick={onAddToCart}
          disabled={addToCartBusy || Number(product?.stock || 0) <= 0}
        >
          {addToCartBusy ? 'Adding...' : Number(product?.stock || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>

      {addToCartMessage ? <p className="product-info-message">{addToCartMessage}</p> : null}
      <p className="product-info-description-short">{product?.description || 'No description provided yet.'}</p>
    </section>
  );
};

export default ProductInfo;
