import { useMemo, useState } from 'react';
import '../../../styling/product/ImageGallery.css';

const buildFallbackImage = (title = 'Product') => {
  const safeTitle = String(title || 'Product').replace(/&/g, 'and').replace(/</g, '').replace(/>/g, '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#dbeafe'/><stop offset='100%' stop-color='#e2e8f0'/></linearGradient></defs><rect width='1200' height='800' fill='url(#g)'/><circle cx='980' cy='120' r='160' fill='rgba(255,255,255,0.35)'/><circle cx='140' cy='700' r='220' fill='rgba(255,255,255,0.2)'/><text x='70' y='710' fill='#334155' font-size='72' font-family='Segoe UI, Arial, sans-serif' font-weight='700'>${safeTitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const normalizeImageValue = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (trimmed.startsWith('./')) {
    return `/${trimmed.slice(2)}`;
  }

  if (trimmed.startsWith('../')) {
    return `/${trimmed.replace(/^([.]{2}\/)+/, '')}`;
  }

  return `/${trimmed}`;
};

const ImageGallery = ({ images = [], title = 'Product' }) => {
  const fallbackImage = useMemo(() => buildFallbackImage(title), [title]);

  const safeImages = useMemo(() => {
    const unique = [];
    const seen = new Set();

    for (const image of images) {
      const normalized = normalizeImageValue(image);
      if (!normalized || seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      unique.push(normalized);
    }

    if (!unique.length) {
      unique.push(fallbackImage);
    }

    return unique;
  }, [images, fallbackImage]);

  const [activeIndex, setActiveIndex] = useState(0);

  const safeActiveIndex = Math.min(activeIndex, safeImages.length - 1);
  const activeImage = safeImages[safeActiveIndex] || fallbackImage;

  return (
    <section className="product-image-gallery" aria-label="Product image gallery">
      <div className="product-image-gallery-main">
        <img
          src={activeImage}
          alt={title}
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />
      </div>

      {safeImages.length > 1 && (
        <div className="product-image-gallery-thumbs" role="list" aria-label="Product thumbnails">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={`product-image-thumb ${index === safeActiveIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(index)}
            >
              <img
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                onError={(event) => {
                  event.currentTarget.src = fallbackImage;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default ImageGallery;
