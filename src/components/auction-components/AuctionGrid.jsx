import { useEffect, useMemo, useState } from 'react';
import AuctionCard from './AuctionCard.jsx';
import AuctionStats from './AuctionStats.jsx';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const AuctionGrid = ({ items = [], loading = false, onPlaceBid }) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const visibleItems = useMemo(() => {
    return items.filter((entry) => {
      const auction = entry?.auction || {};
      const status = String(auction?.status || '').trim().toLowerCase();
      const startAtMs = new Date(auction?.last_bid_at).getTime();

      if (status === 'ended') {
        return false;
      }

      if (status === 'upcoming') {
        if (!Number.isFinite(startAtMs) || startAtMs > nowMs) {
          return false;
        }
      }

      const endMs = new Date(auction?.end_time).getTime();

      if (Number.isFinite(endMs) && endMs <= nowMs) {
        return false;
      }

      return true;
    });
  }, [items, nowMs]);

  const totalValue = visibleItems.reduce(
    (sum, entry) => sum + toNumber(entry?.auction?.current_bid, 0),
    0
  );

  const liveCount = visibleItems.length;

  const bidderSet = visibleItems.reduce((acc, entry) => {
    const bidderId = String(entry?.auction?.highest_bidder_id || '').trim();
    if (bidderId) {
      acc.add(bidderId);
    }
    return acc;
  }, new Set());

  const activeBidders = bidderSet.size;
  const avgBidValue = liveCount ? totalValue / liveCount : 0;

  return (
    <section className="auction-grid">
      <AuctionStats
        liveCount={liveCount}
        totalValue={totalValue}
        activeBidders={activeBidders}
        avgBidValue={avgBidValue}
      />

      <div className="auction-grid__summary">
        <div className="auction-grid__summary-title">Live Auctions</div>
        <div className="auction-grid__summary-subtitle">
          Total Value: <strong>${totalValue.toLocaleString()}</strong>
        </div>
      </div>

      {loading ? (
        <div className="auction-grid__empty">Loading auctions...</div>
      ) : visibleItems.length ? (
        <div className="auction-grid__cards">
          {visibleItems.map((item) => (
            <AuctionCard
              key={item.id}
              item={item}
              onPlaceBid={onPlaceBid}
              nowMs={nowMs}
            />
          ))}
        </div>
      ) : (
        <div className="auction-grid__empty">No live auctions available right now.</div>
      )}
    </section>
  );
};

export default AuctionGrid;
