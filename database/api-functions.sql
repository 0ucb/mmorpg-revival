-- Database functions for API operations
-- These can be called directly via Supabase's auto-generated API or through custom endpoints

-- Get player profile with stats
CREATE OR REPLACE FUNCTION get_player_profile(player_username VARCHAR)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'player', row_to_json(p.*),
            'stats', row_to_json(ps.*),
            'guild', row_to_json(g.*)
        )
        FROM players p
        LEFT JOIN player_stats ps ON p.id = ps.player_id
        LEFT JOIN guild_members gm ON p.id = gm.player_id
        LEFT JOIN guilds g ON gm.guild_id = g.id
        WHERE p.username = player_username
    );
END;
$$ LANGUAGE plpgsql;

-- Get player inventory with item details
CREATE OR REPLACE FUNCTION get_player_inventory(player_username VARCHAR)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'slot', inv.slot_position,
                'quantity', inv.quantity,
                'equipped', inv.is_equipped,
                'item', row_to_json(i.*)
            )
        )
        FROM players p
        JOIN inventory inv ON p.id = inv.player_id
        JOIN items i ON inv.item_id = i.id
        WHERE p.username = player_username
    );
END;
$$ LANGUAGE plpgsql;

-- Execute player action (move, attack, use item, etc.)
CREATE OR REPLACE FUNCTION execute_player_action(
    player_id_param UUID,
    action_type VARCHAR,
    action_data JSONB
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    CASE action_type
        WHEN 'move' THEN
            UPDATE players 
            SET location_x = (action_data->>'x')::INTEGER,
                location_y = (action_data->>'y')::INTEGER,
                current_map = COALESCE(action_data->>'map', current_map),
                last_active = NOW()
            WHERE id = player_id_param;
            
            result := json_build_object('success', true, 'action', 'move');
            
        WHEN 'attack' THEN
            -- Combat logic here
            INSERT INTO combat_logs (attacker_id, defender_id, defender_type, damage_dealt, combat_type)
            VALUES (
                player_id_param,
                (action_data->>'target_id')::UUID,
                action_data->>'target_type',
                (action_data->>'damage')::INTEGER,
                action_data->>'combat_type'
            );
            
            result := json_build_object('success', true, 'action', 'attack');
            
        WHEN 'use_item' THEN
            -- Item usage logic
            result := json_build_object('success', true, 'action', 'use_item');
            
        WHEN 'trade' THEN
            -- Trading logic
            result := json_build_object('success', true, 'action', 'trade');
            
        ELSE
            result := json_build_object('success', false, 'error', 'Unknown action');
    END CASE;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
    sort_by VARCHAR DEFAULT 'level',
    limit_count INTEGER DEFAULT 100
)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'rank', row_number() OVER (ORDER BY 
                    CASE sort_by 
                        WHEN 'level' THEN level 
                        WHEN 'gold' THEN gold
                        WHEN 'experience' THEN experience
                        ELSE level 
                    END DESC
                ),
                'username', username,
                'display_name', display_name,
                'level', level,
                'class', class,
                'guild', g.name,
                'experience', experience,
                'gold', gold
            )
        )
        FROM (
            SELECT p.*, g.name
            FROM players p
            LEFT JOIN guild_members gm ON p.id = gm.player_id
            LEFT JOIN guilds g ON gm.guild_id = g.id
            ORDER BY 
                CASE sort_by 
                    WHEN 'level' THEN level 
                    WHEN 'gold' THEN gold
                    WHEN 'experience' THEN experience
                    ELSE level 
                END DESC
            LIMIT limit_count
        ) AS ranked_players
    );
END;
$$ LANGUAGE plpgsql;

-- Get active quests for player
CREATE OR REPLACE FUNCTION get_player_quests(player_username VARCHAR)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'quest', row_to_json(q.*),
                'progress', pq.progress,
                'status', pq.status,
                'started_at', pq.started_at
            )
        )
        FROM players p
        JOIN player_quests pq ON p.id = pq.player_id
        JOIN quests q ON pq.quest_id = q.id
        WHERE p.username = player_username
        AND pq.status = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- Get market listings
CREATE OR REPLACE FUNCTION get_market_listings(
    item_type VARCHAR DEFAULT NULL,
    max_price INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'listing_id', ml.id,
                'item', row_to_json(i.*),
                'quantity', ml.quantity,
                'price', ml.price,
                'seller', p.username,
                'listed_at', ml.listed_at
            )
        )
        FROM market_listings ml
        JOIN items i ON ml.item_id = i.id
        JOIN players p ON ml.seller_id = p.id
        WHERE ml.status = 'active'
        AND (item_type IS NULL OR i.item_type = item_type)
        AND (max_price IS NULL OR ml.price <= max_price)
        ORDER BY ml.listed_at DESC
    );
END;
$$ LANGUAGE plpgsql;