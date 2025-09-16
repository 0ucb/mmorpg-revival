-- Add quartz currency to players table
-- Quartz is used for high-level creature summoning (worth 1M+ gold)

ALTER TABLE players 
ADD COLUMN quartz INTEGER DEFAULT 0 CHECK (quartz >= 0);

-- Update existing players to have 0 quartz
UPDATE players SET quartz = 0 WHERE quartz IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN players.quartz IS 'Rare crystal currency for creature summoning spells - extremely valuable (1M+ gold equivalent)';