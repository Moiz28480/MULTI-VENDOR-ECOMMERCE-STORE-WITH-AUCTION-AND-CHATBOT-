# placeBid Appwrite Function

This function handles auction bidding server-side with idempotency safety.

## Expected Request Payload

```json
{
  "auction_id": "<auction_document_id>",
  "bidder_id": "<user_id>",
  "amount": 320,
  "idempotency_key": "<uuid>"
}
```

## Behavior

- Validates payload and auction status.
- Rejects bids lower than `current_bid + 1`.
- Uses `idempotency_key` against the `bids` collection to prevent duplicates.
- Creates a bid document in `bids`.
- Updates the auction document in `auctions`.

## Required Function Environment Variables

- `APPWRITE_API_KEY` (must allow databases read/write for auctions and bids)
- `APPWRITE_FUNCTION_ENDPOINT` or `APPWRITE_ENDPOINT`
- `APPWRITE_FUNCTION_PROJECT_ID` or `APPWRITE_PROJECT_ID`
- Optional: `APPWRITE_DATABASE_ID`
- Optional: `APPWRITE_AUCTIONS_COLLECTION_ID`
- Optional: `APPWRITE_BIDS_COLLECTION_ID`

## Runtime Notes

Use a Node.js runtime and entrypoint `src/main.js`.
