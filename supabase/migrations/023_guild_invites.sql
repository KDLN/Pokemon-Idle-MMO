-- Pokemon Idle MMO - Guild Invites System
-- Migration 023

-- ============================================
-- GUILD INVITES TABLE
-- ============================================

CREATE TABLE guild_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',

  -- Prevent duplicate invites to same player from same guild
  CONSTRAINT unique_guild_invite UNIQUE (guild_id, player_id),
  -- Cannot invite yourself
  CONSTRAINT no_self_invite CHECK (player_id != invited_by)
);

-- ============================================
-- INDEXES
-- ============================================

-- Find invites by guild (for officers viewing sent invites)
CREATE INDEX idx_guild_invites_guild ON guild_invites(guild_id);

-- Find invites by player (for players viewing received invites)
CREATE INDEX idx_guild_invites_player ON guild_invites(player_id);

-- Index on expires_at for filtering non-expired invites
-- Note: We filter expires_at > NOW() at query time, not in the index predicate
-- (NOW() is not IMMUTABLE so can't be used in partial index)
CREATE INDEX idx_guild_invites_expires ON guild_invites(expires_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE guild_invites ENABLE ROW LEVEL SECURITY;

-- Players can view invites sent to them
CREATE POLICY "Players can view own invites"
  ON guild_invites FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Guild leaders/officers can view outgoing invites from their guild
CREATE POLICY "Guild staff can view outgoing invites"
  ON guild_invites FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
        AND gm.role IN ('leader', 'officer')
    )
  );

-- No direct insert/update/delete - use SECURITY DEFINER functions
CREATE POLICY "No direct invite insert"
  ON guild_invites FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct invite update"
  ON guild_invites FOR UPDATE
  USING (false);

CREATE POLICY "No direct invite delete"
  ON guild_invites FOR DELETE
  USING (false);

-- ============================================
-- ATOMIC DATABASE FUNCTIONS
-- ============================================

-- Send a guild invite (leader/officer only)
CREATE OR REPLACE FUNCTION send_guild_invite(
  p_actor_id UUID,
  p_target_player_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor RECORD;
  v_target RECORD;
  v_invite_id UUID;
BEGIN
  -- Get actor's guild membership with role
  SELECT gm.*, g.id as g_id, g.name as guild_name, g.join_mode, g.member_count, g.max_members
  INTO v_actor
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_actor_id
  FOR UPDATE OF gm;

  IF v_actor IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are not in a guild');
  END IF;

  -- Only leader or officer can invite
  IF v_actor.role NOT IN ('leader', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Only leaders and officers can send invites');
  END IF;

  -- Check join_mode allows invites (closed = no invites)
  IF v_actor.join_mode = 'closed' THEN
    RETURN json_build_object('success', false, 'error', 'Guild is closed to new members');
  END IF;

  -- Check guild not full
  IF v_actor.member_count >= v_actor.max_members THEN
    RETURN json_build_object('success', false, 'error', 'Guild is full');
  END IF;

  -- Check target player exists and is not in a guild
  SELECT p.id, p.guild_id, p.username INTO v_target
  FROM players p WHERE p.id = p_target_player_id;

  IF v_target IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Player not found');
  END IF;

  IF v_target.guild_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Player is already in a guild');
  END IF;

  -- Check not already invited (constraint will catch, but give nicer error)
  IF EXISTS (
    SELECT 1 FROM guild_invites
    WHERE guild_id = v_actor.g_id
      AND player_id = p_target_player_id
      AND expires_at > NOW()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Player already has a pending invite');
  END IF;

  -- Delete any expired invites for this player from this guild
  DELETE FROM guild_invites
  WHERE guild_id = v_actor.g_id AND player_id = p_target_player_id AND expires_at <= NOW();

  -- Create invite
  INSERT INTO guild_invites (guild_id, player_id, invited_by)
  VALUES (v_actor.g_id, p_target_player_id, p_actor_id)
  RETURNING id INTO v_invite_id;

  RETURN json_build_object(
    'success', true,
    'invite_id', v_invite_id,
    'guild_name', v_actor.guild_name
  );
END;
$$;

-- Accept a guild invite (joins guild as member)
CREATE OR REPLACE FUNCTION accept_guild_invite(
  p_player_id UUID,
  p_invite_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_guild RECORD;
  v_left_guild_at TIMESTAMPTZ;
BEGIN
  -- Lock and verify invite exists and belongs to player
  SELECT gi.*, g.id as g_id, g.name as guild_name, g.member_count, g.max_members, g.join_mode
  INTO v_invite
  FROM guild_invites gi
  JOIN guilds g ON g.id = gi.guild_id
  WHERE gi.id = p_invite_id AND gi.player_id = p_player_id
  FOR UPDATE OF gi;

  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invite not found');
  END IF;

  -- Check invite not expired
  IF v_invite.expires_at <= NOW() THEN
    -- Clean up expired invite
    DELETE FROM guild_invites WHERE id = p_invite_id;
    RETURN json_build_object('success', false, 'error', 'Invite has expired');
  END IF;

  -- Check player not already in a guild
  IF EXISTS (SELECT 1 FROM guild_members WHERE player_id = p_player_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already in a guild');
  END IF;

  -- Check 24hr cooldown from leaving previous guild
  SELECT left_guild_at INTO v_left_guild_at FROM players WHERE id = p_player_id;
  IF v_left_guild_at IS NOT NULL AND v_left_guild_at > NOW() - INTERVAL '24 hours' THEN
    RETURN json_build_object('success', false, 'error', 'Must wait 24 hours after leaving a guild');
  END IF;

  -- Check guild not full
  IF v_invite.member_count >= v_invite.max_members THEN
    RETURN json_build_object('success', false, 'error', 'Guild is full');
  END IF;

  -- Check guild not closed (might have changed since invite sent)
  IF v_invite.join_mode = 'closed' THEN
    RETURN json_build_object('success', false, 'error', 'Guild is no longer accepting members');
  END IF;

  -- Delete the invite
  DELETE FROM guild_invites WHERE id = p_invite_id;

  -- Add member (triggers sync_player_guild_id from 022_guilds.sql)
  INSERT INTO guild_members (guild_id, player_id, role)
  VALUES (v_invite.g_id, p_player_id, 'member');

  -- Update member count
  UPDATE guilds SET member_count = member_count + 1 WHERE id = v_invite.g_id;

  -- Clear cooldown timestamp
  UPDATE players SET left_guild_at = NULL WHERE id = p_player_id;

  RETURN json_build_object(
    'success', true,
    'guild_id', v_invite.g_id,
    'guild_name', v_invite.guild_name
  );
END;
$$;

-- Decline a guild invite
CREATE OR REPLACE FUNCTION decline_guild_invite(
  p_player_id UUID,
  p_invite_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- Verify invite exists and belongs to player
  SELECT * INTO v_invite
  FROM guild_invites
  WHERE id = p_invite_id AND player_id = p_player_id;

  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invite not found');
  END IF;

  -- Delete the invite
  DELETE FROM guild_invites WHERE id = p_invite_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Cancel a guild invite (leader/officer can cancel any invite from their guild)
CREATE OR REPLACE FUNCTION cancel_guild_invite(
  p_actor_id UUID,
  p_invite_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor RECORD;
  v_invite RECORD;
BEGIN
  -- Get actor's guild membership with role
  SELECT gm.*, g.id as g_id
  INTO v_actor
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_actor_id;

  IF v_actor IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'You are not in a guild');
  END IF;

  IF v_actor.role NOT IN ('leader', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Only leaders and officers can cancel invites');
  END IF;

  -- Verify invite exists and belongs to actor's guild
  SELECT * INTO v_invite
  FROM guild_invites
  WHERE id = p_invite_id AND guild_id = v_actor.g_id;

  IF v_invite IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invite not found');
  END IF;

  -- Delete the invite
  DELETE FROM guild_invites WHERE id = p_invite_id;

  RETURN json_build_object('success', true);
END;
$$;
