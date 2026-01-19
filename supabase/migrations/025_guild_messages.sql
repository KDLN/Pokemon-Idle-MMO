-- ============================================
-- GUILD MESSAGES TABLE
-- Private chat for guild members only
-- ============================================

CREATE TABLE IF NOT EXISTS guild_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_username TEXT NOT NULL,
  player_role TEXT NOT NULL CHECK (player_role IN ('leader', 'officer', 'member')),
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary query pattern: get recent messages for a guild
CREATE INDEX idx_guild_messages_guild_created ON guild_messages(guild_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE guild_messages ENABLE ROW LEVEL SECURITY;

-- Members can only see messages from their own guild
CREATE POLICY guild_messages_select ON guild_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guild_members
      WHERE guild_members.guild_id = guild_messages.guild_id
        AND guild_members.player_id = auth.uid()
    )
  );

-- Members can only insert messages for their own guild with correct role
CREATE POLICY guild_messages_insert ON guild_messages
  FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM guild_members
      WHERE guild_members.guild_id = guild_messages.guild_id
        AND guild_members.player_id = auth.uid()
        AND guild_members.role::text = guild_messages.player_role
    )
  );

-- No updates or deletes allowed (messages are permanent)
-- Could add moderation later if needed
