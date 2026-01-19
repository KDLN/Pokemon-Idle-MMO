-- ============================================
-- FIX: Add missing get_quest_details function
-- BUG-01: "Show contributors" button error
-- ============================================

CREATE OR REPLACE FUNCTION get_quest_details(p_quest_id UUID, p_player_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest RECORD;
  v_guild_id UUID;
  v_contributions JSON;
  v_my_contribution INT;
BEGIN
  -- Get quest and verify player is in the same guild
  SELECT gq.*, gm.guild_id INTO v_quest, v_guild_id
  FROM guild_quests gq
  JOIN guild_members gm ON gm.guild_id = gq.guild_id AND gm.player_id = p_player_id
  WHERE gq.id = p_quest_id;

  IF v_quest IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get my contribution
  SELECT COALESCE(contribution, 0) INTO v_my_contribution
  FROM guild_quest_contributions
  WHERE quest_id = p_quest_id AND player_id = p_player_id;

  -- Get all contributions with rank
  SELECT json_agg(contrib ORDER BY contrib.contribution DESC)
  INTO v_contributions
  FROM (
    SELECT
      c.player_id,
      p.username,
      c.contribution,
      ROW_NUMBER() OVER (ORDER BY c.contribution DESC) as rank
    FROM guild_quest_contributions c
    JOIN players p ON p.id = c.player_id
    WHERE c.quest_id = p_quest_id AND c.contribution > 0
    ORDER BY c.contribution DESC
  ) contrib;

  -- Return quest details with contributions array
  RETURN json_build_object(
    'id', v_quest.id,
    'guild_id', v_quest.guild_id,
    'quest_type', v_quest.quest_type::TEXT,
    'period', v_quest.period::TEXT,
    'target_count', v_quest.target_count,
    'current_progress', v_quest.current_progress,
    'reward_currency', v_quest.reward_currency,
    'reward_guild_points', v_quest.reward_guild_points,
    'reward_item_id', v_quest.reward_item_id,
    'reward_item_quantity', v_quest.reward_item_quantity,
    'type_filter', v_quest.type_filter,
    'description', v_quest.description,
    'is_completed', v_quest.is_completed,
    'completed_at', v_quest.completed_at,
    'quest_date', v_quest.quest_date,
    'created_at', v_quest.created_at,
    'my_contribution', COALESCE(v_my_contribution, 0),
    'contributions', COALESCE(v_contributions, '[]'::JSON)
  );
END;
$$;
