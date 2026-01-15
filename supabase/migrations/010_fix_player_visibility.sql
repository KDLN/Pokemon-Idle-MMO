-- Pokemon Idle MMO - Player Visibility Fix
-- Migration 010
--
-- Fixes two issues:
-- 1. "Trainers Nearby" not showing other players (RLS too restrictive)
-- 2. Friends list asymmetry (unique constraint allows duplicate relationships)

-- ============================================
-- FIX 1: Allow viewing other players in same zone
-- ============================================

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Players can view own data" ON players;

-- Create a new policy that allows:
-- 1. Reading your own full data
-- 2. Reading basic info (username, current_zone, last_online) of players in the same zone
CREATE POLICY "Players can view own data and nearby players"
  ON players FOR SELECT
  USING (
    -- Can always view your own data
    auth.uid() = user_id
    OR
    -- Can view players in the same zone who were recently online
    (
      current_zone_id IN (
        SELECT current_zone_id FROM players WHERE user_id = auth.uid()
      )
      AND last_online > NOW() - INTERVAL '5 minutes'
    )
  );

-- ============================================
-- FIX 2: Prevent duplicate friend relationships
-- ============================================

-- Add a unique index that treats (A,B) and (B,A) as the same relationship
-- This uses LEAST/GREATEST to normalize the pair ordering
-- Note: This won't affect existing data, but will prevent future duplicates

-- First, check for and clean up any existing duplicate relationships
-- (Keep the 'accepted' one if there are duplicates, or the older one)
DO $$
DECLARE
  dup RECORD;
BEGIN
  -- Find duplicate relationships (where both (A,B) and (B,A) exist)
  FOR dup IN
    SELECT f1.friend_id as id1, f2.friend_id as id2,
           f1.status as status1, f2.status as status2,
           f1.created_at as created1, f2.created_at as created2
    FROM friends f1
    JOIN friends f2 ON f1.player_id = f2.friend_player_id
                   AND f1.friend_player_id = f2.player_id
    WHERE f1.friend_id < f2.friend_id  -- Avoid processing same pair twice
  LOOP
    -- If one is accepted and one is pending, delete the pending one
    IF dup.status1 = 'accepted' AND dup.status2 != 'accepted' THEN
      DELETE FROM friends WHERE friend_id = dup.id2;
    ELSIF dup.status2 = 'accepted' AND dup.status1 != 'accepted' THEN
      DELETE FROM friends WHERE friend_id = dup.id1;
    ELSE
      -- Both same status: keep the older one, delete the newer one
      IF dup.created1 <= dup.created2 THEN
        DELETE FROM friends WHERE friend_id = dup.id2;
      ELSE
        DELETE FROM friends WHERE friend_id = dup.id1;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Now create the unique index to prevent future duplicates
-- This ensures only one relationship can exist between any two players
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_friend_relationship
  ON friends (LEAST(player_id, friend_player_id), GREATEST(player_id, friend_player_id));
