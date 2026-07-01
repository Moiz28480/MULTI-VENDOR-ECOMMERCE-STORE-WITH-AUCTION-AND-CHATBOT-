import { MapPinned, CircleCheck, CircleX } from 'lucide-react';
import '../../styling/checkout/SavedAddressPrompt.css';

const SavedAddressPrompt = ({ address = {}, onUseSaved = () => {}, onEnterNew = () => {} }) => {
  const fullName = `${String(address.firstName || '').trim()} ${String(address.lastName || '').trim()}`.trim();
  const cityState = [address.city, address.state, address.zipCode].filter(Boolean).join(', ');

  return (
    <section className="saved-address-prompt-card" aria-label="Use saved address prompt">
      <div className="saved-address-prompt-head">
        <MapPinned size={18} />
        <div>
          <h2>Use Saved Shipping Info?</h2>
          <p>We found a previously saved address for faster checkout.</p>
        </div>
      </div>

      <div className="saved-address-preview">
        <p><strong>{fullName || 'Saved Recipient'}</strong></p>
        <p>{address.streetAddress || '-'}</p>
        {address.apartment ? <p>{address.apartment}</p> : null}
        <p>{cityState || '-'}</p>
        <p>{address.phone || '-'}</p>
      </div>

      <div className="saved-address-actions">
        <button type="button" className="saved-address-btn saved-address-btn--yes" onClick={onUseSaved}>
          <CircleCheck size={14} />
          Yes, use same info
        </button>
        <button type="button" className="saved-address-btn saved-address-btn--no" onClick={onEnterNew}>
          <CircleX size={14} />
          No, enter new info
        </button>
      </div>
    </section>
  );
};

export default SavedAddressPrompt;
