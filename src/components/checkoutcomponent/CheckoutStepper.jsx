import { MapPin, CreditCard, CircleCheck } from 'lucide-react';
import '../../styling/checkout/CheckoutStepper.css';

const steps = [
  { key: 'shipping', label: 'Shipping', icon: MapPin },
  { key: 'payment', label: 'Payment', icon: CreditCard },
  { key: 'review', label: 'Review', icon: CircleCheck }
];

const CheckoutStepper = ({ activeStep = 'shipping' }) => {
  return (
    <section className="checkout-stepper" aria-label="Checkout progress">
      {steps.map((step) => {
        const Icon = step.icon;
        const isActive = step.key === activeStep;

        return (
          <div className={`checkout-step ${isActive ? 'is-active' : ''}`} key={step.key}>
            <div className="checkout-step-icon">
              <Icon size={16} />
            </div>
            <span>{step.label}</span>
          </div>
        );
      })}
    </section>
  );
};

export default CheckoutStepper;
