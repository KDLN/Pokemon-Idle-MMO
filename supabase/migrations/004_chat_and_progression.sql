-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('global', 'trade', 'guild', 'system')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 280),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_chat_messages_channel_time ON chat_messages(channel, created_at DESC);
CREATE INDEX idx_chat_messages_player ON chat_messages(player_id);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view chat messages
CREATE POLICY "chat_messages_select_policy"
  ON chat_messages FOR SELECT
  USING (TRUE);

-- Players can only insert their own messages
CREATE POLICY "chat_messages_insert_policy"
  ON chat_messages FOR INSERT
  WITH CHECK (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Add battle points to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS battle_points INT DEFAULT 0;

-- Add badges array to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Add held_item column to pokemon
ALTER TABLE pokemon ADD COLUMN IF NOT EXISTS held_item TEXT;

-- Season Progress Table
CREATE TABLE IF NOT EXISTS season_progress (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  season_id INT NOT NULL DEFAULT 1,
  progress INT DEFAULT 0,
  tier INT DEFAULT 1,
  claimed_rewards INT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on season_progress
ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY;

-- Players can view their own season progress
CREATE POLICY "season_progress_select_policy"
  ON season_progress FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- Players can update their own season progress
CREATE POLICY "season_progress_update_policy"
  ON season_progress FOR UPDATE
  USING (
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- Item Definitions Table (for held items, shop items, etc.)
CREATE TABLE IF NOT EXISTS item_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sprite_url TEXT,
  effect_type TEXT,
  category TEXT DEFAULT 'misc',
  buy_price INT,
  sell_price INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some held items
INSERT INTO item_definitions (id, name, description, effect_type, category) VALUES
  ('leftovers', 'Leftovers', 'Restores HP gradually during battle', 'passive_heal', 'held'),
  ('everstone', 'Everstone', 'Prevents the holder from evolving', 'prevent_evolution', 'held'),
  ('oran_berry', 'Oran Berry', 'Restores 10 HP when HP drops below 50%', 'hp_restore', 'berry'),
  ('sitrus_berry', 'Sitrus Berry', 'Restores 25% HP when HP drops below 50%', 'hp_restore_percent', 'berry'),
  ('focus_sash', 'Focus Sash', 'Allows the holder to survive a would-be KO hit with 1 HP', 'endure', 'held'),
  ('lucky_egg', 'Lucky Egg', 'Increases EXP gained by 50%', 'exp_boost', 'held'),
  ('exp_share', 'Exp. Share', 'Shares EXP with all party members', 'exp_share', 'held'),
  ('amulet_coin', 'Amulet Coin', 'Doubles money earned from battles', 'money_boost', 'held')
ON CONFLICT (id) DO NOTHING;

-- World Events Table (for swarms, special events, etc.)
CREATE TABLE IF NOT EXISTS world_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('swarm', 'legendary', 'event', 'maintenance', 'bonus')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  zone_id INT REFERENCES zones(id),
  species_id INT REFERENCES pokemon_species(id),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  priority INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active events
CREATE INDEX idx_world_events_active ON world_events(is_active, expires_at DESC);

-- Enable RLS on world_events
ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view active world events
CREATE POLICY "world_events_select_policy"
  ON world_events FOR SELECT
  USING (is_active = TRUE AND expires_at > NOW());

-- Enable realtime for world events
ALTER PUBLICATION supabase_realtime ADD TABLE world_events;
