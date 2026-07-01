import { useMemo } from 'react';
import '../../styling/auction-styling/AuctionStats.css';

const formatCurrency = (value) => {
  const parsed = Number(value);
  const safe = Number.isFinite(parsed) ? parsed : 0;

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(safe);
};

const AuctionStats = ({ liveCount = 0, totalValue = 0, activeBidders = 0, avgBidValue = 0 }) => {
  const totalValueLabel = useMemo(() => formatCurrency(totalValue), [totalValue]);
  const avgBidValueLabel = useMemo(() => formatCurrency(avgBidValue), [avgBidValue]);

  return (
    <div className="auction-stats">
      <div className="auction-stats__card">
        <div className="auction-stats__icon auction-stats__icon--blue">⟐</div>
        <div>
          <div className="auction-stats__value">{Number(liveCount).toLocaleString()}</div>
          <div className="auction-stats__label">Live Auctions</div>
        </div>
      </div>

      <div className="auction-stats__card">
        <div className="auction-stats__icon auction-stats__icon--green">↗</div>
        <div>
          <div className="auction-stats__value">{totalValueLabel}</div>
          <div className="auction-stats__label">Total Value</div>
        </div>
      </div>

      <div className="auction-stats__card">
        <div className="auction-stats__icon auction-stats__icon--purple">👥</div>
        <div>
          <div className="auction-stats__value">{Number(activeBidders).toLocaleString()}</div>
          <div className="auction-stats__label">Active Bidders</div>
        </div>
      </div>

      <div className="auction-stats__card">
        <div className="auction-stats__icon auction-stats__icon--orange">∑</div>
        <div>
          <div className="auction-stats__value">{avgBidValueLabel}</div>
          <div className="auction-stats__label">Avg Bid Value</div>
        </div>
      </div>
    </div>
  );
};

export default AuctionStats;
