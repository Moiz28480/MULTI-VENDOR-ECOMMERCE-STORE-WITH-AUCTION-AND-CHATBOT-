import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import '../../styling/auction-styling/AuctionCard.css';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) => {
  const parsed = toNumber(value, 0);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(parsed);
};

const pad2 = (value) => String(value).padStart(2, '0');

const formatEndsAt = (isoString) => {
  if (!isoString) {
    return '-';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const computeTimeLeftLabel = (endTimeIso, nowMs = Date.now()) => {
  const endMs = new Date(endTimeIso).getTime();
  if (!Number.isFinite(endMs)) {
    return '—';
  }

  const diffMs = endMs - nowMs;
  if (diffMs <= 0) {
    return 'Ended';
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const computeEffectiveStatus = (auction = {}, nowMs = Date.now()) => {
  const rawStatus = String(auction?.status || '').trim().toLowerCase() || 'active';

  if (rawStatus !== 'upcoming') {
    return rawStatus;
  }

  const startAtMs = new Date(auction?.last_bid_at).getTime();
  if (!Number.isFinite(startAtMs)) {
    return 'upcoming';
  }

  return startAtMs <= nowMs ? 'active' : 'upcoming';
};

const AuctionCard = ({ item, onPlaceBid, nowMs = Date.now() }) => {
  const auction = item?.auction || {};
  const product = item?.product || null;

  const title = String(product?.nameResolved || auction?.title || 'Auction Item').trim();
  const description = String(product?.descriptionResolved || '').trim();
  const productId = String(auction?.product_id || '').trim();

  const imageUrl = product?.imageResolved || 'https://via.placeholder.com/1200x900?text=No+Image';

  const status = computeEffectiveStatus(auction, nowMs);
  const timeLeft = useMemo(
    () => computeTimeLeftLabel(auction?.end_time, nowMs),
    [auction?.end_time, nowMs]
  );

  const startingBid = formatCurrency(auction?.starting_bid);
  const currentBid = formatCurrency(auction?.current_bid);
  const bidsCount = toNumber(auction?.bid_count, 0);

  const ended = timeLeft === 'Ended' || status === 'ended';
  const canBid = status === 'active' && !ended;

  return (
    <article className="auction-card">
      <div className="auction-card__media">
        <Link to={productId ? `/product/${encodeURIComponent(productId)}` : '#'} className="auction-card__image-link">
          <img className="auction-card__image" src={imageUrl} alt={title} loading="lazy" />
        </Link>

        <div className="auction-card__badges">
          <span className={`auction-card__badge auction-card__badge--status auction-card__badge--${status}`}>{status}</span>
          <span className="auction-card__badge auction-card__badge--time">{timeLeft}</span>
        </div>
      </div>

      <div className="auction-card__body">
        <Link to={productId ? `/product/${encodeURIComponent(productId)}` : '#'} className="auction-card__title">
          {title}
        </Link>

        {description ? (
          <div className="auction-card__desc">{description}</div>
        ) : (
          <div className="auction-card__desc auction-card__desc--muted">No description available.</div>
        )}

        <div className="auction-card__meta">
          <div className="auction-card__meta-row">
            <div className="auction-card__meta-label">Starting Bid</div>
            <div className="auction-card__meta-value">{startingBid}</div>
          </div>
          <div className="auction-card__meta-row">
            <div className="auction-card__meta-label">Current Bid</div>
            <div className="auction-card__meta-value auction-card__meta-value--highlight">{currentBid}</div>
          </div>
        </div>

        <div className="auction-card__footer">
          <div className="auction-card__footer-left">
            <div className="auction-card__footer-item">{bidsCount} bids</div>
            <div className="auction-card__footer-item">Ends: {formatEndsAt(auction?.end_time)}</div>
          </div>

          <button
            type="button"
            className="auction-card__bid-button"
            onClick={() => onPlaceBid?.(item)}
            disabled={!canBid}
          >
            {canBid ? 'Place Bid' : 'Closed'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default AuctionCard;
