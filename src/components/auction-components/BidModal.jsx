import { useEffect, useMemo, useRef, useState } from 'react';
import { Functions } from 'appwrite';
import { useAuth } from '../../lib/auth-context.js';
import client from '../../lib/appwrite.js';
import '../../styling/auction-styling/BidModal.css';

const PLACE_BID_FUNCTION_STORAGE_KEY = 'placeBidFunctionId';

const resolvePlaceBidFunctionId = () => {
  const candidates = [
    import.meta.env.VITE_PLACE_BID_FUNCTION_ID,
    import.meta.env.VITE_APPWRITE_PLACE_BID_FUNCTION_ID,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return candidates[0] || '';
};

const ENV_PLACE_BID_FUNCTION_ID = resolvePlaceBidFunctionId();

const readStoredFunctionId = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return String(window.localStorage.getItem(PLACE_BID_FUNCTION_STORAGE_KEY) || '').trim();
};

const saveStoredFunctionId = (value) => {
  if (typeof window === 'undefined') {
    return;
  }

  const nextValue = String(value || '').trim();

  if (!nextValue) {
    window.localStorage.removeItem(PLACE_BID_FUNCTION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(PLACE_BID_FUNCTION_STORAGE_KEY, nextValue);
};

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

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const toHex = (n) => n.toString(16).padStart(2, '0');
  const hex = Array.from(bytes, toHex).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const extractExecutionError = (execution) => {
  const statusCode = toNumber(execution?.responseStatusCode, 0);
  const body = String(execution?.responseBody || '').trim();

  if (body) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && parsed.ok === false) {
        return parsed?.message || 'Bid request failed.';
      }
    } catch {
      // Ignore parse errors and continue with status-based checks.
    }
  }

  if (statusCode && statusCode >= 400) {
    try {
      const parsed = JSON.parse(body);
      return parsed?.message || `Bid function failed (${statusCode}).`;
    } catch {
      return body || `Bid function failed (${statusCode}).`;
    }
  }

  return '';
};

const BidModal = ({ open, item, onClose, onSuccess }) => {
  const { user } = useAuth();
  const auction = item?.auction || null;
  const product = item?.product || null;

  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [functionIdInput, setFunctionIdInput] = useState(() => ENV_PLACE_BID_FUNCTION_ID || readStoredFunctionId());

  const idempotencyKeyRef = useRef('');

  const resolvedFunctionId = useMemo(() => {
    if (ENV_PLACE_BID_FUNCTION_ID) {
      return ENV_PLACE_BID_FUNCTION_ID;
    }

    return readStoredFunctionId();
  }, [functionIdInput]);

  useEffect(() => {
    if (open) {
      idempotencyKeyRef.current = generateUuid();
      setError('');
      setBusy(false);
      setFunctionIdInput(ENV_PLACE_BID_FUNCTION_ID || readStoredFunctionId());
      const baseline = toNumber(auction?.current_bid, toNumber(auction?.starting_bid, 0));
      setAmount(String(Math.max(1, Math.ceil(baseline + 1))));
    }
  }, [open, auction?.$id]);

  const title = useMemo(() => {
    const fallback = String(auction?.title || 'Auction Item').trim();
    return String(product?.nameResolved || fallback).trim();
  }, [product?.nameResolved, auction?.title]);

  const currentBidLabel = useMemo(() => formatCurrency(auction?.current_bid), [auction?.current_bid]);
  const minimumBid = useMemo(() => {
    const baseline = toNumber(auction?.current_bid, toNumber(auction?.starting_bid, 0));
    return Math.max(1, Math.ceil(baseline + 1));
  }, [auction?.current_bid, auction?.starting_bid]);

  if (!open || !auction) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userId = user?.$id || String(localStorage.getItem('userId') || '').trim();
    if (!userId) {
      setError('You must be logged in to bid.');
      return;
    }

    const numericAmount = toNumber(amount, 0);
    if (!numericAmount || numericAmount < minimumBid) {
      setError(`Bid must be at least ${formatCurrency(minimumBid)}.`);
      return;
    }

    if (!resolvedFunctionId) {
      setError('Missing Appwrite Function ID. Add VITE_PLACE_BID_FUNCTION_ID in .env.local or paste it below and save.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const functions = new Functions(client);
      const payload = {
        auction_id: String(auction.$id || '').trim(),
        product_id: String(auction.product_id || '').trim(),
        bidder_id: userId,
        amount: numericAmount,
        idempotency_key: idempotencyKeyRef.current,
      };

      const execution = await functions.createExecution(
        resolvedFunctionId,
        JSON.stringify(payload),
        false,
      );

      const maybeError = extractExecutionError(execution);
      if (maybeError) {
        throw new Error(maybeError);
      }

      onSuccess?.(execution);
    } catch (submitError) {
      console.error('Failed to place bid:', submitError);

      const rawMessage = String(submitError?.message || '').trim();
      const notFound = rawMessage.toLowerCase().includes('could not be found');
      const hint = notFound
        ? ` Appwrite couldn't find Function ID "${resolvedFunctionId}". Use the exact Function ID from Appwrite console (not the function name).`
        : '';

      setError((rawMessage || 'Failed to place bid. Please try again.') + hint);
      setBusy(false);
    }
  };

  return (
    <div className="bid-modal" role="dialog" aria-modal="true" onMouseDown={handleBackdropClick}>
      <div className="bid-modal__panel" role="document">
        <div className="bid-modal__header">
          <div>
            <div className="bid-modal__title">Place Bid</div>
            <div className="bid-modal__subtitle">{title}</div>
          </div>
          <button type="button" className="bid-modal__close" onClick={() => onClose?.()} aria-label="Close">
            ×
          </button>
        </div>

        <div className="bid-modal__body">
          <div className="bid-modal__info">
            <div className="bid-modal__info-row">
              <span>Current bid</span>
              <strong>{currentBidLabel}</strong>
            </div>
            <div className="bid-modal__info-row">
              <span>Minimum bid</span>
              <strong>{formatCurrency(minimumBid)}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bid-modal__form">
            {!ENV_PLACE_BID_FUNCTION_ID && (
              <div className="bid-modal__config">
                <label className="bid-modal__label">
                  Appwrite Function ID
                  <input
                    className="bid-modal__input"
                    type="text"
                    value={functionIdInput}
                    onChange={(e) => setFunctionIdInput(e.target.value)}
                    placeholder="Paste Function ID (example: 65f0abc123...)"
                    disabled={busy}
                  />
                </label>
                <div className="bid-modal__config-actions">
                  <button
                    type="button"
                    className="bid-modal__button bid-modal__button--secondary"
                    disabled={busy}
                    onClick={() => {
                      saveStoredFunctionId(functionIdInput);
                      setError('');
                    }}
                  >
                    Save Function ID
                  </button>
                </div>
              </div>
            )}

            <label className="bid-modal__label">
              Bid amount
              <input
                className="bid-modal__input"
                type="number"
                min={minimumBid}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
                required
              />
            </label>

            {error && <div className="bid-modal__error">{error}</div>}

            <div className="bid-modal__actions">
              <button type="button" className="bid-modal__button bid-modal__button--secondary" onClick={() => onClose?.()} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="bid-modal__button" disabled={busy}>
                {busy ? 'Placing…' : 'Confirm Bid'}
              </button>
            </div>

            <div className="bid-modal__hint">
              An idempotency key is generated automatically to prevent duplicate bids.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BidModal;
