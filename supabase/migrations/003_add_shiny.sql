-- Add shiny column to pokemon table
ALTER TABLE pokemon ADD COLUMN IF NOT EXISTS is_shiny BOOLEAN DEFAULT false;

-- Update existing pokemon to not be shiny (explicit default)
UPDATE pokemon SET is_shiny = false WHERE is_shiny IS NULL;
