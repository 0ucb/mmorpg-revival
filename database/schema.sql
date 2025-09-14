-- MMORPG Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table (linked to Supabase auth.users)
CREATE TABLE players (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(50),
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 50,
    max_mana INTEGER DEFAULT 50,
    magic_points INTEGER DEFAULT 5,
    max_magic_points INTEGER DEFAULT 5,
    gold INTEGER DEFAULT 100,
    metals INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    location_x INTEGER DEFAULT 0,
    location_y INTEGER DEFAULT 0,
    current_map VARCHAR(50) DEFAULT 'spawn',
    class VARCHAR(20) DEFAULT 'warrior',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player stats
CREATE TABLE player_stats (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    strength DECIMAL(6,3) DEFAULT 10.000,
    speed DECIMAL(6,3) DEFAULT 10.000,
    intelligence DECIMAL(6,3) DEFAULT 10.000,
    stat_points INTEGER DEFAULT 0
);

-- Equipment System Tables

-- Weapons have unique properties
CREATE TABLE weapons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    damage_min INTEGER NOT NULL,
    damage_max INTEGER NOT NULL,
    strength_required INTEGER DEFAULT 0,
    cost_gold INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Armor organized by slot
CREATE TABLE armor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    slot VARCHAR NOT NULL CHECK (slot IN ('head', 'body', 'legs', 'hands', 'feet')),
    protection INTEGER NOT NULL DEFAULT 0,
    encumbrance INTEGER NOT NULL DEFAULT 0,
    strength_required INTEGER DEFAULT 0,
    cost_gold INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Single row per player, NULL means slot empty
CREATE TABLE player_equipped (
    player_id UUID PRIMARY KEY REFERENCES players(id),
    weapon_id UUID REFERENCES weapons(id),
    head_id UUID REFERENCES armor(id),
    body_id UUID REFERENCES armor(id),
    legs_id UUID REFERENCES armor(id),
    hands_id UUID REFERENCES armor(id),
    feet_id UUID REFERENCES armor(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Player's unequipped items (inventory)
CREATE TABLE player_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id),
    weapon_id UUID REFERENCES weapons(id),
    armor_id UUID REFERENCES armor(id),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_single_item CHECK (
        (weapon_id IS NOT NULL AND armor_id IS NULL) OR
        (weapon_id IS NULL AND armor_id IS NOT NULL)
    )
);

-- Cached combat stats for performance
CREATE TABLE player_combat_stats (
    player_id UUID PRIMARY KEY REFERENCES players(id),
    total_protection INTEGER DEFAULT 0,
    total_encumbrance INTEGER DEFAULT 0,
    speed_modifier DECIMAL(3,2) DEFAULT 1.00,
    weapon_damage_min INTEGER DEFAULT 0,
    weapon_damage_max INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Quests
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level_requirement INTEGER DEFAULT 1,
    reward_experience INTEGER DEFAULT 0,
    reward_gold INTEGER DEFAULT 0,
    reward_items JSONB,
    objectives JSONB, -- flexible quest objectives
    is_repeatable BOOLEAN DEFAULT false
);

-- Player quest progress
CREATE TABLE player_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES quests(id),
    status VARCHAR(20) DEFAULT 'active', -- active, completed, abandoned
    progress JSONB, -- flexible progress tracking
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Monsters/NPCs
CREATE TABLE creatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    creature_type VARCHAR(30) NOT NULL, -- monster, npc, boss
    level INTEGER DEFAULT 1,
    health INTEGER DEFAULT 100,
    damage INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,
    experience_reward INTEGER DEFAULT 10,
    gold_reward INTEGER DEFAULT 5,
    loot_table JSONB, -- items and drop rates
    respawn_time INTEGER DEFAULT 60, -- seconds
    location_x INTEGER,
    location_y INTEGER,
    map VARCHAR(50)
);

-- Combat logs
CREATE TABLE combat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attacker_id UUID REFERENCES players(id) ON DELETE CASCADE,
    defender_id UUID, -- could be player or creature
    defender_type VARCHAR(20), -- player or creature
    damage_dealt INTEGER,
    combat_type VARCHAR(20), -- pvp, pve
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    channel VARCHAR(20) DEFAULT 'global', -- global, party, guild, whisper
    message TEXT NOT NULL,
    recipient_id UUID, -- for whispers
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guilds/Clans
CREATE TABLE guilds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    tag VARCHAR(5) UNIQUE,
    description TEXT,
    leader_id UUID REFERENCES players(id),
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guild members
CREATE TABLE guild_members (
    guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    rank VARCHAR(20) DEFAULT 'member', -- leader, officer, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (guild_id, player_id)
);

-- Friends list
CREATE TABLE friends (
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES players(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (player_id, friend_id)
);

-- Market/Trading (Future: equipment trading)
CREATE TABLE market_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES players(id) ON DELETE CASCADE,
    weapon_id UUID REFERENCES weapons(id),
    armor_id UUID REFERENCES armor(id),
    quantity INTEGER DEFAULT 1,
    price INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, sold, cancelled
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sold_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_single_market_item CHECK (
        (weapon_id IS NOT NULL AND armor_id IS NULL) OR
        (weapon_id IS NULL AND armor_id IS NOT NULL)
    )
);

-- Row Level Security Policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_equipped ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_combat_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you'll need to refine these based on your game rules)
CREATE POLICY "Players can view their own profile" ON players
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Players can update their own profile" ON players
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Players can view other players' public info" ON players
    FOR SELECT USING (true);

CREATE POLICY "Players can manage their own inventory" ON player_inventory
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Players can manage their own equipment" ON player_equipped
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Players can view their own combat stats" ON player_combat_stats
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Players can view weapons" ON weapons
    FOR SELECT USING (true);

CREATE POLICY "Players can view armor" ON armor
    FOR SELECT USING (true);

CREATE POLICY "Players can view their own quests" ON player_quests
    FOR ALL USING (auth.uid() = player_id);

-- Indexes for performance
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_location ON players(current_map, location_x, location_y);
CREATE INDEX idx_player_inventory_player ON player_inventory(player_id);
CREATE INDEX idx_player_equipped_player ON player_equipped(player_id);
CREATE INDEX idx_weapons_cost ON weapons(cost_gold);
CREATE INDEX idx_armor_slot_cost ON armor(slot, cost_gold);
CREATE INDEX idx_combat_logs_timestamp ON combat_logs(timestamp);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_market_listings_status ON market_listings(status);