-- Pokemon Idle MMO - Trade Slot Swap Fix
-- Migration 013

-- ============================================
-- UPDATE COMPLETE_TRADE FUNCTION
-- ============================================

-- Updates the complete_trade function to swap party slots between traded Pokemon
-- When a party Pokemon is traded, the received Pokemon takes its party slot
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
  -- New variables for slot swapping
  v_sender_slots INT[];
  v_receiver_slots INT[];
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

  -- CAPTURE PARTY SLOTS BEFORE TRANSFER
  -- Create temp table to store pokemon_id -> party_slot mappings
  CREATE TEMP TABLE temp_slot_map (
    pokemon_id UUID PRIMARY KEY,
    original_slot INT
  ) ON COMMIT DROP;

  -- Store all original slots for traded Pokemon
  INSERT INTO temp_slot_map (pokemon_id, original_slot)
  SELECT id, party_slot
  FROM pokemon
  WHERE id = ANY(COALESCE(v_sender_offers, ARRAY[]::UUID[]) || COALESCE(v_receiver_offers, ARRAY[]::UUID[]));

  -- Clear slots from ALL traded Pokemon first (to avoid unique constraint conflicts)
  UPDATE pokemon
  SET party_slot = NULL
  WHERE id = ANY(COALESCE(v_sender_offers, ARRAY[]::UUID[]) || COALESCE(v_receiver_offers, ARRAY[]::UUID[]));

  -- Transfer sender's Pokemon to receiver
  IF v_sender_offers IS NOT NULL AND array_length(v_sender_offers, 1) > 0 THEN
    UPDATE pokemon
    SET owner_id = v_trade.receiver_id
    WHERE id = ANY(v_sender_offers);

    GET DIAGNOSTICS v_transferred_count = ROW_COUNT;
  END IF;

  -- Transfer receiver's Pokemon to sender
  IF v_receiver_offers IS NOT NULL AND array_length(v_receiver_offers, 1) > 0 THEN
    UPDATE pokemon
    SET owner_id = v_trade.sender_id
    WHERE id = ANY(v_receiver_offers);

    GET DIAGNOSTICS v_temp_count = ROW_COUNT;
    v_transferred_count := v_transferred_count + v_temp_count;
  END IF;

  -- Now assign slots: sender's Pokemon get receiver's old slots (1:1 mapping by order)
  -- and receiver's Pokemon get sender's old slots
  -- Get non-null slots from each side, ordered
  SELECT array_agg(original_slot ORDER BY original_slot) INTO v_sender_slots
  FROM temp_slot_map
  WHERE pokemon_id = ANY(COALESCE(v_sender_offers, ARRAY[]::UUID[]))
    AND original_slot IS NOT NULL;

  SELECT array_agg(original_slot ORDER BY original_slot) INTO v_receiver_slots
  FROM temp_slot_map
  WHERE pokemon_id = ANY(COALESCE(v_receiver_offers, ARRAY[]::UUID[]))
    AND original_slot IS NOT NULL;

  -- Assign receiver's old slots to sender's Pokemon (which now belong to receiver)
  IF v_receiver_slots IS NOT NULL AND array_length(v_receiver_slots, 1) > 0
     AND v_sender_offers IS NOT NULL AND array_length(v_sender_offers, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(v_sender_offers, 1), array_length(v_receiver_slots, 1)) LOOP
      UPDATE pokemon
      SET party_slot = v_receiver_slots[i]
      WHERE id = v_sender_offers[i];
    END LOOP;
  END IF;

  -- Assign sender's old slots to receiver's Pokemon (which now belong to sender)
  IF v_sender_slots IS NOT NULL AND array_length(v_sender_slots, 1) > 0
     AND v_receiver_offers IS NOT NULL AND array_length(v_receiver_offers, 1) > 0 THEN
    FOR i IN 1..LEAST(array_length(v_receiver_offers, 1), array_length(v_sender_slots, 1)) LOOP
      UPDATE pokemon
      SET party_slot = v_sender_slots[i]
      WHERE id = v_receiver_offers[i];
    END LOOP;
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
