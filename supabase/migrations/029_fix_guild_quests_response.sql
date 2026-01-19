-- ============================================
-- FIX: Guild Quests Response Structure
-- Aligns get_guild_quests return value with TypeScript interface
-- ============================================

-- Update get_guild_quests to return proper reroll_status object
CREATE OR REPLACE FUNCTION get_guild_quests(p_guild_id UUID, p_player_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_daily_quests JSON;
  v_weekly_quests JSON;
  v_daily_rerolls INT;
  v_weekly_rerolls INT;
  v_today DATE;
  v_week_start DATE;
  v_daily_reset TIMESTAMPTZ;
  v_weekly_reset TIMESTAMPTZ;
BEGIN
  -- Verify player is guild member
  SELECT * INTO v_member
  FROM guild_members
  WHERE guild_id = p_guild_id AND player_id = p_player_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Lazy generation: ensure today's and this week's quests exist
  PERFORM generate_daily_quests(p_guild_id);
  PERFORM generate_weekly_quests(p_guild_id);

  v_today := (NOW() AT TIME ZONE 'UTC')::DATE;
  v_week_start := date_trunc('week', NOW() AT TIME ZONE 'UTC')::DATE;

  -- Calculate reset times
  v_daily_reset := (v_today + INTERVAL '1 day')::TIMESTAMPTZ;
  v_weekly_reset := (v_week_start + INTERVAL '7 days')::TIMESTAMPTZ;

  -- Get daily quests with player's contribution
  SELECT json_agg(quest_row ORDER BY quest_row.quest_type) INTO v_daily_quests
  FROM (
    SELECT
      gq.id,
      gq.quest_type::TEXT,
      gq.target_count,
      gq.current_progress,
      gq.reward_currency,
      gq.reward_guild_points,
      gq.reward_item_id,
      gq.reward_item_quantity,
      gq.type_filter,
      gq.description,
      gq.is_completed,
      gq.completed_at,
      COALESCE(gqc.contribution, 0) as my_contribution,
      (
        SELECT json_agg(contrib ORDER BY contrib.contribution DESC)
        FROM (
          SELECT
            c.player_id,
            p.username,
            c.contribution
          FROM guild_quest_contributions c
          JOIN players p ON p.id = c.player_id
          WHERE c.quest_id = gq.id AND c.contribution > 0
          ORDER BY c.contribution DESC
          LIMIT 10
        ) contrib
      ) as leaderboard
    FROM guild_quests gq
    LEFT JOIN guild_quest_contributions gqc ON gqc.quest_id = gq.id AND gqc.player_id = p_player_id
    WHERE gq.guild_id = p_guild_id
      AND gq.period = 'daily'
      AND gq.quest_date = v_today
  ) quest_row;

  -- Get weekly quests with player's contribution
  SELECT json_agg(quest_row ORDER BY quest_row.quest_type) INTO v_weekly_quests
  FROM (
    SELECT
      gq.id,
      gq.quest_type::TEXT,
      gq.target_count,
      gq.current_progress,
      gq.reward_currency,
      gq.reward_guild_points,
      gq.reward_item_id,
      gq.reward_item_quantity,
      gq.type_filter,
      gq.description,
      gq.is_completed,
      gq.completed_at,
      COALESCE(gqc.contribution, 0) as my_contribution,
      (
        SELECT json_agg(contrib ORDER BY contrib.contribution DESC)
        FROM (
          SELECT
            c.player_id,
            p.username,
            c.contribution
          FROM guild_quest_contributions c
          JOIN players p ON p.id = c.player_id
          WHERE c.quest_id = gq.id AND c.contribution > 0
          ORDER BY c.contribution DESC
          LIMIT 10
        ) contrib
      ) as leaderboard
    FROM guild_quests gq
    LEFT JOIN guild_quest_contributions gqc ON gqc.quest_id = gq.id AND gqc.player_id = p_player_id
    WHERE gq.guild_id = p_guild_id
      AND gq.period = 'weekly'
      AND gq.quest_date = v_week_start
  ) quest_row;

  -- Get reroll counts
  SELECT COALESCE(rerolls_used, 0) INTO v_daily_rerolls
  FROM guild_quest_rerolls
  WHERE guild_id = p_guild_id AND period = 'daily' AND reset_date = v_today;

  SELECT COALESCE(rerolls_used, 0) INTO v_weekly_rerolls
  FROM guild_quest_rerolls
  WHERE guild_id = p_guild_id AND period = 'weekly' AND reset_date = v_week_start;

  -- Return with proper reroll_status object structure matching TypeScript interface
  RETURN json_build_object(
    'success', true,
    'daily', COALESCE(v_daily_quests, '[]'::JSON),
    'weekly', COALESCE(v_weekly_quests, '[]'::JSON),
    'reroll_status', json_build_object(
      'daily_used', COALESCE(v_daily_rerolls, 0),
      'daily_max', 2,
      'weekly_used', COALESCE(v_weekly_rerolls, 0),
      'weekly_max', 1,
      'daily_cost', 500,
      'weekly_cost', 2000
    ),
    'reset_times', json_build_object(
      'daily', v_daily_reset,
      'weekly', v_weekly_reset
    )
  );
END;
$$;

-- ============================================
-- FIX: Reroll Quest Response Structure
-- Aligns reroll_quest return value with TypeScript interface
-- ============================================

CREATE OR REPLACE FUNCTION reroll_quest(
  p_guild_id UUID,
  p_player_id UUID,
  p_quest_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_quest RECORD;
  v_reroll_cost INT;
  v_max_rerolls INT;
  v_current_rerolls INT;
  v_reset_date DATE;
  v_bank RECORD;
  v_activity RECORD;
  v_quest_types quest_type[];
  v_type_filters VARCHAR[];
  v_new_quest_type quest_type;
  v_new_type_filter VARCHAR;
  v_target INT;
  v_reward RECORD;
  v_description TEXT;
  v_new_quest_id UUID;
  v_today DATE;
  v_week_start DATE;
  v_daily_rerolls INT;
  v_weekly_rerolls INT;
BEGIN
  -- Verify player is leader or officer
  SELECT * INTO v_member
  FROM guild_members
  WHERE guild_id = p_guild_id AND player_id = p_player_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_member.role NOT IN ('leader', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Only leaders and officers can reroll quests');
  END IF;

  -- Get quest details
  SELECT * INTO v_quest
  FROM guild_quests
  WHERE id = p_quest_id AND guild_id = p_guild_id
  FOR UPDATE;

  IF v_quest IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Quest not found');
  END IF;

  IF v_quest.is_completed THEN
    RETURN json_build_object('success', false, 'error', 'Cannot reroll completed quest');
  END IF;

  -- Calculate dates for reroll tracking
  v_today := (NOW() AT TIME ZONE 'UTC')::DATE;
  v_week_start := date_trunc('week', NOW() AT TIME ZONE 'UTC')::DATE;

  -- Determine costs and limits based on period
  IF v_quest.period = 'daily' THEN
    v_reroll_cost := 500;
    v_max_rerolls := 2;
    v_reset_date := v_today;
  ELSE
    v_reroll_cost := 2000;
    v_max_rerolls := 1;
    v_reset_date := v_week_start;
  END IF;

  -- Check reroll limit
  SELECT COALESCE(rerolls_used, 0) INTO v_current_rerolls
  FROM guild_quest_rerolls
  WHERE guild_id = p_guild_id AND period = v_quest.period AND reset_date = v_reset_date;

  IF COALESCE(v_current_rerolls, 0) >= v_max_rerolls THEN
    RETURN json_build_object('success', false, 'error', 'No rerolls remaining for this period');
  END IF;

  -- Check guild bank has enough currency
  SELECT * INTO v_bank
  FROM guild_bank_currency
  WHERE guild_id = p_guild_id
  FOR UPDATE;

  IF v_bank.balance < v_reroll_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient guild bank funds', 'required', v_reroll_cost, 'available', v_bank.balance);
  END IF;

  -- Deduct currency from guild bank
  UPDATE guild_bank_currency
  SET balance = balance - v_reroll_cost
  WHERE guild_id = p_guild_id;

  -- Log the reroll expense
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
  VALUES (
    p_guild_id,
    p_player_id,
    'withdraw',
    'currency',
    jsonb_build_object(
      'type', 'quest_reroll',
      'quest_id', p_quest_id,
      'quest_description', v_quest.description,
      'cost', v_reroll_cost
    ),
    v_bank.balance - v_reroll_cost
  );

  -- Increment reroll count
  INSERT INTO guild_quest_rerolls (guild_id, period, rerolls_used, reset_date)
  VALUES (p_guild_id, v_quest.period, 1, v_reset_date)
  ON CONFLICT (guild_id, period, reset_date) DO UPDATE SET
    rerolls_used = guild_quest_rerolls.rerolls_used + 1;

  -- Get activity for target calculation
  SELECT * INTO v_activity FROM get_guild_average_activity(p_guild_id);

  -- Available quest types (excluding the current one)
  v_quest_types := ARRAY['catch_pokemon', 'catch_type', 'battle', 'evolve']::quest_type[];
  v_type_filters := ARRAY['fire', 'water', 'grass', 'electric', 'normal', 'flying', 'bug', 'poison'];

  -- Pick a different quest type
  LOOP
    v_new_quest_type := v_quest_types[1 + floor(random() * 4)::INT];
    EXIT WHEN v_new_quest_type != v_quest.quest_type;
  END LOOP;

  -- For catch_type, pick a random type filter
  IF v_new_quest_type = 'catch_type' THEN
    v_new_type_filter := v_type_filters[1 + floor(random() * array_length(v_type_filters, 1))::INT];
  ELSE
    v_new_type_filter := NULL;
  END IF;

  -- Calculate target
  CASE v_new_quest_type
    WHEN 'catch_pokemon' THEN
      v_target := calculate_quest_target(v_new_quest_type, v_quest.period, v_activity.avg_catches);
    WHEN 'catch_type' THEN
      v_target := calculate_quest_target(v_new_quest_type, v_quest.period, v_activity.avg_catches / 4);
    WHEN 'battle' THEN
      v_target := calculate_quest_target(v_new_quest_type, v_quest.period, v_activity.avg_battles);
    WHEN 'evolve' THEN
      v_target := calculate_quest_target(v_new_quest_type, v_quest.period, v_activity.avg_evolves);
  END CASE;

  -- Calculate rewards
  SELECT * INTO v_reward FROM calculate_quest_reward(v_new_quest_type, v_quest.period, v_target);

  -- Generate description
  v_description := generate_quest_description(v_new_quest_type, v_target, v_new_type_filter);

  -- Delete old quest (cascades to contributions)
  DELETE FROM guild_quests WHERE id = p_quest_id;

  -- Insert new quest
  INSERT INTO guild_quests (
    guild_id, quest_type, period, target_count, reward_currency,
    reward_guild_points, reward_item_id, reward_item_quantity,
    type_filter, description, quest_date
  ) VALUES (
    p_guild_id, v_new_quest_type, v_quest.period, v_target, v_reward.reward_currency,
    v_reward.reward_guild_points, v_reward.reward_item_id, v_reward.reward_item_quantity,
    v_new_type_filter, v_description, v_quest.quest_date
  )
  RETURNING id INTO v_new_quest_id;

  -- Get updated reroll counts for full status
  SELECT COALESCE(rerolls_used, 0) INTO v_daily_rerolls
  FROM guild_quest_rerolls
  WHERE guild_id = p_guild_id AND period = 'daily' AND reset_date = v_today;

  SELECT COALESCE(rerolls_used, 0) INTO v_weekly_rerolls
  FROM guild_quest_rerolls
  WHERE guild_id = p_guild_id AND period = 'weekly' AND reset_date = v_week_start;

  -- Return new quest details with full reroll_status object
  RETURN json_build_object(
    'success', true,
    'new_quest', json_build_object(
      'id', v_new_quest_id,
      'quest_type', v_new_quest_type::TEXT,
      'period', v_quest.period::TEXT,
      'target_count', v_target,
      'current_progress', 0,
      'reward_currency', v_reward.reward_currency,
      'reward_guild_points', v_reward.reward_guild_points,
      'reward_item_id', v_reward.reward_item_id,
      'reward_item_quantity', v_reward.reward_item_quantity,
      'type_filter', v_new_type_filter,
      'description', v_description,
      'is_completed', false,
      'my_contribution', 0,
      'leaderboard', NULL
    ),
    'new_reroll_status', json_build_object(
      'daily_used', COALESCE(v_daily_rerolls, 0),
      'daily_max', 2,
      'weekly_used', COALESCE(v_weekly_rerolls, 0),
      'weekly_max', 1,
      'daily_cost', 500,
      'weekly_cost', 2000
    ),
    'cost_paid', v_reroll_cost
  );
END;
$$;

-- ============================================
-- FIX: Initialize missing guild bank data
-- Ensures all guilds have bank entries
-- ============================================

-- Insert missing guild_bank_currency entries for guilds created before migration 026
INSERT INTO guild_bank_currency (guild_id)
SELECT g.id FROM guilds g
WHERE NOT EXISTS (SELECT 1 FROM guild_bank_currency gbc WHERE gbc.guild_id = g.id);

-- Insert missing guild_bank_slots entries
INSERT INTO guild_bank_slots (guild_id)
SELECT g.id FROM guilds g
WHERE NOT EXISTS (SELECT 1 FROM guild_bank_slots gbs WHERE gbs.guild_id = g.id);

-- Insert missing default permissions for each guild
INSERT INTO guild_bank_permissions (guild_id, category, role, can_deposit, can_withdraw)
SELECT g.id, cat.category::bank_category, r.role::guild_role, true,
  CASE
    WHEN r.role = 'member' THEN false
    ELSE true
  END
FROM guilds g
CROSS JOIN (VALUES ('currency'), ('item'), ('pokemon')) as cat(category)
CROSS JOIN (VALUES ('leader'), ('officer'), ('member')) as r(role)
WHERE NOT EXISTS (
  SELECT 1 FROM guild_bank_permissions gbp
  WHERE gbp.guild_id = g.id AND gbp.category::text = cat.category AND gbp.role::text = r.role
);

-- Insert missing default limits for officers
INSERT INTO guild_bank_limits (guild_id, role, category, daily_limit, pokemon_points_limit)
SELECT g.id, 'officer'::guild_role, cat.category::bank_category,
  CASE cat.category
    WHEN 'currency' THEN 10000
    WHEN 'item' THEN 10
    WHEN 'pokemon' THEN 0
  END,
  CASE cat.category
    WHEN 'pokemon' THEN 100
    ELSE NULL
  END
FROM guilds g
CROSS JOIN (VALUES ('currency'), ('item'), ('pokemon')) as cat(category)
WHERE NOT EXISTS (
  SELECT 1 FROM guild_bank_limits gbl
  WHERE gbl.guild_id = g.id AND gbl.role = 'officer' AND gbl.category::text = cat.category
);

-- ============================================
-- FIX: Guild Buff Purchase Response Structure
-- Returns proper nested 'buff' object matching TypeScript interface
-- ============================================

CREATE OR REPLACE FUNCTION purchase_guild_buff(
  p_player_id UUID,
  p_guild_id UUID,
  p_buff_type VARCHAR,
  p_duration_hours INT,
  p_use_guild_points BOOLEAN DEFAULT false
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_guild RECORD;
  v_bank RECORD;
  v_current_buff RECORD;
  v_cost_currency BIGINT := 0;
  v_cost_guild_points INT := 0;
  v_new_ends_at TIMESTAMPTZ;
  v_multiplier DECIMAL(3,2);
  v_buff_id UUID;
  v_started_at TIMESTAMPTZ;
  v_purchaser_username TEXT;
BEGIN
  -- Validate inputs
  IF p_buff_type NOT IN ('xp_bonus', 'catch_rate', 'encounter_rate') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid buff type. Must be xp_bonus, catch_rate, or encounter_rate');
  END IF;

  IF p_duration_hours < 1 OR p_duration_hours > 24 THEN
    RETURN json_build_object('success', false, 'error', 'Duration must be between 1 and 24 hours');
  END IF;

  -- Opportunistically cleanup expired buffs
  PERFORM cleanup_expired_buffs();

  -- Lock member row and verify role
  SELECT gm.*, g.guild_points INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_member.role NOT IN ('leader', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Only leaders and officers can purchase buffs');
  END IF;

  -- Get purchaser username for response
  SELECT username INTO v_purchaser_username FROM players WHERE id = p_player_id;

  -- Calculate cost based on payment method
  IF p_use_guild_points THEN
    v_cost_guild_points := 200 * p_duration_hours;

    SELECT * INTO v_guild
    FROM guilds
    WHERE id = p_guild_id
    FOR UPDATE;

    IF v_guild.guild_points < v_cost_guild_points THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient guild points', 'required', v_cost_guild_points, 'available', v_guild.guild_points);
    END IF;

    UPDATE guilds
    SET guild_points = guild_points - v_cost_guild_points
    WHERE id = p_guild_id;
  ELSE
    v_cost_currency := 1000 * p_duration_hours;

    SELECT * INTO v_bank
    FROM guild_bank_currency
    WHERE guild_id = p_guild_id
    FOR UPDATE;

    IF v_bank IS NULL OR v_bank.balance < v_cost_currency THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient bank funds', 'required', v_cost_currency, 'available', COALESCE(v_bank.balance, 0));
    END IF;

    UPDATE guild_bank_currency
    SET balance = balance - v_cost_currency
    WHERE guild_id = p_guild_id;
  END IF;

  v_multiplier := 1.10;

  -- Get current buff if exists
  SELECT * INTO v_current_buff
  FROM guild_buffs
  WHERE guild_id = p_guild_id AND buff_type = p_buff_type
  FOR UPDATE;

  IF v_current_buff IS NOT NULL AND v_current_buff.ends_at > NOW() THEN
    v_new_ends_at := LEAST(
      v_current_buff.ends_at + (p_duration_hours * INTERVAL '1 hour'),
      NOW() + INTERVAL '24 hours'
    );
    v_started_at := v_current_buff.started_at;
    v_buff_id := v_current_buff.id;

    UPDATE guild_buffs
    SET ends_at = v_new_ends_at, purchased_by = p_player_id
    WHERE id = v_current_buff.id;
  ELSE
    v_new_ends_at := NOW() + (p_duration_hours * INTERVAL '1 hour');
    v_started_at := NOW();
    v_buff_id := COALESCE(v_current_buff.id, gen_random_uuid());

    INSERT INTO guild_buffs (id, guild_id, buff_type, multiplier, started_at, ends_at, purchased_by)
    VALUES (v_buff_id, p_guild_id, p_buff_type, v_multiplier, v_started_at, v_new_ends_at, p_player_id)
    ON CONFLICT (guild_id, buff_type) DO UPDATE SET
      multiplier = v_multiplier,
      started_at = NOW(),
      ends_at = v_new_ends_at,
      purchased_by = p_player_id
    RETURNING id, started_at INTO v_buff_id, v_started_at;
  END IF;

  -- Record purchase history
  INSERT INTO guild_buff_purchases (guild_id, buff_type, duration_hours, cost_currency, cost_guild_points, purchased_by)
  VALUES (p_guild_id, p_buff_type, p_duration_hours, v_cost_currency, v_cost_guild_points, p_player_id);

  -- Log to guild bank logs
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
  VALUES (
    p_guild_id,
    p_player_id,
    'withdraw',
    'currency',
    jsonb_build_object(
      'type', 'buff_purchase',
      'buff_type', p_buff_type,
      'duration_hours', p_duration_hours,
      'cost_currency', v_cost_currency,
      'cost_guild_points', v_cost_guild_points,
      'payment_method', CASE WHEN p_use_guild_points THEN 'guild_points' ELSE 'currency' END
    ),
    CASE WHEN p_use_guild_points THEN NULL ELSE (SELECT balance FROM guild_bank_currency WHERE guild_id = p_guild_id) END
  );

  -- Return with proper nested 'buff' object matching GuildBuff interface
  RETURN json_build_object(
    'success', true,
    'buff', json_build_object(
      'id', v_buff_id,
      'guild_id', p_guild_id,
      'buff_type', p_buff_type,
      'multiplier', v_multiplier,
      'started_at', v_started_at,
      'ends_at', v_new_ends_at,
      'purchased_by', p_player_id,
      'purchased_by_username', v_purchaser_username
    ),
    'remaining_currency', (SELECT balance FROM guild_bank_currency WHERE guild_id = p_guild_id),
    'remaining_guild_points', (SELECT guild_points FROM guilds WHERE id = p_guild_id)
  );
END;
$$;
