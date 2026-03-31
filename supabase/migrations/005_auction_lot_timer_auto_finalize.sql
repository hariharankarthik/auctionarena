-- Auction lot timer: 20s per player, +6s per bid, host auto-finalize.
-- Stores the authoritative lot end timestamp in DB so all clients stay in sync.

ALTER TABLE auction_rooms
  ADD COLUMN IF NOT EXISTS lot_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lot_pause_remaining_seconds INTEGER;

-- Optional helper index (for analytics / debugging)
CREATE INDEX IF NOT EXISTS idx_rooms_lot_ends_at ON auction_rooms (lot_ends_at);

