-- Pokemon Idle MMO - Trade History
-- Migration 012

-- ============================================
-- TRADE HISTORY TABLE
-- ============================================

-- Stores completed trade records with snapshots of traded Pokemon
-- This preserves the trade details even if Pokemon are later traded again or deleted
CREATE TABLE trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL, -- Original trade ID (may no longer exist)

  -- The two players involved
  player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player1_username TEXT NOT NULL, -- Snapshot in case player is deleted
  player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player2_username TEXT NOT NULL, -- Snapshot in case player is deleted

  -- Snapshot of Pokemon exchanged (stored as JSONB for flexibility)
  -- Format: [{ pokemon_id, species_id, species_name, nickname, level, is_shiny }]
  player1_pokemon JSONB NOT NULL DEFAULT '[]',
  player2_pokemon JSONB NOT NULL DEFAULT '[]',

  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Find trade history for a player
CREATE INDEX idx_trade_history_player1 ON trade_history(player1_id);
CREATE INDEX idx_trade_history_player2 ON trade_history(player2_id);

-- Find history by completion date (for recent trades)
CREATE INDEX idx_trade_history_completed ON trade_history(completed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;

-- Players can view trades they were part of
CREATE POLICY "Players can view own trade history"
  ON trade_history FOR SELECT
  USING (
    player1_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR player2_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Only the system (via service key or SECURITY DEFINER functions) can insert
-- No direct insert policy for users

-- ============================================
-- UPDATE COMPLETE_TRADE FUNCTION
-- ============================================

-- Drop and recreate the complete_trade function to record history
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
  v_temp_count INT := 0;
  v_sender_username TEXT;
  v_receiver_username TEXT;
  v_sender_pokemon JSONB;
  v_receiver_pokemon JSONB;
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

  -- Get usernames for history snapshot
  SELECT username INTO v_sender_username FROM players WHERE id = v_trade.sender_id;
  SELECT username INTO v_receiver_username FROM players WHERE id = v_trade.receiver_id;

  -- Get all Pokemon offered by sender
  SELECT array_agg(pokemon_id) INTO v_sender_offers
  FROM trade_offers
  WHERE trade_id = p_trade_id AND offered_by = v_trade.sender_id;

  -- Get all Pokemon offered by receiver
  SELECT array_agg(pokemon_id) INTO v_receiver_offers
  FROM trade_offers
  WHERE trade_id = p_trade_id AND offered_by = v_trade.receiver_id;

  -- VALIDATION: Cannot complete a trade with no Pokemon offered by either party
  IF (v_sender_offers IS NULL OR array_length(v_sender_offers, 1) IS NULL)
     AND (v_receiver_offers IS NULL OR array_length(v_receiver_offers, 1) IS NULL) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot complete trade with no Pokemon offered'
    );
  END IF;

  -- CRITICAL: Lock all Pokemon involved in the trade to prevent race conditions
  -- Note: Can't use COUNT(*) with FOR UPDATE, so we lock rows via a subquery
  PERFORM id FROM pokemon
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

  -- Snapshot Pokemon details BEFORE transferring ownership
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'pokemon_id', p.id,
    'species_id', p.species_id,
    'species_name', s.name,
    'nickname', p.nickname,
    'level', p.level,
    'is_shiny', p.is_shiny
  )), '[]'::jsonb) INTO v_sender_pokemon
  FROM pokemon p
  JOIN pokemon_species s ON p.species_id = s.id
  WHERE p.id = ANY(COALESCE(v_sender_offers, ARRAY[]::UUID[]));

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'pokemon_id', p.id,
    'species_id', p.species_id,
    'species_name', s.name,
    'nickname', p.nickname,
    'level', p.level,
    'is_shiny', p.is_shiny
  )), '[]'::jsonb) INTO v_receiver_pokemon
  FROM pokemon p
  JOIN pokemon_species s ON p.species_id = s.id
  WHERE p.id = ANY(COALESCE(v_receiver_offers, ARRAY[]::UUID[]));

  -- Transfer sender's Pokemon to receiver
  IF v_sender_offers IS NOT NULL AND array_length(v_sender_offers, 1) > 0 THEN
    UPDATE pokemon
    SET owner_id = v_trade.receiver_id,
        party_slot = NULL
    WHERE id = ANY(v_sender_offers)
      AND owner_id = v_trade.sender_id;

    GET DIAGNOSTICS v_transferred_count = ROW_COUNT;
  END IF;

  -- Transfer receiver's Pokemon to sender
  IF v_receiver_offers IS NOT NULL AND array_length(v_receiver_offers, 1) > 0 THEN
    UPDATE pokemon
    SET owner_id = v_trade.sender_id,
        party_slot = NULL
    WHERE id = ANY(v_receiver_offers)
      AND owner_id = v_trade.receiver_id;

    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    v_transferred_count := v_transferred_count + v_temp_count;
  END IF;

  -- Mark trade as completed
  UPDATE trades
  SET status = 'completed'
  WHERE trade_id = p_trade_id;

  -- Record trade history
  INSERT INTO trade_history (
    trade_id,
    player1_id,
    player1_username,
    player2_id,
    player2_username,
    player1_pokemon,
    player2_pokemon,
    completed_at
  ) VALUES (
    p_trade_id,
    v_trade.sender_id,
    v_sender_username,
    v_trade.receiver_id,
    v_receiver_username,
    v_sender_pokemon,
    v_receiver_pokemon,
    NOW()
  );

  RETURN json_build_object(
    'success', true,
    'transferred_count', v_transferred_count,
    'sender_received', coalesce(array_length(v_receiver_offers, 1), 0),
    'receiver_received', coalesce(array_length(v_sender_offers, 1), 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
