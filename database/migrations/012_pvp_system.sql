-- Migration 012: PvP System
-- Add PvP mana, battles, protection, and stats

-- Add PvP mana to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS pvp_mana INTEGER DEFAULT 5;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_pvp_mana_regen TIMESTAMP DEFAULT NOW();

-- Create PvP battles table
CREATE TABLE IF NOT EXISTS pvp_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attacker_id UUID REFERENCES players(id) NOT NULL,
    defender_id UUID REFERENCES players(id) NOT NULL,
    
    -- Combat details
    attacker_damage INTEGER NOT NULL,
    defender_health_before INTEGER NOT NULL,
    defender_health_after INTEGER NOT NULL,
    intelligence_modifier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    
    -- Resource changes (capped at 5%)
    gold_stolen INTEGER DEFAULT 0,
    gems_stolen INTEGER DEFAULT 0,
    metals_stolen INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    is_kill BOOLEAN DEFAULT FALSE
);

-- Create indexes for PvP battles
CREATE INDEX IF NOT EXISTS idx_pvp_battles_attacker_time ON pvp_battles(attacker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_defender_time ON pvp_battles(defender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pvp_battles_recent ON pvp_battles(created_at DESC);

-- Create PvP protection table
CREATE TABLE IF NOT EXISTS pvp_protection (
    player_id UUID PRIMARY KEY REFERENCES players(id),
    protected_until TIMESTAMP NOT NULL,
    last_attacker_id UUID REFERENCES players(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for protection lookups
CREATE INDEX IF NOT EXISTS idx_pvp_protection_until ON pvp_protection(protected_until);

-- Add PvP stats to player_stats table
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS pvp_kills INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS pvp_deaths INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS pvp_damage_dealt BIGINT DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS pvp_damage_taken BIGINT DEFAULT 0;