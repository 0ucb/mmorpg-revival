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
    gold INTEGER DEFAULT 100,
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
    strength INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 10,
    agility INTEGER DEFAULT 10,
    intelligence INTEGER DEFAULT 10,
    luck INTEGER DEFAULT 5,
    stat_points INTEGER DEFAULT 0
);

-- Items/Equipment table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    item_type VARCHAR(30) NOT NULL, -- weapon, armor, consumable, quest, misc
    rarity VARCHAR(20) DEFAULT 'common', -- common, uncommon, rare, epic, legendary
    level_requirement INTEGER DEFAULT 1,
    stats JSONB, -- flexible stats storage
    icon_url TEXT,
    stackable BOOLEAN DEFAULT false,
    max_stack INTEGER DEFAULT 1
);

-- Player inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    quantity INTEGER DEFAULT 1,
    slot_position INTEGER,
    is_equipped BOOLEAN DEFAULT false,
    UNIQUE(player_id, slot_position)
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

-- Market/Trading
CREATE TABLE market_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES players(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    quantity INTEGER DEFAULT 1,
    price INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, sold, cancelled
    listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sold_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security Policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Players can manage their own inventory" ON inventory
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Players can view their own quests" ON player_quests
    FOR ALL USING (auth.uid() = player_id);

-- Indexes for performance
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_location ON players(current_map, location_x, location_y);
CREATE INDEX idx_inventory_player ON inventory(player_id);
CREATE INDEX idx_combat_logs_timestamp ON combat_logs(timestamp);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_market_listings_status ON market_listings(status);