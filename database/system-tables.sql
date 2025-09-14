-- System tables for MarcoLand

-- System logs for tracking important events
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_system_logs_event_type ON system_logs(event_type);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- Player sessions for tracking activity
CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT
);

-- Index for session queries
CREATE INDEX idx_player_sessions_player ON player_sessions(player_id);
CREATE INDEX idx_player_sessions_started ON player_sessions(started_at DESC);

-- PvP attack tracking (for daily limits)
CREATE TABLE IF NOT EXISTS pvp_attacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attacker_id UUID REFERENCES players(id) ON DELETE CASCADE,
    defender_id UUID REFERENCES players(id) ON DELETE CASCADE,
    attack_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attacker_id, defender_id, attack_date)
);

-- Index for PvP queries
CREATE INDEX idx_pvp_attacks_attacker_date ON pvp_attacks(attacker_id, attack_date);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Game configuration (for dynamic settings)
CREATE TABLE IF NOT EXISTS game_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES admin_users(id)
);

-- Insert default configuration
INSERT INTO game_config (key, value, description) VALUES
    ('mana_regeneration_hours', '6', 'Hours between mana regeneration cycles'),
    ('pvp_daily_attacks', '10', 'Maximum PvP attacks per day'),
    ('starting_gold', '100', 'Gold given to new players'),
    ('starting_mana', '53', 'Mana given to level 1 players'),
    ('maintenance_mode', 'false', 'Enable/disable maintenance mode')
ON CONFLICT (key) DO NOTHING;