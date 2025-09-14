-- Row Level Security Policies for MarcoLand

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Players can view all player profiles" ON players;
DROP POLICY IF EXISTS "Players can update their own profile" ON players;
DROP POLICY IF EXISTS "Service role can manage all players" ON players;
DROP POLICY IF EXISTS "Players can view their own stats" ON player_stats;
DROP POLICY IF EXISTS "Players can view other players stats" ON player_stats;
DROP POLICY IF EXISTS "Service role can manage all stats" ON player_stats;
DROP POLICY IF EXISTS "Players can manage their own inventory" ON inventory;
DROP POLICY IF EXISTS "Service role can manage all inventory" ON inventory;
DROP POLICY IF EXISTS "Players can view their own quests" ON player_quests;
DROP POLICY IF EXISTS "Service role can manage all quests" ON player_quests;

-- PLAYERS table policies
CREATE POLICY "Players can view all player profiles" ON players
    FOR SELECT USING (true);

CREATE POLICY "Players can update their own profile" ON players
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all players" ON players
    FOR ALL USING (auth.role() = 'service_role');

-- PLAYER_STATS table policies  
CREATE POLICY "Players can view their own stats" ON player_stats
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Players can view other players stats" ON player_stats
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage all stats" ON player_stats
    FOR ALL USING (auth.role() = 'service_role');

-- INVENTORY table policies
CREATE POLICY "Players can manage their own inventory" ON inventory
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Service role can manage all inventory" ON inventory
    FOR ALL USING (auth.role() = 'service_role');

-- PLAYER_QUESTS table policies
CREATE POLICY "Players can view their own quests" ON player_quests
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Service role can manage all quests" ON player_quests
    FOR ALL USING (auth.role() = 'service_role');

-- COMBAT_LOGS table policies
CREATE POLICY "Players can view their own combat logs" ON combat_logs
    FOR SELECT USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

CREATE POLICY "Players can insert combat logs" ON combat_logs
    FOR INSERT WITH CHECK (auth.uid() = attacker_id);

CREATE POLICY "Service role can manage all combat logs" ON combat_logs
    FOR ALL USING (auth.role() = 'service_role');

-- CHAT_MESSAGES table policies
CREATE POLICY "Players can view public chat" ON chat_messages
    FOR SELECT USING (
        channel = 'global' OR 
        auth.uid() = player_id OR 
        auth.uid() = recipient_id OR
        channel = 'guild' AND EXISTS (
            SELECT 1 FROM guild_members 
            WHERE guild_members.player_id = auth.uid() 
            AND guild_members.guild_id IN (
                SELECT guild_id FROM guild_members 
                WHERE guild_members.player_id = chat_messages.player_id
            )
        )
    );

CREATE POLICY "Players can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Service role can manage all messages" ON chat_messages
    FOR ALL USING (auth.role() = 'service_role');

-- GUILD_MEMBERS table policies
CREATE POLICY "Anyone can view guild members" ON guild_members
    FOR SELECT USING (true);

CREATE POLICY "Guild members can manage membership" ON guild_members
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Service role can manage all guilds" ON guild_members
    FOR ALL USING (auth.role() = 'service_role');

-- FRIENDS table policies
CREATE POLICY "Players can view their own friends" ON friends
    FOR SELECT USING (auth.uid() = player_id OR auth.uid() = friend_id);

CREATE POLICY "Players can manage their friend requests" ON friends
    FOR ALL USING (auth.uid() = player_id OR auth.uid() = friend_id);

CREATE POLICY "Service role can manage all friends" ON friends
    FOR ALL USING (auth.role() = 'service_role');

-- MARKET_LISTINGS table policies
CREATE POLICY "Anyone can view active listings" ON market_listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Players can manage their own listings" ON market_listings
    FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Service role can manage all listings" ON market_listings
    FOR ALL USING (auth.role() = 'service_role');

-- Items, Quests, Creatures tables (read-only for players)
CREATE POLICY "Anyone can view items" ON items
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view quests" ON quests
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view creatures" ON creatures
    FOR SELECT USING (true);

-- Only service role can modify game content
CREATE POLICY "Service role can manage items" ON items
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage quests" ON quests
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage creatures" ON creatures
    FOR ALL USING (auth.role() = 'service_role');