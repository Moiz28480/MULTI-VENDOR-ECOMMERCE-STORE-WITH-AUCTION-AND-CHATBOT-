import { Star } from 'lucide-react';
import '../../../styling/product/ReviewSection.css';

const renderStars = (value = 0) => {
  const rating = Math.max(0, Math.min(5, Math.round(Number(value || 0))));
  return Array.from({ length: 5 }, (_, index) => index < rating);
};

const formatReviewDate = (rawDate) => {
  const date = new Date(rawDate || Date.now());
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ReviewSection = ({ reviews = [], averageRating = 0 }) => {
  return (
    <section className="review-section" aria-label="Customer reviews">
      <header className="review-section-header">
        <h3>Customer Reviews</h3>
        <div className="review-section-summary">
          <Star size={15} />
          <strong>{Number(averageRating || 0).toFixed(1)}</strong>
          <span>({reviews.length})</span>
        </div>
      </header>

      {reviews.length ? (
        <div className="review-list">
          {reviews.map((review) => {
            const stars = renderStars(review?.rating);
            const initials = String(review?.reviewerName || 'U')
              .split(' ')
              .map((part) => part.charAt(0))
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <article className="review-item" key={review.$id || `${review?.reviewerName}-${review?.$createdAt}`}>
                <div className="review-avatar">{initials || 'U'}</div>
                <div className="review-body">
                  <div className="review-row">
                    <p className="review-name">{review?.reviewerName || 'Anonymous User'}</p>
                    <span className="review-date">{formatReviewDate(review?.$createdAt)}</span>
                  </div>
                  <div className="review-stars">
                    {stars.map((filled, index) => (
                      <Star key={index} size={13} className={filled ? 'is-filled' : ''} />
                    ))}
                  </div>
                  <p className="review-text">{review?.comment || 'No written feedback.'}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="review-empty">No reviews yet. Be the first to review this product.</p>
      )}
    </section>
  );
};

export default ReviewSection;
