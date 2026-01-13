-- Gym Leaders Table
CREATE TABLE IF NOT EXISTS gym_leaders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  specialty_type TEXT NOT NULL,
  zone_id INT REFERENCES zones(id),
  dialog_intro TEXT NOT NULL,
  dialog_win TEXT NOT NULL,
  dialog_lose TEXT NOT NULL,
  sprite_url TEXT,
  reward_money INT DEFAULT 1000,
  reward_badge_points INT DEFAULT 100,
  required_badges TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym Leader Pokemon (their team)
CREATE TABLE IF NOT EXISTS gym_leader_pokemon (
  id SERIAL PRIMARY KEY,
  gym_leader_id TEXT NOT NULL REFERENCES gym_leaders(id) ON DELETE CASCADE,
  species_id INT NOT NULL REFERENCES pokemon_species(id),
  level INT NOT NULL,
  slot INT NOT NULL CHECK (slot >= 1 AND slot <= 6),
  UNIQUE(gym_leader_id, slot)
);

-- Player gym progress (which gyms they've beaten)
CREATE TABLE IF NOT EXISTS player_gym_progress (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  gym_leader_id TEXT NOT NULL REFERENCES gym_leaders(id),
  defeated_at TIMESTAMPTZ DEFAULT NOW(),
  best_pokemon_level INT,
  attempts INT DEFAULT 1,
  PRIMARY KEY (player_id, gym_leader_id)
);

-- Enable RLS
ALTER TABLE gym_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_leader_pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_gym_progress ENABLE ROW LEVEL SECURITY;

-- Anyone can view gym leaders
CREATE POLICY "gym_leaders_select_policy"
  ON gym_leaders FOR SELECT
  USING (is_active = TRUE);

-- Anyone can view gym leader pokemon
CREATE POLICY "gym_leader_pokemon_select_policy"
  ON gym_leader_pokemon FOR SELECT
  USING (TRUE);

-- Players can view their own gym progress
CREATE POLICY "player_gym_progress_select_policy"
  ON player_gym_progress FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- SEED BROCK (Pewter City Gym Leader)
-- For MVP, placing in Pallet Town for testing
-- ============================================

INSERT INTO gym_leaders (
  id, name, title, badge_id, badge_name, specialty_type, zone_id,
  dialog_intro, dialog_win, dialog_lose,
  reward_money, reward_badge_points, required_badges
) VALUES (
  'brock',
  'Brock',
  'The Rock-Solid Pokemon Trainer',
  'boulder',
  'Boulder Badge',
  'Rock',
  1, -- Pallet Town for MVP testing (normally would be Pewter City)
  'I''m Brock! I''m Pewter''s Gym Leader! My rock-hard willpower is evident even in my Pokemon. My Pokemon are all rock hard, and have true-grit determination. That''s right - my Pokemon are all the Rock type!',
  'Your Pokemon''s powerful love and trust toppled my Pokemon! You''ve earned the Boulder Badge!',
  'My defense is impenetrable! Come back when your Pokemon are stronger!',
  1200,
  100,
  '{}'  -- No badges required for first gym
) ON CONFLICT (id) DO UPDATE SET
  zone_id = EXCLUDED.zone_id,
  dialog_intro = EXCLUDED.dialog_intro;

-- Add Geodude species if not exists (for Brock's team)
INSERT INTO pokemon_species (id, name, type1, type2, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, base_catch_rate, base_xp_yield)
VALUES (74, 'Geodude', 'Rock', 'Ground', 40, 80, 100, 30, 30, 20, 255, 60)
ON CONFLICT (id) DO NOTHING;

-- Add Onix species if not exists
INSERT INTO pokemon_species (id, name, type1, type2, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, base_catch_rate, base_xp_yield)
VALUES (95, 'Onix', 'Rock', 'Ground', 35, 45, 160, 30, 45, 70, 45, 77)
ON CONFLICT (id) DO NOTHING;

-- Brock's Team (MVP version - slightly easier)
INSERT INTO gym_leader_pokemon (gym_leader_id, species_id, level, slot) VALUES
  ('brock', 74, 10, 1),  -- Geodude Lv10
  ('brock', 95, 12, 2)   -- Onix Lv12
ON CONFLICT (gym_leader_id, slot) DO UPDATE SET
  species_id = EXCLUDED.species_id,
  level = EXCLUDED.level;
