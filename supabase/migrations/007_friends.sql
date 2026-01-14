-- Pokemon Idle MMO - Friends System
-- Migration 007

-- ============================================
-- ENUM TYPE
-- ============================================

CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'blocked');

-- ============================================
-- FRIENDS TABLE
-- ============================================

CREATE TABLE friends (
  friend_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  friend_player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status friend_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent self-friending and duplicate relationships
  CONSTRAINT no_self_friend CHECK (player_id != friend_player_id),
  CONSTRAINT unique_friend_pair UNIQUE (player_id, friend_player_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_friends_player_id ON friends(player_id);
CREATE INDEX idx_friends_friend_player_id ON friends(friend_player_id);
CREATE INDEX idx_friends_status ON friends(player_id, status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Players can view friend requests they sent or received
CREATE POLICY "Players can view own friend relationships"
  ON friends FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR friend_player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Players can send friend requests (insert)
CREATE POLICY "Players can send friend requests"
  ON friends FOR INSERT
  WITH CHECK (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Players can update friend requests they received (accept/block) or sent (cancel)
CREATE POLICY "Players can update own friend relationships"
  ON friends FOR UPDATE
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR friend_player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- Players can delete friend relationships they're part of
CREATE POLICY "Players can delete own friend relationships"
  ON friends FOR DELETE
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR friend_player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );
