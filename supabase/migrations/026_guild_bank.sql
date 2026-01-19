-- Pokemon Idle MMO - Guild Bank System
-- Migration 026

-- ============================================
-- ENUM TYPES
-- ============================================

-- Bank category for organizing different storage types
CREATE TYPE bank_category AS ENUM ('currency', 'item', 'pokemon');

-- Actions that can be performed on the bank
CREATE TYPE bank_action AS ENUM (
  'deposit',
  'withdraw',
  'request_created',
  'request_fulfilled',
  'request_expired',
  'request_cancelled'
);

-- Status of member requests
CREATE TYPE request_status AS ENUM ('pending', 'fulfilled', 'expired', 'cancelled');

-- ============================================
-- CORE STORAGE TABLES
-- ============================================

-- Guild bank currency storage (one row per guild)
CREATE TABLE guild_bank_currency (
  guild_id UUID PRIMARY KEY REFERENCES guilds(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  max_capacity BIGINT NOT NULL DEFAULT 50000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guild bank item storage (one row per item type per guild)
CREATE TABLE guild_bank_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  item_id VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0 AND quantity <= 99),
  deposited_by UUID REFERENCES players(id) ON DELETE SET NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, item_id)
);

-- Guild bank Pokemon storage (one row per Pokemon in bank)
CREATE TABLE guild_bank_pokemon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  pokemon_id UUID NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
  slot INT NOT NULL CHECK (slot >= 1),
  deposited_by UUID REFERENCES players(id) ON DELETE SET NULL,
  deposited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, slot),
  UNIQUE(pokemon_id)
);

-- Guild bank slot configuration (one row per guild)
CREATE TABLE guild_bank_slots (
  guild_id UUID PRIMARY KEY REFERENCES guilds(id) ON DELETE CASCADE,
  base_slots INT NOT NULL DEFAULT 25,
  purchased_slots INT NOT NULL DEFAULT 0,
  next_expansion_price BIGINT NOT NULL DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STORAGE TABLE INDEXES
-- ============================================

CREATE INDEX idx_guild_bank_items_guild ON guild_bank_items(guild_id);
CREATE INDEX idx_guild_bank_pokemon_guild ON guild_bank_pokemon(guild_id);

-- ============================================
-- AUTO-CREATE BANK ON GUILD CREATION
-- ============================================

CREATE OR REPLACE FUNCTION create_guild_bank_on_guild_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Create currency storage
  INSERT INTO guild_bank_currency (guild_id) VALUES (NEW.id);
  -- Create slot configuration
  INSERT INTO guild_bank_slots (guild_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_guild_bank
AFTER INSERT ON guilds
FOR EACH ROW EXECUTE FUNCTION create_guild_bank_on_guild_insert();

-- ============================================
-- PERMISSION TABLES
-- ============================================

-- Per-category per-role permissions
CREATE TABLE guild_bank_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  category bank_category NOT NULL,
  role guild_role NOT NULL,
  can_deposit BOOLEAN NOT NULL DEFAULT true,
  can_withdraw BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(guild_id, category, role)
);

-- Daily withdrawal limits per role
CREATE TABLE guild_bank_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  role guild_role NOT NULL,
  category bank_category NOT NULL,
  daily_limit INT NOT NULL DEFAULT 0,
  pokemon_points_limit INT NOT NULL DEFAULT 0,
  UNIQUE(guild_id, role, category)
);

-- Individual player limit overrides
CREATE TABLE guild_bank_player_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category bank_category NOT NULL,
  custom_limit INT NOT NULL,
  set_by UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, player_id, category)
);

-- ============================================
-- TRACKING TABLES
-- ============================================

-- Track daily withdrawal usage
CREATE TABLE guild_bank_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category bank_category NOT NULL,
  amount_or_points INT NOT NULL,
  withdrawn_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member request queue
CREATE TABLE guild_bank_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  request_type bank_category NOT NULL,
  item_details JSONB NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  fulfilled_by UUID REFERENCES players(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ
);

-- Full audit trail
CREATE TABLE guild_bank_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  action bank_action NOT NULL,
  category bank_category NOT NULL,
  details JSONB NOT NULL,
  balance_after BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRACKING TABLE INDEXES
-- ============================================

CREATE INDEX idx_guild_bank_withdrawals_daily ON guild_bank_withdrawals(guild_id, player_id, category, withdrawn_at);
CREATE INDEX idx_guild_bank_requests_pending ON guild_bank_requests(guild_id, status) WHERE status = 'pending';
CREATE INDEX idx_guild_bank_logs_guild ON guild_bank_logs(guild_id, created_at DESC);
CREATE INDEX idx_guild_bank_logs_player ON guild_bank_logs(guild_id, player_id, created_at DESC);

-- ============================================
-- DEFAULT PERMISSIONS TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION create_default_bank_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default permissions for all categories and roles

  -- Currency permissions
  INSERT INTO guild_bank_permissions (guild_id, category, role, can_deposit, can_withdraw) VALUES
    (NEW.guild_id, 'currency', 'leader', true, true),
    (NEW.guild_id, 'currency', 'officer', true, true),
    (NEW.guild_id, 'currency', 'member', true, false);

  -- Item permissions
  INSERT INTO guild_bank_permissions (guild_id, category, role, can_deposit, can_withdraw) VALUES
    (NEW.guild_id, 'item', 'leader', true, true),
    (NEW.guild_id, 'item', 'officer', true, true),
    (NEW.guild_id, 'item', 'member', true, false);

  -- Pokemon permissions
  INSERT INTO guild_bank_permissions (guild_id, category, role, can_deposit, can_withdraw) VALUES
    (NEW.guild_id, 'pokemon', 'leader', true, true),
    (NEW.guild_id, 'pokemon', 'officer', true, true),
    (NEW.guild_id, 'pokemon', 'member', true, false);

  -- Insert default daily limits

  -- Leader: unlimited (-1)
  INSERT INTO guild_bank_limits (guild_id, role, category, daily_limit, pokemon_points_limit) VALUES
    (NEW.guild_id, 'leader', 'currency', -1, 0),
    (NEW.guild_id, 'leader', 'item', -1, 0),
    (NEW.guild_id, 'leader', 'pokemon', 0, -1);

  -- Officer: reasonable limits
  INSERT INTO guild_bank_limits (guild_id, role, category, daily_limit, pokemon_points_limit) VALUES
    (NEW.guild_id, 'officer', 'currency', 10000, 0),
    (NEW.guild_id, 'officer', 'item', 20, 0),
    (NEW.guild_id, 'officer', 'pokemon', 0, 20);

  -- Member: no withdrawal (must request)
  INSERT INTO guild_bank_limits (guild_id, role, category, daily_limit, pokemon_points_limit) VALUES
    (NEW.guild_id, 'member', 'currency', 0, 0),
    (NEW.guild_id, 'member', 'item', 0, 0),
    (NEW.guild_id, 'member', 'pokemon', 0, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_bank_permissions
AFTER INSERT ON guild_bank_currency
FOR EACH ROW EXECUTE FUNCTION create_default_bank_permissions();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if a player has permission for a bank action on a category
CREATE OR REPLACE FUNCTION check_bank_permission(
  p_guild_id UUID,
  p_player_id UUID,
  p_category bank_category,
  p_action TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_role guild_role;
  v_permission RECORD;
BEGIN
  -- Get player's role in the guild
  SELECT role INTO v_role
  FROM guild_members
  WHERE guild_id = p_guild_id AND player_id = p_player_id;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- Leaders always have permission
  IF v_role = 'leader' THEN
    RETURN true;
  END IF;

  -- Check permission table
  SELECT * INTO v_permission
  FROM guild_bank_permissions
  WHERE guild_id = p_guild_id AND category = p_category AND role = v_role;

  IF v_permission IS NULL THEN
    RETURN false;
  END IF;

  IF p_action = 'deposit' THEN
    RETURN v_permission.can_deposit;
  ELSIF p_action = 'withdraw' THEN
    RETURN v_permission.can_withdraw;
  END IF;

  RETURN false;
END;
$$;

-- Get remaining daily limit for a player
CREATE OR REPLACE FUNCTION get_remaining_daily_limit(
  p_guild_id UUID,
  p_player_id UUID,
  p_category bank_category
) RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_role guild_role;
  v_configured_limit INT;
  v_used_today INT;
  v_override INT;
BEGIN
  -- Get player's role in the guild
  SELECT role INTO v_role
  FROM guild_members
  WHERE guild_id = p_guild_id AND player_id = p_player_id;

  IF v_role IS NULL THEN
    RETURN 0;
  END IF;

  -- Leaders have unlimited
  IF v_role = 'leader' THEN
    RETURN -1;
  END IF;

  -- Check for player-specific override first
  SELECT custom_limit INTO v_override
  FROM guild_bank_player_overrides
  WHERE guild_id = p_guild_id AND player_id = p_player_id AND category = p_category;

  IF v_override IS NOT NULL THEN
    v_configured_limit := v_override;
  ELSE
    -- Get role-based limit
    IF p_category = 'pokemon' THEN
      SELECT pokemon_points_limit INTO v_configured_limit
      FROM guild_bank_limits
      WHERE guild_id = p_guild_id AND role = v_role AND category = p_category;
    ELSE
      SELECT daily_limit INTO v_configured_limit
      FROM guild_bank_limits
      WHERE guild_id = p_guild_id AND role = v_role AND category = p_category;
    END IF;
  END IF;

  -- Default to 0 if no limit configured
  IF v_configured_limit IS NULL THEN
    RETURN 0;
  END IF;

  -- If limit is -1 (unlimited), return -1
  IF v_configured_limit = -1 THEN
    RETURN -1;
  END IF;

  -- Calculate amount used today (since midnight UTC)
  SELECT COALESCE(SUM(amount_or_points), 0) INTO v_used_today
  FROM guild_bank_withdrawals
  WHERE guild_id = p_guild_id
    AND player_id = p_player_id
    AND category = p_category
    AND withdrawn_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC');

  RETURN GREATEST(v_configured_limit - v_used_today, 0);
END;
$$;

-- Calculate point cost for a Pokemon based on BST
CREATE OR REPLACE FUNCTION calculate_pokemon_point_cost(p_species_id INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_bst INT;
BEGIN
  SELECT base_hp + base_attack + base_defense + base_sp_attack + base_sp_defense + base_speed
  INTO v_bst
  FROM pokemon_species
  WHERE id = p_species_id;

  IF v_bst IS NULL THEN
    RETURN 1;
  END IF;

  -- BST-based tiers
  IF v_bst >= 580 THEN
    RETURN 25;  -- Legendary tier (Mewtwo, Dragonite)
  ELSIF v_bst >= 500 THEN
    RETURN 10;  -- Very Rare (Alakazam, Machamp, starters final)
  ELSIF v_bst >= 400 THEN
    RETURN 5;   -- Rare (middle evolutions, strong Pokemon)
  ELSIF v_bst >= 300 THEN
    RETURN 2;   -- Uncommon (first evolutions, Pikachu)
  ELSE
    RETURN 1;   -- Common (Rattata, Pidgey, unevolved)
  END IF;
END;
$$;

-- Calculate maximum Pokemon slots for a guild
CREATE OR REPLACE FUNCTION calculate_max_pokemon_slots(p_guild_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_slots INT;
  v_purchased_slots INT;
  v_member_count INT;
  v_total INT;
BEGIN
  -- Get slot configuration
  SELECT base_slots, purchased_slots INTO v_base_slots, v_purchased_slots
  FROM guild_bank_slots
  WHERE guild_id = p_guild_id;

  IF v_base_slots IS NULL THEN
    v_base_slots := 25;
    v_purchased_slots := 0;
  END IF;

  -- Get member count
  SELECT member_count INTO v_member_count
  FROM guilds
  WHERE id = p_guild_id;

  IF v_member_count IS NULL THEN
    v_member_count := 1;
  END IF;

  -- Calculate total: base + purchased + (2 per member)
  v_total := v_base_slots + v_purchased_slots + (v_member_count * 2);

  -- Cap at 500
  RETURN LEAST(v_total, 500);
END;
$$;

-- ============================================
-- CURRENCY MUTATION FUNCTIONS
-- ============================================

-- Deposit currency to guild bank
CREATE OR REPLACE FUNCTION guild_bank_deposit_currency(
  p_player_id UUID,
  p_guild_id UUID,
  p_amount BIGINT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_bank RECORD;
  v_player_balance BIGINT;
  v_new_balance BIGINT;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Lock member row to verify guild membership
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Check deposit permission
  IF NOT check_bank_permission(p_guild_id, p_player_id, 'currency', 'deposit') THEN
    RETURN json_build_object('success', false, 'error', 'No deposit permission');
  END IF;

  -- Lock player row and check balance
  SELECT pokedollars INTO v_player_balance
  FROM players
  WHERE id = p_player_id
  FOR UPDATE;

  IF v_player_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;

  -- Lock bank row and check capacity
  SELECT * INTO v_bank
  FROM guild_bank_currency
  WHERE guild_id = p_guild_id
  FOR UPDATE;

  IF v_bank.balance + p_amount > v_bank.max_capacity THEN
    RETURN json_build_object('success', false, 'error', 'Bank would exceed capacity');
  END IF;

  -- Execute transfer
  UPDATE players SET pokedollars = pokedollars - p_amount WHERE id = p_player_id;

  UPDATE guild_bank_currency
  SET balance = balance + p_amount
  WHERE guild_id = p_guild_id
  RETURNING balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
  VALUES (
    p_guild_id,
    p_player_id,
    'deposit',
    'currency',
    jsonb_build_object('amount', p_amount),
    v_new_balance
  );

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Withdraw currency from guild bank
CREATE OR REPLACE FUNCTION guild_bank_withdraw_currency(
  p_player_id UUID,
  p_guild_id UUID,
  p_amount BIGINT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_bank RECORD;
  v_remaining_limit INT;
  v_new_balance BIGINT;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Lock member row to verify guild membership
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Check withdraw permission
  IF NOT check_bank_permission(p_guild_id, p_player_id, 'currency', 'withdraw') THEN
    RETURN json_build_object('success', false, 'error', 'No withdraw permission');
  END IF;

  -- Check daily limit
  v_remaining_limit := get_remaining_daily_limit(p_guild_id, p_player_id, 'currency');

  IF v_remaining_limit != -1 AND p_amount > v_remaining_limit THEN
    RETURN json_build_object('success', false, 'error', 'Would exceed daily limit', 'remaining_limit', v_remaining_limit);
  END IF;

  -- Lock bank row and check balance
  SELECT * INTO v_bank
  FROM guild_bank_currency
  WHERE guild_id = p_guild_id
  FOR UPDATE;

  IF v_bank.balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient bank balance');
  END IF;

  -- Lock player row
  PERFORM id FROM players WHERE id = p_player_id FOR UPDATE;

  -- Execute transfer
  UPDATE guild_bank_currency
  SET balance = balance - p_amount
  WHERE guild_id = p_guild_id
  RETURNING balance INTO v_new_balance;

  UPDATE players SET pokedollars = pokedollars + p_amount WHERE id = p_player_id;

  -- Record withdrawal for daily tracking
  INSERT INTO guild_bank_withdrawals (guild_id, player_id, category, amount_or_points)
  VALUES (p_guild_id, p_player_id, 'currency', p_amount);

  -- Log transaction
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
  VALUES (
    p_guild_id,
    p_player_id,
    'withdraw',
    'currency',
    jsonb_build_object('amount', p_amount),
    v_new_balance
  );

  -- Calculate new remaining limit
  IF v_remaining_limit = -1 THEN
    RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'remaining_limit', -1);
  ELSE
    RETURN json_build_object('success', true, 'new_balance', v_new_balance, 'remaining_limit', v_remaining_limit - p_amount);
  END IF;
END;
$$;

-- ============================================
-- ITEM MUTATION FUNCTIONS
-- ============================================

-- Deposit item to guild bank
CREATE OR REPLACE FUNCTION guild_bank_deposit_item(
  p_player_id UUID,
  p_guild_id UUID,
  p_item_id VARCHAR(50),
  p_quantity INT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_player_item RECORD;
  v_bank_item RECORD;
  v_new_quantity INT;
BEGIN
  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Quantity must be positive');
  END IF;

  -- Lock member row to verify guild membership
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Check deposit permission
  IF NOT check_bank_permission(p_guild_id, p_player_id, 'item', 'deposit') THEN
    RETURN json_build_object('success', false, 'error', 'No deposit permission');
  END IF;

  -- Lock player inventory row and check quantity
  SELECT * INTO v_player_item
  FROM inventory
  WHERE player_id = p_player_id AND item_id = p_item_id
  FOR UPDATE;

  IF v_player_item IS NULL OR v_player_item.quantity < p_quantity THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient items');
  END IF;

  -- Lock or get bank item row
  SELECT * INTO v_bank_item
  FROM guild_bank_items
  WHERE guild_id = p_guild_id AND item_id = p_item_id
  FOR UPDATE;

  -- Check stack limit
  IF v_bank_item IS NOT NULL AND v_bank_item.quantity + p_quantity > 99 THEN
    RETURN json_build_object('success', false, 'error', 'Would exceed stack limit of 99');
  END IF;

  -- Deduct from player inventory
  IF v_player_item.quantity = p_quantity THEN
    DELETE FROM inventory WHERE player_id = p_player_id AND item_id = p_item_id;
  ELSE
    UPDATE inventory
    SET quantity = quantity - p_quantity
    WHERE player_id = p_player_id AND item_id = p_item_id;
  END IF;

  -- Add to bank (upsert)
  INSERT INTO guild_bank_items (guild_id, item_id, quantity, deposited_by, last_updated)
  VALUES (p_guild_id, p_item_id, p_quantity, p_player_id, NOW())
  ON CONFLICT (guild_id, item_id) DO UPDATE SET
    quantity = guild_bank_items.quantity + p_quantity,
    deposited_by = p_player_id,
    last_updated = NOW()
  RETURNING quantity INTO v_new_quantity;

  -- Log transaction
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
  VALUES (
    p_guild_id,
    p_player_id,
    'deposit',
    'item',
    jsonb_build_object('item_id', p_item_id, 'quantity', p_quantity)
  );

  RETURN json_build_object('success', true, 'bank_quantity', v_new_quantity);
END;
$$;

-- Withdraw item from guild bank
CREATE OR REPLACE FUNCTION guild_bank_withdraw_item(
  p_player_id UUID,
  p_guild_id UUID,
  p_item_id VARCHAR(50),
  p_quantity INT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_bank_item RECORD;
  v_remaining_limit INT;
  v_new_bank_quantity INT;
BEGIN
  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Quantity must be positive');
  END IF;

  -- Lock member row to verify guild membership
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Check withdraw permission
  IF NOT check_bank_permission(p_guild_id, p_player_id, 'item', 'withdraw') THEN
    RETURN json_build_object('success', false, 'error', 'No withdraw permission');
  END IF;

  -- Check daily limit (count of items)
  v_remaining_limit := get_remaining_daily_limit(p_guild_id, p_player_id, 'item');

  IF v_remaining_limit != -1 AND p_quantity > v_remaining_limit THEN
    RETURN json_build_object('success', false, 'error', 'Would exceed daily limit', 'remaining_limit', v_remaining_limit);
  END IF;

  -- Lock bank item row and check quantity
  SELECT * INTO v_bank_item
  FROM guild_bank_items
  WHERE guild_id = p_guild_id AND item_id = p_item_id
  FOR UPDATE;

  IF v_bank_item IS NULL OR v_bank_item.quantity < p_quantity THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient items in bank');
  END IF;

  -- Deduct from bank
  IF v_bank_item.quantity = p_quantity THEN
    DELETE FROM guild_bank_items WHERE guild_id = p_guild_id AND item_id = p_item_id;
    v_new_bank_quantity := 0;
  ELSE
    UPDATE guild_bank_items
    SET quantity = quantity - p_quantity, last_updated = NOW()
    WHERE guild_id = p_guild_id AND item_id = p_item_id
    RETURNING quantity INTO v_new_bank_quantity;
  END IF;

  -- Add to player inventory (upsert)
  INSERT INTO inventory (player_id, item_id, quantity)
  VALUES (p_player_id, p_item_id, p_quantity)
  ON CONFLICT (player_id, item_id) DO UPDATE SET
    quantity = inventory.quantity + p_quantity;

  -- Record withdrawal for daily tracking
  INSERT INTO guild_bank_withdrawals (guild_id, player_id, category, amount_or_points)
  VALUES (p_guild_id, p_player_id, 'item', p_quantity);

  -- Log transaction
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
  VALUES (
    p_guild_id,
    p_player_id,
    'withdraw',
    'item',
    jsonb_build_object('item_id', p_item_id, 'quantity', p_quantity)
  );

  -- Calculate new remaining limit
  IF v_remaining_limit = -1 THEN
    RETURN json_build_object('success', true, 'bank_quantity', v_new_bank_quantity, 'remaining_limit', -1);
  ELSE
    RETURN json_build_object('success', true, 'bank_quantity', v_new_bank_quantity, 'remaining_limit', v_remaining_limit - p_quantity);
  END IF;
END;
$$;

-- ============================================
-- POKEMON MUTATION FUNCTIONS
-- ============================================

-- Deposit Pokemon to guild bank
CREATE OR REPLACE FUNCTION guild_bank_deposit_pokemon(
  p_player_id UUID,
  p_guild_id UUID,
  p_pokemon_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_pokemon RECORD;
  v_max_slots INT;
  v_used_slots INT;
  v_next_slot INT;
BEGIN
  -- Lock member row to verify guild membership
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Check deposit permission
  IF NOT check_bank_permission(p_guild_id, p_player_id, 'pokemon', 'deposit') THEN
    RETURN json_build_object('success', false, 'error', 'No deposit permission');
  END IF;

  -- Lock Pokemon row and verify ownership
  SELECT * INTO v_pokemon
  FROM pokemon
  WHERE id = p_pokemon_id
  FOR UPDATE;

  IF v_pokemon IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pokemon not found');
  END IF;

  IF v_pokemon.owner_id != p_player_id THEN
    RETURN json_build_object('success', false, 'error', 'You do not own this Pokemon');
  END IF;

  IF v_pokemon.party_slot IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Cannot deposit Pokemon that is in party');
  END IF;

  -- Check slot capacity
  v_max_slots := calculate_max_pokemon_slots(p_guild_id);

  SELECT COUNT(*) INTO v_used_slots
  FROM guild_bank_pokemon
  WHERE guild_id = p_guild_id;

  IF v_used_slots >= v_max_slots THEN
    RETURN json_build_object('success', false, 'error', 'Guild bank Pokemon storage is full');
  END IF;

  -- Find next available slot
  SELECT COALESCE(MIN(slot), 0) + 1 INTO v_next_slot
  FROM generate_series(1, v_max_slots) AS slot
  WHERE slot NOT IN (SELECT gbp.slot FROM guild_bank_pokemon gbp WHERE gbp.guild_id = p_guild_id);

  -- Clear Pokemon ownership (but keep in pokemon table)
  UPDATE pokemon
  SET owner_id = NULL
  WHERE id = p_pokemon_id;

  -- Add to guild bank
  INSERT INTO guild_bank_pokemon (guild_id, pokemon_id, slot, deposited_by)
  VALUES (p_guild_id, p_pokemon_id, v_next_slot, p_player_id);

  -- Log transaction
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
  VALUES (
    p_guild_id,
    p_player_id,
    'deposit',
    'pokemon',
    jsonb_build_object(
      'pokemon_id', p_pokemon_id,
      'species_id', v_pokemon.species_id,
      'nickname', v_pokemon.nickname,
      'level', v_pokemon.level,
      'is_shiny', v_pokemon.is_shiny,
      'slot', v_next_slot
    )
  );

  RETURN json_build_object('success', true, 'slot', v_next_slot);
END;
$$;

-- Withdraw Pokemon from guild bank
CREATE OR REPLACE FUNCTION guild_bank_withdraw_pokemon(
  p_player_id UUID,
  p_guild_id UUID,
  p_pokemon_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_bank_pokemon RECORD;
  v_pokemon RECORD;
  v_point_cost INT;
  v_remaining_points INT;
BEGIN
  -- Lock member row to verify guild membership
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Check withdraw permission
  IF NOT check_bank_permission(p_guild_id, p_player_id, 'pokemon', 'withdraw') THEN
    RETURN json_build_object('success', false, 'error', 'No withdraw permission');
  END IF;

  -- Lock bank Pokemon entry
  SELECT * INTO v_bank_pokemon
  FROM guild_bank_pokemon
  WHERE guild_id = p_guild_id AND pokemon_id = p_pokemon_id
  FOR UPDATE;

  IF v_bank_pokemon IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pokemon not in guild bank');
  END IF;

  -- Lock Pokemon row
  SELECT * INTO v_pokemon
  FROM pokemon
  WHERE id = p_pokemon_id
  FOR UPDATE;

  IF v_pokemon IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Pokemon not found');
  END IF;

  -- Calculate point cost
  v_point_cost := calculate_pokemon_point_cost(v_pokemon.species_id);

  -- Check daily points limit
  v_remaining_points := get_remaining_daily_limit(p_guild_id, p_player_id, 'pokemon');

  IF v_remaining_points != -1 AND v_point_cost > v_remaining_points THEN
    RETURN json_build_object('success', false, 'error', 'Would exceed daily points limit', 'remaining_points', v_remaining_points, 'point_cost', v_point_cost);
  END IF;

  -- Transfer Pokemon ownership back to player
  UPDATE pokemon
  SET owner_id = p_player_id
  WHERE id = p_pokemon_id;

  -- Remove from guild bank
  DELETE FROM guild_bank_pokemon
  WHERE guild_id = p_guild_id AND pokemon_id = p_pokemon_id;

  -- Record withdrawal for daily tracking
  INSERT INTO guild_bank_withdrawals (guild_id, player_id, category, amount_or_points)
  VALUES (p_guild_id, p_player_id, 'pokemon', v_point_cost);

  -- Log transaction
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
  VALUES (
    p_guild_id,
    p_player_id,
    'withdraw',
    'pokemon',
    jsonb_build_object(
      'pokemon_id', p_pokemon_id,
      'species_id', v_pokemon.species_id,
      'nickname', v_pokemon.nickname,
      'level', v_pokemon.level,
      'is_shiny', v_pokemon.is_shiny,
      'point_cost', v_point_cost
    )
  );

  -- Calculate new remaining points
  IF v_remaining_points = -1 THEN
    RETURN json_build_object('success', true, 'remaining_points', -1);
  ELSE
    RETURN json_build_object('success', true, 'remaining_points', v_remaining_points - v_point_cost);
  END IF;
END;
$$;

-- ============================================
-- REQUEST FUNCTIONS
-- ============================================

-- Create a bank request
CREATE OR REPLACE FUNCTION guild_bank_create_request(
  p_player_id UUID,
  p_guild_id UUID,
  p_type bank_category,
  p_details JSONB,
  p_note TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_request_id UUID;
BEGIN
  -- Verify membership
  SELECT * INTO v_member
  FROM guild_members
  WHERE player_id = p_player_id AND guild_id = p_guild_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Clean up expired requests opportunistically
  UPDATE guild_bank_requests
  SET status = 'expired'
  WHERE guild_id = p_guild_id
    AND status = 'pending'
    AND expires_at < NOW();

  -- Create request
  INSERT INTO guild_bank_requests (guild_id, player_id, request_type, item_details, note)
  VALUES (p_guild_id, p_player_id, p_type, p_details, p_note)
  RETURNING id INTO v_request_id;

  -- Log request creation
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
  VALUES (
    p_guild_id,
    p_player_id,
    'request_created',
    p_type,
    jsonb_build_object('request_id', v_request_id, 'details', p_details, 'note', p_note)
  );

  RETURN json_build_object('success', true, 'request_id', v_request_id);
END;
$$;

-- Fulfill a bank request
CREATE OR REPLACE FUNCTION guild_bank_fulfill_request(
  p_fulfiller_id UUID,
  p_guild_id UUID,
  p_request_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fulfiller RECORD;
  v_request RECORD;
  v_result JSON;
BEGIN
  -- Verify fulfiller membership and withdraw permission
  SELECT gm.*, g.id as guild_id INTO v_fulfiller
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_fulfiller_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_fulfiller IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Lock request row
  SELECT * INTO v_request
  FROM guild_bank_requests
  WHERE id = p_request_id AND guild_id = p_guild_id
  FOR UPDATE;

  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Request is no longer pending');
  END IF;

  IF v_request.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE guild_bank_requests SET status = 'expired' WHERE id = p_request_id;
    RETURN json_build_object('success', false, 'error', 'Request has expired');
  END IF;

  -- Check fulfiller has withdraw permission for this category
  IF NOT check_bank_permission(p_guild_id, p_fulfiller_id, v_request.request_type, 'withdraw') THEN
    RETURN json_build_object('success', false, 'error', 'No withdraw permission');
  END IF;

  -- Execute the appropriate withdrawal based on request type
  IF v_request.request_type = 'currency' THEN
    v_result := guild_bank_withdraw_currency(
      v_request.player_id,
      p_guild_id,
      (v_request.item_details->>'amount')::BIGINT
    );
  ELSIF v_request.request_type = 'item' THEN
    v_result := guild_bank_withdraw_item(
      v_request.player_id,
      p_guild_id,
      v_request.item_details->>'item_id',
      (v_request.item_details->>'quantity')::INT
    );
  ELSIF v_request.request_type = 'pokemon' THEN
    v_result := guild_bank_withdraw_pokemon(
      v_request.player_id,
      p_guild_id,
      (v_request.item_details->>'pokemon_id')::UUID
    );
  END IF;

  -- Check if withdrawal succeeded
  IF NOT (v_result->>'success')::BOOLEAN THEN
    RETURN v_result;
  END IF;

  -- Mark request as fulfilled
  UPDATE guild_bank_requests
  SET status = 'fulfilled', fulfilled_by = p_fulfiller_id, fulfilled_at = NOW()
  WHERE id = p_request_id;

  -- Log fulfillment
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
  VALUES (
    p_guild_id,
    p_fulfiller_id,
    'request_fulfilled',
    v_request.request_type,
    jsonb_build_object(
      'request_id', p_request_id,
      'requester_id', v_request.player_id,
      'details', v_request.item_details
    )
  );

  RETURN json_build_object('success', true);
END;
$$;

-- Cancel a bank request
CREATE OR REPLACE FUNCTION guild_bank_cancel_request(
  p_player_id UUID,
  p_request_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Lock request row and verify ownership
  SELECT * INTO v_request
  FROM guild_bank_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_request.player_id != p_player_id THEN
    RETURN json_build_object('success', false, 'error', 'You can only cancel your own requests');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Request is no longer pending');
  END IF;

  -- Update status
  UPDATE guild_bank_requests
  SET status = 'cancelled'
  WHERE id = p_request_id;

  -- Log cancellation
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details)
  VALUES (
    v_request.guild_id,
    p_player_id,
    'request_cancelled',
    v_request.request_type,
    jsonb_build_object('request_id', p_request_id)
  );

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================
-- SLOT EXPANSION FUNCTION
-- ============================================

-- Expand Pokemon slots (leader only)
CREATE OR REPLACE FUNCTION guild_bank_expand_pokemon_slots(
  p_player_id UUID,
  p_guild_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_bank RECORD;
  v_slots RECORD;
  v_new_total INT;
  v_new_price BIGINT;
BEGIN
  -- Verify player is leader
  SELECT gm.*, g.id as guild_id INTO v_member
  FROM guild_members gm
  JOIN guilds g ON g.id = gm.guild_id
  WHERE gm.player_id = p_player_id AND gm.guild_id = p_guild_id
  FOR UPDATE OF gm;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_member.role != 'leader' THEN
    RETURN json_build_object('success', false, 'error', 'Only the leader can expand bank slots');
  END IF;

  -- Lock bank currency and slots
  SELECT * INTO v_bank
  FROM guild_bank_currency
  WHERE guild_id = p_guild_id
  FOR UPDATE;

  SELECT * INTO v_slots
  FROM guild_bank_slots
  WHERE guild_id = p_guild_id
  FOR UPDATE;

  -- Check current total won't exceed 500 after expansion
  v_new_total := calculate_max_pokemon_slots(p_guild_id) + 10;
  IF v_new_total > 500 THEN
    RETURN json_build_object('success', false, 'error', 'Maximum slot limit (500) reached');
  END IF;

  -- Check sufficient balance
  IF v_bank.balance < v_slots.next_expansion_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient bank balance', 'required', v_slots.next_expansion_price, 'available', v_bank.balance);
  END IF;

  -- Deduct currency
  UPDATE guild_bank_currency
  SET balance = balance - v_slots.next_expansion_price
  WHERE guild_id = p_guild_id;

  -- Calculate new price (double it)
  v_new_price := v_slots.next_expansion_price * 2;

  -- Add slots
  UPDATE guild_bank_slots
  SET purchased_slots = purchased_slots + 10,
      next_expansion_price = v_new_price
  WHERE guild_id = p_guild_id;

  -- Log transaction
  INSERT INTO guild_bank_logs (guild_id, player_id, action, category, details, balance_after)
  VALUES (
    p_guild_id,
    p_player_id,
    'withdraw',
    'currency',
    jsonb_build_object(
      'type', 'slot_expansion',
      'slots_added', 10,
      'cost', v_slots.next_expansion_price,
      'new_total_purchased', v_slots.purchased_slots + 10
    ),
    v_bank.balance - v_slots.next_expansion_price
  );

  RETURN json_build_object(
    'success', true,
    'new_total_slots', calculate_max_pokemon_slots(p_guild_id),
    'next_price', v_new_price
  );
END;
$$;

-- ============================================
-- QUERY FUNCTIONS
-- ============================================

-- Get complete guild bank state
CREATE OR REPLACE FUNCTION get_guild_bank(
  p_player_id UUID,
  p_guild_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_currency RECORD;
  v_slots RECORD;
  v_items JSON;
  v_pokemon JSON;
  v_permissions JSON;
  v_limits JSON;
  v_my_limits JSON;
BEGIN
  -- Verify membership
  SELECT * INTO v_member
  FROM guild_members
  WHERE player_id = p_player_id AND guild_id = p_guild_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  -- Get currency
  SELECT * INTO v_currency
  FROM guild_bank_currency
  WHERE guild_id = p_guild_id;

  -- Get slots
  SELECT * INTO v_slots
  FROM guild_bank_slots
  WHERE guild_id = p_guild_id;

  -- Get items with depositor info
  SELECT json_agg(item_row) INTO v_items
  FROM (
    SELECT
      gbi.item_id,
      gbi.quantity,
      gbi.deposited_by,
      p.username as deposited_by_username,
      gbi.last_updated
    FROM guild_bank_items gbi
    LEFT JOIN players p ON p.id = gbi.deposited_by
    WHERE gbi.guild_id = p_guild_id
    ORDER BY gbi.item_id
  ) item_row;

  -- Get Pokemon with species info and point cost
  SELECT json_agg(pokemon_row) INTO v_pokemon
  FROM (
    SELECT
      gbp.id,
      gbp.pokemon_id,
      gbp.slot,
      pk.species_id,
      ps.name as species_name,
      pk.nickname,
      pk.level,
      pk.is_shiny,
      calculate_pokemon_point_cost(pk.species_id) as point_cost,
      gbp.deposited_by,
      p.username as deposited_by_username,
      gbp.deposited_at
    FROM guild_bank_pokemon gbp
    JOIN pokemon pk ON pk.id = gbp.pokemon_id
    JOIN pokemon_species ps ON ps.id = pk.species_id
    LEFT JOIN players p ON p.id = gbp.deposited_by
    WHERE gbp.guild_id = p_guild_id
    ORDER BY gbp.slot
  ) pokemon_row;

  -- Get permissions
  SELECT json_agg(perm_row) INTO v_permissions
  FROM (
    SELECT category::TEXT, role::TEXT, can_deposit, can_withdraw
    FROM guild_bank_permissions
    WHERE guild_id = p_guild_id
    ORDER BY category, role
  ) perm_row;

  -- Get limits
  SELECT json_agg(limit_row) INTO v_limits
  FROM (
    SELECT role::TEXT, category::TEXT, daily_limit, pokemon_points_limit
    FROM guild_bank_limits
    WHERE guild_id = p_guild_id
    ORDER BY role, category
  ) limit_row;

  -- Calculate my remaining limits
  v_my_limits := json_build_object(
    'currency', get_remaining_daily_limit(p_guild_id, p_player_id, 'currency'),
    'items', get_remaining_daily_limit(p_guild_id, p_player_id, 'item'),
    'pokemon_points', get_remaining_daily_limit(p_guild_id, p_player_id, 'pokemon')
  );

  RETURN json_build_object(
    'success', true,
    'currency', json_build_object(
      'balance', v_currency.balance,
      'max_capacity', v_currency.max_capacity
    ),
    'items', COALESCE(v_items, '[]'::JSON),
    'pokemon', COALESCE(v_pokemon, '[]'::JSON),
    'pokemon_slots', json_build_object(
      'used', (SELECT COUNT(*) FROM guild_bank_pokemon WHERE guild_id = p_guild_id),
      'max', calculate_max_pokemon_slots(p_guild_id),
      'base', v_slots.base_slots,
      'purchased', v_slots.purchased_slots,
      'next_expansion_price', v_slots.next_expansion_price
    ),
    'permissions', COALESCE(v_permissions, '[]'::JSON),
    'limits', COALESCE(v_limits, '[]'::JSON),
    'my_limits', v_my_limits
  );
END;
$$;

-- Get remaining daily limits for a player
CREATE OR REPLACE FUNCTION get_bank_daily_limits(
  p_player_id UUID,
  p_guild_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Verify membership
  SELECT * INTO v_member
  FROM guild_members
  WHERE player_id = p_player_id AND guild_id = p_guild_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  RETURN json_build_object(
    'success', true,
    'currency', get_remaining_daily_limit(p_guild_id, p_player_id, 'currency'),
    'items', get_remaining_daily_limit(p_guild_id, p_player_id, 'item'),
    'pokemon_points', get_remaining_daily_limit(p_guild_id, p_player_id, 'pokemon')
  );
END;
$$;

-- Get bank requests
CREATE OR REPLACE FUNCTION get_bank_requests(
  p_guild_id UUID,
  p_include_expired BOOLEAN DEFAULT false
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requests JSON;
BEGIN
  SELECT json_agg(request_row) INTO v_requests
  FROM (
    SELECT
      r.id,
      r.player_id,
      p.username as player_username,
      r.request_type::TEXT,
      r.item_details,
      r.status::TEXT,
      r.note,
      r.created_at,
      r.expires_at,
      r.fulfilled_by,
      fp.username as fulfilled_by_username,
      r.fulfilled_at
    FROM guild_bank_requests r
    JOIN players p ON p.id = r.player_id
    LEFT JOIN players fp ON fp.id = r.fulfilled_by
    WHERE r.guild_id = p_guild_id
      AND (p_include_expired OR (r.status = 'pending' AND r.expires_at > NOW()))
    ORDER BY r.created_at DESC
  ) request_row;

  RETURN json_build_object(
    'success', true,
    'requests', COALESCE(v_requests, '[]'::JSON)
  );
END;
$$;

-- Get bank logs with filtering and pagination
CREATE OR REPLACE FUNCTION get_bank_logs(
  p_player_id UUID,
  p_guild_id UUID,
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 50,
  p_filter_player UUID DEFAULT NULL,
  p_filter_action TEXT DEFAULT NULL,
  p_filter_category TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_logs JSON;
  v_total INT;
  v_offset INT;
BEGIN
  -- Verify membership and get role
  SELECT * INTO v_member
  FROM guild_members
  WHERE player_id = p_player_id AND guild_id = p_guild_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  v_offset := (p_page - 1) * p_limit;

  -- Count total matching logs
  SELECT COUNT(*) INTO v_total
  FROM guild_bank_logs l
  WHERE l.guild_id = p_guild_id
    AND (v_member.role IN ('leader', 'officer') OR l.player_id = p_player_id)
    AND (p_filter_player IS NULL OR l.player_id = p_filter_player)
    AND (p_filter_action IS NULL OR l.action::TEXT = p_filter_action)
    AND (p_filter_category IS NULL OR l.category::TEXT = p_filter_category);

  -- Get paginated logs
  SELECT json_agg(log_row) INTO v_logs
  FROM (
    SELECT
      l.id,
      l.player_id,
      p.username as player_username,
      l.action::TEXT,
      l.category::TEXT,
      l.details,
      l.balance_after,
      l.created_at
    FROM guild_bank_logs l
    LEFT JOIN players p ON p.id = l.player_id
    WHERE l.guild_id = p_guild_id
      AND (v_member.role IN ('leader', 'officer') OR l.player_id = p_player_id)
      AND (p_filter_player IS NULL OR l.player_id = p_filter_player)
      AND (p_filter_action IS NULL OR l.action::TEXT = p_filter_action)
      AND (p_filter_category IS NULL OR l.category::TEXT = p_filter_category)
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET v_offset
  ) log_row;

  RETURN json_build_object(
    'success', true,
    'logs', COALESCE(v_logs, '[]'::JSON),
    'total', v_total
  );
END;
$$;

-- ============================================
-- PERMISSION CONFIGURATION FUNCTIONS (LEADER ONLY)
-- ============================================

-- Set bank permission for a role and category
CREATE OR REPLACE FUNCTION set_bank_permission(
  p_player_id UUID,
  p_guild_id UUID,
  p_category TEXT,
  p_role TEXT,
  p_can_deposit BOOLEAN,
  p_can_withdraw BOOLEAN
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Verify player is leader
  SELECT * INTO v_member
  FROM guild_members
  WHERE player_id = p_player_id AND guild_id = p_guild_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_member.role != 'leader' THEN
    RETURN json_build_object('success', false, 'error', 'Only the leader can modify permissions');
  END IF;

  -- Validate category and role
  IF p_category NOT IN ('currency', 'item', 'pokemon') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid category');
  END IF;

  IF p_role NOT IN ('leader', 'officer', 'member') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;

  -- Upsert permission
  INSERT INTO guild_bank_permissions (guild_id, category, role, can_deposit, can_withdraw)
  VALUES (p_guild_id, p_category::bank_category, p_role::guild_role, p_can_deposit, p_can_withdraw)
  ON CONFLICT (guild_id, category, role) DO UPDATE SET
    can_deposit = p_can_deposit,
    can_withdraw = p_can_withdraw;

  RETURN json_build_object('success', true);
END;
$$;

-- Set daily limit for a role and category
CREATE OR REPLACE FUNCTION set_bank_limit(
  p_player_id UUID,
  p_guild_id UUID,
  p_role TEXT,
  p_category TEXT,
  p_daily_limit INT,
  p_pokemon_points_limit INT DEFAULT 0
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Verify player is leader
  SELECT * INTO v_member
  FROM guild_members
  WHERE player_id = p_player_id AND guild_id = p_guild_id;

  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_member.role != 'leader' THEN
    RETURN json_build_object('success', false, 'error', 'Only the leader can modify limits');
  END IF;

  -- Validate role and category
  IF p_role NOT IN ('leader', 'officer', 'member') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;

  IF p_category NOT IN ('currency', 'item', 'pokemon') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid category');
  END IF;

  -- Upsert limit
  INSERT INTO guild_bank_limits (guild_id, role, category, daily_limit, pokemon_points_limit)
  VALUES (p_guild_id, p_role::guild_role, p_category::bank_category, p_daily_limit, p_pokemon_points_limit)
  ON CONFLICT (guild_id, role, category) DO UPDATE SET
    daily_limit = p_daily_limit,
    pokemon_points_limit = p_pokemon_points_limit;

  RETURN json_build_object('success', true);
END;
$$;

-- Set player-specific limit override
CREATE OR REPLACE FUNCTION set_player_bank_override(
  p_setter_id UUID,
  p_guild_id UUID,
  p_target_player_id UUID,
  p_category TEXT,
  p_custom_limit INT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_setter RECORD;
  v_target RECORD;
BEGIN
  -- Verify setter is leader
  SELECT * INTO v_setter
  FROM guild_members
  WHERE player_id = p_setter_id AND guild_id = p_guild_id;

  IF v_setter IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_setter.role != 'leader' THEN
    RETURN json_build_object('success', false, 'error', 'Only the leader can set player overrides');
  END IF;

  -- Verify target is in same guild
  SELECT * INTO v_target
  FROM guild_members
  WHERE player_id = p_target_player_id AND guild_id = p_guild_id;

  IF v_target IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Target player is not in your guild');
  END IF;

  -- Validate category
  IF p_category NOT IN ('currency', 'item', 'pokemon') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid category');
  END IF;

  -- Upsert override
  INSERT INTO guild_bank_player_overrides (guild_id, player_id, category, custom_limit, set_by)
  VALUES (p_guild_id, p_target_player_id, p_category::bank_category, p_custom_limit, p_setter_id)
  ON CONFLICT (guild_id, player_id, category) DO UPDATE SET
    custom_limit = p_custom_limit,
    set_by = p_setter_id,
    created_at = NOW();

  RETURN json_build_object('success', true);
END;
$$;

-- Remove player-specific limit override
CREATE OR REPLACE FUNCTION remove_player_bank_override(
  p_remover_id UUID,
  p_guild_id UUID,
  p_target_player_id UUID,
  p_category TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remover RECORD;
BEGIN
  -- Verify remover is leader
  SELECT * INTO v_remover
  FROM guild_members
  WHERE player_id = p_remover_id AND guild_id = p_guild_id;

  IF v_remover IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a guild member');
  END IF;

  IF v_remover.role != 'leader' THEN
    RETURN json_build_object('success', false, 'error', 'Only the leader can remove player overrides');
  END IF;

  -- Validate category
  IF p_category NOT IN ('currency', 'item', 'pokemon') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid category');
  END IF;

  -- Delete override
  DELETE FROM guild_bank_player_overrides
  WHERE guild_id = p_guild_id
    AND player_id = p_target_player_id
    AND category = p_category::bank_category;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all bank tables
ALTER TABLE guild_bank_currency ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_player_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_bank_logs ENABLE ROW LEVEL SECURITY;

-- Currency table policies
CREATE POLICY "Guild members can view bank currency"
  ON guild_bank_currency FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct currency insert"
  ON guild_bank_currency FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct currency update"
  ON guild_bank_currency FOR UPDATE
  USING (false);

CREATE POLICY "No direct currency delete"
  ON guild_bank_currency FOR DELETE
  USING (false);

-- Items table policies
CREATE POLICY "Guild members can view bank items"
  ON guild_bank_items FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct items insert"
  ON guild_bank_items FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct items update"
  ON guild_bank_items FOR UPDATE
  USING (false);

CREATE POLICY "No direct items delete"
  ON guild_bank_items FOR DELETE
  USING (false);

-- Pokemon table policies
CREATE POLICY "Guild members can view bank pokemon"
  ON guild_bank_pokemon FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct pokemon insert"
  ON guild_bank_pokemon FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct pokemon update"
  ON guild_bank_pokemon FOR UPDATE
  USING (false);

CREATE POLICY "No direct pokemon delete"
  ON guild_bank_pokemon FOR DELETE
  USING (false);

-- Slots table policies
CREATE POLICY "Guild members can view bank slots"
  ON guild_bank_slots FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct slots insert"
  ON guild_bank_slots FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct slots update"
  ON guild_bank_slots FOR UPDATE
  USING (false);

CREATE POLICY "No direct slots delete"
  ON guild_bank_slots FOR DELETE
  USING (false);

-- Permissions table policies
CREATE POLICY "Guild members can view bank permissions"
  ON guild_bank_permissions FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct permissions insert"
  ON guild_bank_permissions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct permissions update"
  ON guild_bank_permissions FOR UPDATE
  USING (false);

CREATE POLICY "No direct permissions delete"
  ON guild_bank_permissions FOR DELETE
  USING (false);

-- Limits table policies
CREATE POLICY "Guild members can view bank limits"
  ON guild_bank_limits FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct limits insert"
  ON guild_bank_limits FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct limits update"
  ON guild_bank_limits FOR UPDATE
  USING (false);

CREATE POLICY "No direct limits delete"
  ON guild_bank_limits FOR DELETE
  USING (false);

-- Player overrides table policies
CREATE POLICY "Guild members can view their own overrides"
  ON guild_bank_player_overrides FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid() AND gm.role IN ('leader', 'officer')
    )
  );

CREATE POLICY "No direct overrides insert"
  ON guild_bank_player_overrides FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct overrides update"
  ON guild_bank_player_overrides FOR UPDATE
  USING (false);

CREATE POLICY "No direct overrides delete"
  ON guild_bank_player_overrides FOR DELETE
  USING (false);

-- Withdrawals table policies
CREATE POLICY "Guild members can view withdrawals"
  ON guild_bank_withdrawals FOR SELECT
  USING (
    -- Leaders/Officers see all, members see only their own
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid() AND gm.role IN ('leader', 'officer')
    )
    OR
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "No direct withdrawals insert"
  ON guild_bank_withdrawals FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct withdrawals update"
  ON guild_bank_withdrawals FOR UPDATE
  USING (false);

CREATE POLICY "No direct withdrawals delete"
  ON guild_bank_withdrawals FOR DELETE
  USING (false);

-- Requests table policies
CREATE POLICY "Guild members can view requests"
  ON guild_bank_requests FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct requests insert"
  ON guild_bank_requests FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct requests update"
  ON guild_bank_requests FOR UPDATE
  USING (false);

CREATE POLICY "No direct requests delete"
  ON guild_bank_requests FOR DELETE
  USING (false);

-- Logs table policies (role-based visibility)
CREATE POLICY "Guild members can view logs"
  ON guild_bank_logs FOR SELECT
  USING (
    guild_id IN (
      SELECT gm.guild_id FROM guild_members gm
      JOIN players p ON p.id = gm.player_id
      WHERE p.user_id = auth.uid()
    )
    AND (
      -- Leaders and officers see all logs
      EXISTS (
        SELECT 1 FROM guild_members gm
        JOIN players p ON p.id = gm.player_id
        WHERE p.user_id = auth.uid()
          AND gm.guild_id = guild_bank_logs.guild_id
          AND gm.role IN ('leader', 'officer')
      )
      OR
      -- Members see only their own logs
      player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "No direct logs insert"
  ON guild_bank_logs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct logs update"
  ON guild_bank_logs FOR UPDATE
  USING (false);

CREATE POLICY "No direct logs delete"
  ON guild_bank_logs FOR DELETE
  USING (false);
