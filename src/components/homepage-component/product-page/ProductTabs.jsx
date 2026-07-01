import { useMemo, useState } from 'react';
import '../../../styling/product/ProductTabs.css';

const TAB_OPTIONS = [
  { key: 'description', label: 'Description' },
  { key: 'specifications', label: 'Specifications' },
  { key: 'shipping', label: 'Shipping & Returns' }
];

const ProductTabs = ({
  description = '',
  specifications = [],
  shippingInfo = []
}) => {
  const [activeTab, setActiveTab] = useState('description');

  const normalizedSpecifications = useMemo(() => {
    if (Array.isArray(specifications) && specifications.length) {
      return specifications;
    }

    return [{ label: 'Details', value: 'No specifications available.' }];
  }, [specifications]);

  const normalizedShippingInfo = useMemo(() => {
    if (Array.isArray(shippingInfo) && shippingInfo.length) {
      return shippingInfo;
    }

    return [
      'Standard shipping in 2-3 business days.',
      'Returns accepted within 7 days if unused and sealed.'
    ];
  }, [shippingInfo]);

  return (
    <section className="product-tabs" aria-label="Product details tabs">
      <div className="product-tabs-header" role="tablist">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={activeTab === tab.key ? 'is-active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="product-tabs-content">
        {activeTab === 'description' && (
          <div className="product-tabs-panel">
            <p>{description || 'No description provided for this product.'}</p>
          </div>
        )}

        {activeTab === 'specifications' && (
          <ul className="product-tabs-list product-tabs-list--specs">
            {normalizedSpecifications.map((entry, index) => (
              <li key={`${entry.label || 'spec'}-${index}`}>
                <strong>{entry.label || 'Specification'}</strong>
                <span>{entry.value || '-'}</span>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'shipping' && (
          <ul className="product-tabs-list">
            {normalizedShippingInfo.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ProductTabs;
