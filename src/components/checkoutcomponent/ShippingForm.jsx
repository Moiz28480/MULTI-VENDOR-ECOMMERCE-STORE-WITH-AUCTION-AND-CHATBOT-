import {
  User,
  Mail,
  Phone,
  House,
  Building2,
  Building,
  Map,
  Hash
} from 'lucide-react';
import '../../styling/checkout/ShippingForm.css';

const ShippingForm = ({
  values,
  onChange,
  onSubmit,
  submitting = false,
  saveForNextOrder = false,
  onToggleSave = () => {}
}) => {
  return (
    <section className="shipping-form-card">
      <div className="shipping-form-head">
        <h2>Shipping Information</h2>
        <p>Where should we deliver your order?</p>
      </div>

      <form onSubmit={onSubmit} className="shipping-form-grid">
        <label className="shipping-field">
          <span>First Name *</span>
          <div className="shipping-input-wrap">
            <User size={14} />
            <input name="firstName" value={values.firstName} onChange={onChange} required />
          </div>
        </label>

        <label className="shipping-field">
          <span>Last Name *</span>
          <div className="shipping-input-wrap">
            <User size={14} />
            <input name="lastName" value={values.lastName} onChange={onChange} required />
          </div>
        </label>

        <label className="shipping-field">
          <span>Email Address *</span>
          <div className="shipping-input-wrap">
            <Mail size={14} />
            <input type="email" name="email" value={values.email} onChange={onChange} required />
          </div>
        </label>

        <label className="shipping-field">
          <span>Phone Number *</span>
          <div className="shipping-input-wrap">
            <Phone size={14} />
            <input name="phone" value={values.phone} onChange={onChange} required />
          </div>
        </label>

        <label className="shipping-field shipping-field--full">
          <span>Street Address *</span>
          <div className="shipping-input-wrap">
            <House size={14} />
            <input name="streetAddress" value={values.streetAddress} onChange={onChange} required />
          </div>
        </label>

        <label className="shipping-field shipping-field--full">
          <span>Apartment, Suite, etc. (Optional)</span>
          <div className="shipping-input-wrap">
            <Building2 size={14} />
            <input name="apartment" value={values.apartment} onChange={onChange} />
          </div>
        </label>

        <label className="shipping-field">
          <span>City *</span>
          <div className="shipping-input-wrap">
            <Building size={14} />
            <input name="city" value={values.city} onChange={onChange} required />
          </div>
        </label>

        <label className="shipping-field">
          <span>State *</span>
          <div className="shipping-input-wrap">
            <Map size={14} />
            <input name="state" value={values.state} onChange={onChange} required />
          </div>
        </label>

        <label className="shipping-field">
          <span>ZIP *</span>
          <div className="shipping-input-wrap">
            <Hash size={14} />
            <input name="zipCode" value={values.zipCode} onChange={onChange} required />
          </div>
        </label>

        <label className="shipping-check">
          <input type="checkbox" checked={saveForNextOrder} onChange={onToggleSave} />
          <span>Save this information for faster checkout next time</span>
        </label>

        <button className="shipping-submit" type="submit" disabled={submitting}>
          {submitting ? 'Saving Shipping Info...' : 'Continue to Payment'}
        </button>
      </form>
    </section>
  );
};

export default ShippingForm;
