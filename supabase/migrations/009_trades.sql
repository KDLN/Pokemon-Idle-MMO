-- Pokemon Idle MMO - Trading System
-- Migration 009

-- ============================================
-- ENUM TYPE
-- ============================================

CREATE TYPE trade_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'completed');

-- ============================================
-- TRADES TABLE
-- ============================================

-- Main trades table tracking trade sessions between two players
CREATE TABLE trades (
  trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status trade_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent self-trading
  CONSTRAINT no_self_trade CHECK (sender_id != receiver_id)
);

-- ============================================
-- TRADE OFFERS TABLE
-- ============================================

-- Links Pokemon to trades - each side can offer multiple Pokemon
CREATE TABLE trade_offers (
  offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(trade_id) ON DELETE CASCADE NOT NULL,
  pokemon_id UUID REFERENCES pokemon(id) ON DELETE CASCADE NOT NULL,
  offered_by UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each Pokemon can only be offered once per trade
  CONSTRAINT unique_pokemon_per_trade UNIQUE (trade_id, pokemon_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Find trades for a player (either sender or receiver)
CREATE INDEX idx_trades_sender ON trades(sender_id);
CREATE INDEX idx_trades_receiver ON trades(receiver_id);

-- Find pending trades quickly
CREATE INDEX idx_trades_status ON trades(status) WHERE status = 'pending';

-- Find offers for a trade
CREATE INDEX idx_trade_offers_trade ON trade_offers(trade_id);

-- Find all offers a player has made
CREATE INDEX idx_trade_offers_player ON trade_offers(offered_by);

-- Prevent duplicate pending trades between same players
CREATE UNIQUE INDEX idx_unique_pending_trade ON trades(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id)
) WHERE status = 'pending';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;

-- Players can view trades they're part of
CREATE POLICY "Players can view own trades"
  ON trades FOR SELECT
  USING (
    sender_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Players can create trades where they are the sender
CREATE POLICY "Players can create trades as sender"
  ON trades FOR INSERT
  WITH CHECK (sender_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Players can update trades they're part of
CREATE POLICY "Players can update own trades"
  ON trades FOR UPDATE
  USING (
    sender_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Players can view offers on trades they're part of
CREATE POLICY "Players can view offers on own trades"
  ON trade_offers FOR SELECT
  USING (
    trade_id IN (
      SELECT trade_id FROM trades
      WHERE sender_id IN (SELECT id FROM players WHERE user_id = auth.uid())
         OR receiver_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    )
  );

-- Players can add offers to trades they're part of (only their own Pokemon)
CREATE POLICY "Players can add offers to own trades"
  ON trade_offers FOR INSERT
  WITH CHECK (
    offered_by IN (SELECT id FROM players WHERE user_id = auth.uid())
    AND trade_id IN (
      SELECT trade_id FROM trades
      WHERE (sender_id IN (SELECT id FROM players WHERE user_id = auth.uid())
         OR receiver_id IN (SELECT id FROM players WHERE user_id = auth.uid()))
        AND status = 'pending'
    )
  );

-- Players can remove their own offers from pending trades
CREATE POLICY "Players can remove own offers"
  ON trade_offers FOR DELETE
  USING (
    offered_by IN (SELECT id FROM players WHERE user_id = auth.uid())
    AND trade_id IN (
      SELECT trade_id FROM trades WHERE status = 'pending'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_trade_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_timestamp();
