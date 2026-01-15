-- Pokemon Idle MMO - Fix RLS Recursion
-- Migration 011
--
-- Fixes the recursive RLS policy that broke player/account linking

-- ============================================
-- FIX: Replace the broken policy
-- ============================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Players can view own data and nearby players" ON players;

-- Restore the original simple policy for now
-- The "nearby players" feature should be handled by the game server instead
CREATE POLICY "Players can view own data"
  ON players FOR SELECT
  USING (auth.uid() = user_id);

-- Note: For "Trainers Nearby" feature, we should fetch via the game server
-- which uses the service key and bypasses RLS, then push to clients via WebSocket
