-- Pokemon Idle MMO - Initial Schema
-- MVP Version

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STATIC DATA TABLES
-- ============================================

-- Pokemon Species (static game data)
CREATE TABLE pokemon_species (
  id INT PRIMARY KEY,  -- National dex number
  name TEXT NOT NULL,
  type1 TEXT NOT NULL,
  type2 TEXT,
  base_hp INT NOT NULL,
  base_attack INT NOT NULL,
  base_defense INT NOT NULL,
  base_sp_attack INT NOT NULL,
  base_sp_defense INT NOT NULL,
  base_speed INT NOT NULL,
  base_catch_rate INT NOT NULL,  -- 0-255
  base_xp_yield INT NOT NULL
);

-- Zones (static game data)
CREATE TABLE zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL,  -- 'town' or 'route'
  base_encounter_rate DECIMAL(5,4) DEFAULT 0.0000,  -- 0 for towns
  min_level INT DEFAULT 2,
  max_level INT DEFAULT 5
);

-- Zone connections (adjacency graph)
CREATE TABLE zone_connections (
  from_zone_id INT REFERENCES zones(id) ON DELETE CASCADE,
  to_zone_id INT REFERENCES zones(id) ON DELETE CASCADE,
  PRIMARY KEY (from_zone_id, to_zone_id)
);

-- Encounter tables (what spawns where)
CREATE TABLE encounter_tables (
  zone_id INT REFERENCES zones(id) ON DELETE CASCADE,
  species_id INT REFERENCES pokemon_species(id) ON DELETE CASCADE,
  encounter_rate DECIMAL(5,4) NOT NULL,  -- Weight (0.0001 to 1.0)
  PRIMARY KEY (zone_id, species_id)
);

-- ============================================
-- PLAYER DATA TABLES
-- ============================================

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_online TIMESTAMPTZ DEFAULT NOW(),

  -- Current state
  current_zone_id INT REFERENCES zones(id) DEFAULT 1,

  -- Currency
  pokedollars BIGINT DEFAULT 3000,

  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Player's Pokemon
CREATE TABLE pokemon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  species_id INT REFERENCES pokemon_species(id) NOT NULL,
  nickname TEXT,

  level INT DEFAULT 5 CHECK (level >= 1 AND level <= 100),
  xp INT DEFAULT 0 CHECK (xp >= 0),
  current_hp INT NOT NULL CHECK (current_hp >= 0),
  max_hp INT NOT NULL CHECK (max_hp > 0),

  -- Calculated stats (no IVs/EVs in MVP)
  stat_attack INT NOT NULL,
  stat_defense INT NOT NULL,
  stat_sp_attack INT NOT NULL,
  stat_sp_defense INT NOT NULL,
  stat_speed INT NOT NULL,

  -- Party position (1-6) or NULL if in box
  party_slot INT,

  caught_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_party_slot CHECK (party_slot IS NULL OR (party_slot >= 1 AND party_slot <= 6)),
  CONSTRAINT nickname_length CHECK (nickname IS NULL OR char_length(nickname) <= 20)
);

-- Pokedex entries
CREATE TABLE pokedex_entries (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  species_id INT REFERENCES pokemon_species(id) ON DELETE CASCADE,
  seen BOOLEAN DEFAULT FALSE,
  caught BOOLEAN DEFAULT FALSE,
  catch_count INT DEFAULT 0 CHECK (catch_count >= 0),
  first_caught_at TIMESTAMPTZ,
  PRIMARY KEY (player_id, species_id)
);

