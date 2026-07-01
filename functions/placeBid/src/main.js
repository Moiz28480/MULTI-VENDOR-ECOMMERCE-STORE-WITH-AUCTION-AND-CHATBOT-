import { Client, Databases, ID, Query } from 'node-appwrite';

const DEFAULT_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const DEFAULT_PROJECT_ID = '69bf4532001c55de99e2';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '69c1cfaf003a710f1232';
const AUCTIONS_COLLECTION_ID = process.env.APPWRITE_AUCTIONS_COLLECTION_ID || 'auctions';
const BIDS_COLLECTION_ID = process.env.APPWRITE_BIDS_COLLECTION_ID || 'bids';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toString = (value, fallback = '') => String(value ?? fallback).trim();

const parseRequestBody = (req) => {
  if (req?.bodyJson && typeof req.bodyJson === 'object') {
    return req.bodyJson;
  }

  const text = toString(req?.bodyText || req?.body || '');
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const json = (res, statusCode, payload) => res.json(payload, statusCode, {
  'Content-Type': 'application/json',
});

const getRequiredEnv = () => {
  const endpoint = toString(
    process.env.APPWRITE_FUNCTION_ENDPOINT ||
    process.env.APPWRITE_ENDPOINT ||
    DEFAULT_ENDPOINT
  );

  const projectId = toString(
    process.env.APPWRITE_FUNCTION_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID ||
    DEFAULT_PROJECT_ID
  );

  const apiKey = toString(
    process.env.APPWRITE_API_KEY ||
    process.env.APPWRITE_FUNCTION_API_KEY ||
    ''
  );

  return { endpoint, projectId, apiKey };
};

export default async ({ req, res, log, error }) => {
  try {
    const method = toString(req?.method || 'POST').toUpperCase();
    if (method !== 'POST') {
      return json(res, 405, { ok: false, message: 'Method not allowed.' });
    }

    const { endpoint, projectId, apiKey } = getRequiredEnv();

    if (!endpoint || !projectId || !apiKey) {
      return json(res, 500, {
        ok: false,
        message: 'Function is missing Appwrite environment configuration.',
      });
    }

    const body = parseRequestBody(req);

    const auctionId = toString(body.auction_id);
    const bidderId = toString(body.bidder_id);
    const idempotencyKey = toString(body.idempotency_key);
    const amount = toNumber(body.amount, 0);

    if (!auctionId || !bidderId || !idempotencyKey || amount <= 0) {
      return json(res, 400, {
        ok: false,
        message: 'Invalid payload. Required: auction_id, bidder_id, amount, idempotency_key.',
      });
    }

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);

    const prior = await databases.listDocuments(DATABASE_ID, BIDS_COLLECTION_ID, [
      Query.equal('idempotency_key', [idempotencyKey]),
      Query.limit(1),
    ]);

    const existingBid = prior?.documents?.[0] || null;
    if (existingBid) {
      return json(res, 200, {
        ok: true,
        idempotent: true,
        message: 'Duplicate request ignored. Existing bid returned.',
        bid: {
          id: existingBid.$id,
          amount: toNumber(existingBid.amount, 0),
          auction_id: toString(existingBid.auction_id),
          bidder_id: toString(existingBid.bidder_id),
        },
      });
    }

    const auction = await databases.getDocument(DATABASE_ID, AUCTIONS_COLLECTION_ID, auctionId);

    const status = toString(auction?.status, '');
    const endTimeIso = toString(auction?.end_time, '');
    const endTimeMs = new Date(endTimeIso).getTime();
    const scheduledStartIso = toString(auction?.last_bid_at, '');
    const scheduledStartMs = new Date(scheduledStartIso).getTime();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    let effectiveStatus = status;

    if (status === 'upcoming') {
      const hasValidSchedule = Number.isFinite(scheduledStartMs);

      if (!hasValidSchedule || scheduledStartMs > nowMs) {
        return json(res, 409, { ok: false, message: 'Auction has not started yet.' });
      }

      effectiveStatus = 'active';
    }

    if (effectiveStatus !== 'active') {
      return json(res, 409, { ok: false, message: 'Auction is not active.' });
    }

    if (Number.isFinite(endTimeMs) && endTimeMs <= Date.now()) {
      return json(res, 409, { ok: false, message: 'Auction has already ended.' });
    }

    const currentBid = toNumber(auction?.current_bid, 0);
    const minAmount = Math.max(1, Math.ceil(currentBid + 1));

    if (amount < minAmount) {
      return json(res, 409, {
        ok: false,
        message: `Bid must be at least ${minAmount}.`,
        minimumBid: minAmount,
        currentBid,
      });
    }

    if (status === 'upcoming' && effectiveStatus === 'active') {
      await databases.updateDocument(
        DATABASE_ID,
        AUCTIONS_COLLECTION_ID,
        auctionId,
        {
          status: 'active',
        }
      );
    }

    const createdBid = await databases.createDocument(
      DATABASE_ID,
      BIDS_COLLECTION_ID,
      ID.unique(),
      {
        auction_id: auctionId,
        bidder_id: bidderId,
        amount,
        timestamp: nowIso,
        idempotency_key: idempotencyKey,
      }
    );

    const nextBidCount = toNumber(auction?.bid_count, 0) + 1;
    const nextVersion = toNumber(auction?.version, 0) + 1;

    const updatedAuction = await databases.updateDocument(
      DATABASE_ID,
      AUCTIONS_COLLECTION_ID,
      auctionId,
      {
        current_bid: amount,
        highest_bidder_id: bidderId,
        bid_count: nextBidCount,
        version: nextVersion,
        last_bid_at: nowIso,
      }
    );

    log(`Bid accepted for auction ${auctionId}: ${amount}`);

    return json(res, 200, {
      ok: true,
      idempotent: false,
      message: 'Bid placed successfully.',
      bid: {
        id: createdBid.$id,
        amount,
        bidder_id: bidderId,
        auction_id: auctionId,
      },
      auction: {
        id: updatedAuction.$id,
        current_bid: toNumber(updatedAuction.current_bid, 0),
        highest_bidder_id: toString(updatedAuction.highest_bidder_id),
        bid_count: toNumber(updatedAuction.bid_count, 0),
        version: toNumber(updatedAuction.version, 0),
      },
    });
  } catch (err) {
    error(`placeBid failed: ${err?.message || String(err)}`);
    return json(res, 500, {
      ok: false,
      message: err?.message || 'Unexpected server error while placing bid.',
    });
  }
};
