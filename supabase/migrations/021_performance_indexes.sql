-- Performance Indexes Migration
-- Adds indexes identified during code audit to improve query performance

-- Pokemon level index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_pokemon_level ON pokemon(level DESC);

-- Pokemon species + owner index for catch location filtering
CREATE INDEX IF NOT EXISTS idx_pokemon_species_owner ON pokemon(owner_id, species_id);

-- Pokedex entries caught-only index for catch queries
CREATE INDEX IF NOT EXISTS idx_pokedex_entries_caught ON pokedex_entries(player_id) WHERE caught = true;

-- Chat messages player + time index for user chat history
CREATE INDEX IF NOT EXISTS idx_chat_messages_player_time ON chat_messages(player_id, created_at DESC);

-- Trades updated_at index for sorting recent trades
CREATE INDEX IF NOT EXISTS idx_trades_updated_at ON trades(updated_at DESC);

-- RLS Policies for tables missing them

-- gym_leader_pokemon: Read-only public access (gym data is not sensitive)
ALTER TABLE gym_leader_pokemon ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gym_leader_pokemon' AND policyname = 'Gym leader pokemon are viewable by all'
  ) THEN
    CREATE POLICY "Gym leader pokemon are viewable by all"
      ON gym_leader_pokemon FOR SELECT
      USING (true);
  END IF;
END $$;

-- item_definitions: Read-only public access (shop items are public)
ALTER TABLE item_definitions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'item_definitions' AND policyname = 'Item definitions are viewable by all'
  ) THEN
    CREATE POLICY "Item definitions are viewable by all"
      ON item_definitions FOR SELECT
      USING (true);
  END IF;
END $$;