-- Player inventory
CREATE TABLE inventory (
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,  -- 'pokeball', 'greatball', etc.
  quantity INT DEFAULT 0 CHECK (quantity >= 0),
  PRIMARY KEY (player_id, item_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_pokemon_owner ON pokemon(owner_id);
CREATE INDEX idx_pokemon_party ON pokemon(owner_id, party_slot) WHERE party_slot IS NOT NULL;
CREATE INDEX idx_players_online ON players(last_online DESC);
CREATE INDEX idx_players_user ON players(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokedex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Players can read their own data
CREATE POLICY "Players can view own data"
  ON players FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players can update own data"
  ON players FOR UPDATE
  USING (auth.uid() = user_id);

-- Pokemon - players can see their own
CREATE POLICY "Players can view own pokemon"
  ON pokemon FOR SELECT
  USING (owner_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Players can insert own pokemon"
  ON pokemon FOR INSERT
  WITH CHECK (owner_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Players can update own pokemon"
  ON pokemon FOR UPDATE
  USING (owner_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Players can delete own pokemon"
  ON pokemon FOR DELETE
  USING (owner_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Pokedex - players can see their own
CREATE POLICY "Players can view own pokedex"
  ON pokedex_entries FOR SELECT
  USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Players can insert own pokedex"
  ON pokedex_entries FOR INSERT
  WITH CHECK (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Players can update own pokedex"
  ON pokedex_entries FOR UPDATE
  USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Inventory - players can see their own
CREATE POLICY "Players can view own inventory"
  ON inventory FOR SELECT
  USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

CREATE POLICY "Players can modify own inventory"
  ON inventory FOR ALL
  USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Static data is public
CREATE POLICY "Anyone can view pokemon species"
  ON pokemon_species FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view zones"
  ON zones FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view zone connections"
  ON zone_connections FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view encounter tables"
  ON encounter_tables FOR SELECT
  USING (TRUE);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create a new player with starter Pokemon
CREATE OR REPLACE FUNCTION create_new_player(
  p_user_id UUID,
  p_username TEXT,
  p_starter_species_id INT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
  v_species pokemon_species%ROWTYPE;
  v_hp INT;
  v_attack INT;
  v_defense INT;
  v_sp_attack INT;
  v_sp_defense INT;
  v_speed INT;
BEGIN
  -- Validate starter is allowed (1=Bulbasaur, 4=Charmander, 7=Squirtle)
  IF p_starter_species_id NOT IN (1, 4, 7) THEN
    RAISE EXCEPTION 'Invalid starter Pokemon';
  END IF;

  -- Get species base stats
  SELECT * INTO v_species FROM pokemon_species WHERE id = p_starter_species_id;

  IF v_species IS NULL THEN
    RAISE EXCEPTION 'Species not found';
  END IF;

  -- Calculate stats for level 5
  v_hp := FLOOR((2 * v_species.base_hp * 5 / 100) + 5 + 10);
  v_attack := FLOOR((2 * v_species.base_attack * 5 / 100) + 5);
  v_defense := FLOOR((2 * v_species.base_defense * 5 / 100) + 5);
  v_sp_attack := FLOOR((2 * v_species.base_sp_attack * 5 / 100) + 5);
  v_sp_defense := FLOOR((2 * v_species.base_sp_defense * 5 / 100) + 5);
  v_speed := FLOOR((2 * v_species.base_speed * 5 / 100) + 5);

  -- Create player
  INSERT INTO players (user_id, username, current_zone_id)
  VALUES (p_user_id, p_username, 1)  -- Start in Pallet Town
  RETURNING id INTO v_player_id;

  -- Create starter Pokemon in party slot 1
  INSERT INTO pokemon (
    owner_id, species_id, level, current_hp, max_hp,
    stat_attack, stat_defense, stat_sp_attack, stat_sp_defense, stat_speed, party_slot
  )
  VALUES (
    v_player_id, p_starter_species_id, 5, v_hp, v_hp,
    v_attack, v_defense, v_sp_attack, v_sp_defense, v_speed, 1
  );

  -- Create pokedex entry for starter
  INSERT INTO pokedex_entries (player_id, species_id, seen, caught, catch_count, first_caught_at)
  VALUES (v_player_id, p_starter_species_id, TRUE, TRUE, 1, NOW());

  -- Give starting Pokeballs
  INSERT INTO inventory (player_id, item_id, quantity)
  VALUES (v_player_id, 'pokeball', 20);

  RETURN v_player_id;
END;
$$;

-- Function to check if username is available
CREATE OR REPLACE FUNCTION is_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM players WHERE LOWER(username) = LOWER(p_username)
  );
$$;
