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
-- SECURITY: Validates both that the player owns the Pokemon AND is part of the trade
CREATE POLICY "Players can add offers to own trades"
  ON trade_offers FOR INSERT
  WITH CHECK (
    -- Player must be the one offering
    offered_by IN (SELECT id FROM players WHERE user_id = auth.uid())
    -- Pokemon must belong to the player offering it
    AND pokemon_id IN (SELECT id FROM pokemon WHERE owner_id = offered_by)
    -- Trade must be pending and player must be part of it
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

-- ============================================
-- TRADE COMPLETION FUNCTION
-- ============================================

-- Atomically completes a trade by transferring Pokemon ownership
-- This runs as SECURITY DEFINER to bypass RLS during the transfer
-- SAFETY: Prevents trades that would leave either player with an empty party
-- CONCURRENCY: Locks both the trade row and all involved Pokemon rows to prevent races
CREATE OR REPLACE FUNCTION complete_trade(p_trade_id UUID)
RETURNS JSON AS $$
DECLARE
  v_trade RECORD;
  v_sender_offers UUID[];
  v_receiver_offers UUID[];
  v_sender_party_count INT;
  v_receiver_party_count INT;
  v_sender_party_traded INT;
  v_receiver_party_traded INT;
  v_transferred_count INT := 0;
  v_locked_pokemon_count INT;
BEGIN
  -- Lock the trade row for update
  SELECT * INTO v_trade
  FROM trades
  WHERE trade_id = p_trade_id
  FOR UPDATE;

  -- Verify trade exists and is accepted (ready to complete)
  IF v_trade IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Trade not found');
  END IF;

  IF v_trade.status != 'accepted' THEN
    RETURN json_build_object('success', false, 'error', 'Trade must be accepted before completing');
  END IF;

  -- Get all Pokemon offered by sender
  SELECT array_agg(pokemon_id) INTO v_sender_offers
  FROM trade_offers
  WHERE trade_id = p_trade_id AND offered_by = v_trade.sender_id;

  -- Get all Pokemon offered by receiver
  SELECT array_agg(pokemon_id) INTO v_receiver_offers
  FROM trade_offers
  WHERE trade_id = p_trade_id AND offered_by = v_trade.receiver_id;

  -- CRITICAL: Lock all Pokemon involved in the trade to prevent race conditions
  -- This prevents another operation from modifying these Pokemon between our checks and transfers
  SELECT COUNT(*) INTO v_locked_pokemon_count
  FROM pokemon
  WHERE id = ANY(
    COALESCE(v_sender_offers, ARRAY[]::UUID[]) || COALESCE(v_receiver_offers, ARRAY[]::UUID[])
  )
  FOR UPDATE;

  -- Count current party members for each player
  SELECT COUNT(*) INTO v_sender_party_count
  FROM pokemon
  WHERE owner_id = v_trade.sender_id AND party_slot IS NOT NULL;

  SELECT COUNT(*) INTO v_receiver_party_count
  FROM pokemon
  WHERE owner_id = v_trade.receiver_id AND party_slot IS NOT NULL;

  -- Count how many party Pokemon each player is trading away
  SELECT COUNT(*) INTO v_sender_party_traded
  FROM pokemon
  WHERE id = ANY(COALESCE(v_sender_offers, ARRAY[]::UUID[]))
    AND party_slot IS NOT NULL;

  SELECT COUNT(*) INTO v_receiver_party_traded
  FROM pokemon
  WHERE id = ANY(COALESCE(v_receiver_offers, ARRAY[]::UUID[]))
    AND party_slot IS NOT NULL;

  -- SAFETY CHECK: Ensure neither player ends up with empty party
  -- Each player must have at least 1 party member after the trade
  -- They keep: (current party) - (party traded away) + (party received from other)
  -- Note: Received Pokemon don't auto-join party, so we only check they don't lose all

  IF v_sender_party_count - v_sender_party_traded < 1 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Trade would leave sender with no party Pokemon. Remove some Pokemon from the trade offer.'
    );
  END IF;

  IF v_receiver_party_count - v_receiver_party_traded < 1 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Trade would leave receiver with no party Pokemon. Remove some Pokemon from the trade offer.'
    );
  END IF;

  -- Transfer sender's Pokemon to receiver
  IF v_sender_offers IS NOT NULL AND array_length(v_sender_offers, 1) > 0 THEN
    UPDATE pokemon
    SET owner_id = v_trade.receiver_id,
        party_slot = NULL  -- Remove from party when traded
    WHERE id = ANY(v_sender_offers)
      AND owner_id = v_trade.sender_id;  -- Double-check ownership

    GET DIAGNOSTICS v_transferred_count = ROW_COUNT;
  END IF;

  -- Transfer receiver's Pokemon to sender
  IF v_receiver_offers IS NOT NULL AND array_length(v_receiver_offers, 1) > 0 THEN
    UPDATE pokemon
    SET owner_id = v_trade.sender_id,
        party_slot = NULL  -- Remove from party when traded
    WHERE id = ANY(v_receiver_offers)
      AND owner_id = v_trade.receiver_id;  -- Double-check ownership

    GET DIAGNOSTICS v_transferred_count = v_transferred_count + ROW_COUNT;
  END IF;

  -- Mark trade as completed
  UPDATE trades
  SET status = 'completed'
  WHERE trade_id = p_trade_id;

  RETURN json_build_object(
    'success', true,
    'transferred_count', v_transferred_count,
    'sender_received', coalesce(array_length(v_receiver_offers, 1), 0),
    'receiver_received', coalesce(array_length(v_sender_offers, 1), 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
