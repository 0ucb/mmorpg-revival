-- Migration: Add Equipment System to MarcoLand MMORPG
-- Run this in Supabase SQL Editor to add the equipment system

-- First, check if equipment tables already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weapons') THEN
        -- Add speed column to player_stats if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_stats' AND column_name = 'speed') THEN
            ALTER TABLE player_stats ADD COLUMN speed DECIMAL(6,3) DEFAULT 10.000;
        END IF;

        -- Remove old columns from player_stats if they exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_stats' AND column_name = 'agility') THEN
            ALTER TABLE player_stats DROP COLUMN agility;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_stats' AND column_name = 'luck') THEN
            ALTER TABLE player_stats DROP COLUMN luck;
        END IF;

        -- Add new columns to players table if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'magic_points') THEN
            ALTER TABLE players ADD COLUMN magic_points INTEGER DEFAULT 5;
            ALTER TABLE players ADD COLUMN max_magic_points INTEGER DEFAULT 5;
            ALTER TABLE players ADD COLUMN metals INTEGER DEFAULT 0;
            ALTER TABLE players ADD COLUMN gems INTEGER DEFAULT 0;
        END IF;

        -- Create equipment tables
        CREATE TABLE weapons (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL UNIQUE,
            damage_min INTEGER NOT NULL,
            damage_max INTEGER NOT NULL,
            strength_required INTEGER DEFAULT 0,
            cost_gold INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );

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

        CREATE TABLE player_combat_stats (
            player_id UUID PRIMARY KEY REFERENCES players(id),
            total_protection INTEGER DEFAULT 0,
            total_encumbrance INTEGER DEFAULT 0,
            speed_modifier DECIMAL(3,2) DEFAULT 1.00,
            weapon_damage_min INTEGER DEFAULT 0,
            weapon_damage_max INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Add RLS policies
        ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;
        ALTER TABLE player_equipped ENABLE ROW LEVEL SECURITY;
        ALTER TABLE player_combat_stats ENABLE ROW LEVEL SECURITY;

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

        -- Add indexes
        CREATE INDEX idx_player_inventory_player ON player_inventory(player_id);
        CREATE INDEX idx_player_equipped_player ON player_equipped(player_id);
        CREATE INDEX idx_weapons_cost ON weapons(cost_gold);
        CREATE INDEX idx_armor_slot_cost ON armor(slot, cost_gold);

        RAISE NOTICE 'Equipment system tables created successfully!';
    ELSE
        RAISE NOTICE 'Equipment tables already exist, skipping table creation.';
    END IF;
END $$;

-- Always add/update the equipment functions
-- (These will overwrite existing functions if they exist)-- Equipment System Database Functions
-- These functions provide atomic operations for equipment management

-- Atomic equipment purchase with gold validation
CREATE OR REPLACE FUNCTION purchase_equipment(
    p_player_id UUID,
    p_weapon_id UUID DEFAULT NULL,
    p_armor_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_cost INTEGER;
    v_player_gold INTEGER;
    v_strength_required INTEGER;
    v_player_strength DECIMAL(6,3);
BEGIN
    -- Validate input - exactly one item must be specified
    IF (p_weapon_id IS NULL AND p_armor_id IS NULL) OR 
       (p_weapon_id IS NOT NULL AND p_armor_id IS NOT NULL) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Must specify exactly one weapon or armor piece');
    END IF;
    
    -- Get equipment cost and strength requirement
    IF p_weapon_id IS NOT NULL THEN
        SELECT cost_gold, strength_required INTO v_cost, v_strength_required 
        FROM weapons WHERE id = p_weapon_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Weapon not found');
        END IF;
    ELSE
        SELECT cost_gold, strength_required INTO v_cost, v_strength_required 
        FROM armor WHERE id = p_armor_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Armor not found');
        END IF;
    END IF;
    
    -- Get player gold and strength (with row lock for atomic operation)
    SELECT p.gold, ps.strength INTO v_player_gold, v_player_strength 
    FROM players p
    JOIN player_stats ps ON p.id = ps.player_id
    WHERE p.id = p_player_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Player not found');
    END IF;
    
    -- Check if player has enough gold
    IF v_player_gold < v_cost THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Insufficient gold',
            'required', v_cost,
            'available', v_player_gold
        );
    END IF;
    
    -- Check if player meets strength requirement
    IF v_player_strength < v_strength_required THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Insufficient strength',
            'required', v_strength_required,
            'available', v_player_strength
        );
    END IF;
    
    -- Deduct gold and add item to inventory
    UPDATE players SET gold = gold - v_cost WHERE id = p_player_id;
    
    INSERT INTO player_inventory (player_id, weapon_id, armor_id) 
    VALUES (p_player_id, p_weapon_id, p_armor_id);
    
    RETURN jsonb_build_object(
        'success', true, 
        'remaining_gold', v_player_gold - v_cost,
        'item_cost', v_cost
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update player combat stats cache
CREATE OR REPLACE FUNCTION update_combat_stats(p_player_id UUID) 
RETURNS VOID AS $$
DECLARE
    v_equipped RECORD;
    v_player_speed DECIMAL(6,3);
    v_total_protection INTEGER := 0;
    v_total_encumbrance INTEGER := 0;
    v_speed_modifier DECIMAL(3,2);
    v_weapon_damage_min INTEGER := 0;
    v_weapon_damage_max INTEGER := 0;
BEGIN
    -- Get player's speed stat
    SELECT speed INTO v_player_speed 
    FROM player_stats 
    WHERE player_id = p_player_id;
    
    -- Get all equipped items
    SELECT 
        w.damage_min, w.damage_max,
        COALESCE(h.protection, 0) + COALESCE(b.protection, 0) + COALESCE(l.protection, 0) + 
        COALESCE(ha.protection, 0) + COALESCE(f.protection, 0) as total_protection,
        COALESCE(h.encumbrance, 0) + COALESCE(b.encumbrance, 0) + COALESCE(l.encumbrance, 0) + 
        COALESCE(ha.encumbrance, 0) + COALESCE(f.encumbrance, 0) as total_encumbrance
    INTO v_equipped
    FROM player_equipped pe
    LEFT JOIN weapons w ON pe.weapon_id = w.id
    LEFT JOIN armor h ON pe.head_id = h.id
    LEFT JOIN armor b ON pe.body_id = b.id  
    LEFT JOIN armor l ON pe.legs_id = l.id
    LEFT JOIN armor ha ON pe.hands_id = ha.id
    LEFT JOIN armor f ON pe.feet_id = f.id
    WHERE pe.player_id = p_player_id;
    
    -- Set values from equipped items
    IF v_equipped IS NOT NULL THEN
        v_total_protection := COALESCE(v_equipped.total_protection, 0);
        v_total_encumbrance := COALESCE(v_equipped.total_encumbrance, 0);
        v_weapon_damage_min := COALESCE(v_equipped.damage_min, 0);
        v_weapon_damage_max := COALESCE(v_equipped.damage_max, 0);
    END IF;
    
    -- Calculate speed modifier using MarcoLand formula
    IF v_total_encumbrance = 0 THEN
        v_speed_modifier := 1.00;
    ELSIF v_total_encumbrance >= v_player_speed THEN
        v_speed_modifier := 0.50; -- Minimum 50% speed
    ELSE
        v_speed_modifier := 1.00 - (0.50 * (v_total_encumbrance / v_player_speed));
    END IF;
    
    -- Update or insert combat stats
    INSERT INTO player_combat_stats (
        player_id, 
        total_protection, 
        total_encumbrance, 
        speed_modifier,
        weapon_damage_min,
        weapon_damage_max,
        updated_at
    ) VALUES (
        p_player_id,
        v_total_protection,
        v_total_encumbrance,
        v_speed_modifier,
        v_weapon_damage_min,
        v_weapon_damage_max,
        NOW()
    )
    ON CONFLICT (player_id) 
    DO UPDATE SET
        total_protection = EXCLUDED.total_protection,
        total_encumbrance = EXCLUDED.total_encumbrance,
        speed_modifier = EXCLUDED.speed_modifier,
        weapon_damage_min = EXCLUDED.weapon_damage_min,
        weapon_damage_max = EXCLUDED.weapon_damage_max,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Function to equip an item (atomic operation)
CREATE OR REPLACE FUNCTION equip_item(
    p_player_id UUID,
    p_item_id UUID,
    p_item_type VARCHAR, -- 'weapon' or 'armor'
    p_slot VARCHAR DEFAULT NULL -- for armor: 'head', 'body', 'legs', 'hands', 'feet'
) RETURNS JSONB AS $$
DECLARE
    v_inventory_record RECORD;
    v_item_record RECORD;
    v_player_strength DECIMAL(6,3);
    v_current_encumbrance INTEGER;
    v_new_encumbrance INTEGER;
    v_column_name VARCHAR;
    v_old_item_id UUID;
BEGIN
    -- Validate item type
    IF p_item_type NOT IN ('weapon', 'armor') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid item type');
    END IF;
    
    -- Get player strength
    SELECT strength INTO v_player_strength 
    FROM player_stats 
    WHERE player_id = p_player_id;
    
    -- Check if player owns the item
    IF p_item_type = 'weapon' THEN
        SELECT * INTO v_inventory_record
        FROM player_inventory 
        WHERE player_id = p_player_id AND weapon_id = p_item_id;
        
        SELECT * INTO v_item_record 
        FROM weapons WHERE id = p_item_id;
        
        v_column_name := 'weapon_id';
    ELSE
        SELECT * INTO v_inventory_record
        FROM player_inventory 
        WHERE player_id = p_player_id AND armor_id = p_item_id;
        
        SELECT * INTO v_item_record 
        FROM armor WHERE id = p_item_id;
        
        -- Validate slot for armor
        IF p_slot IS NULL OR p_slot NOT IN ('head', 'body', 'legs', 'hands', 'feet') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Invalid armor slot');
        END IF;
        
        -- Check if armor fits in the specified slot
        IF v_item_record.slot != p_slot THEN
            RETURN jsonb_build_object('success', false, 'error', 'Armor does not fit in specified slot');
        END IF;
        
        v_column_name := p_slot || '_id';
    END IF;
    
    -- Check ownership
    IF v_inventory_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Item not owned by player');
    END IF;
    
    -- Check strength requirement  
    IF v_player_strength < v_item_record.strength_required THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Insufficient strength to equip',
            'required', v_item_record.strength_required,
            'available', v_player_strength
        );
    END IF;
    
    -- For armor, check total encumbrance limit
    IF p_item_type = 'armor' THEN
        -- Get current total encumbrance (excluding the slot we're equipping to)
        SELECT COALESCE(
            CASE WHEN p_slot != 'head' THEN h.encumbrance ELSE 0 END +
            CASE WHEN p_slot != 'body' THEN b.encumbrance ELSE 0 END +
            CASE WHEN p_slot != 'legs' THEN l.encumbrance ELSE 0 END +
            CASE WHEN p_slot != 'hands' THEN ha.encumbrance ELSE 0 END +
            CASE WHEN p_slot != 'feet' THEN f.encumbrance ELSE 0 END, 0
        ) INTO v_current_encumbrance
        FROM player_equipped pe
        LEFT JOIN armor h ON pe.head_id = h.id
        LEFT JOIN armor b ON pe.body_id = b.id
        LEFT JOIN armor l ON pe.legs_id = l.id
        LEFT JOIN armor ha ON pe.hands_id = ha.id
        LEFT JOIN armor f ON pe.feet_id = f.id
        WHERE pe.player_id = p_player_id;
        
        v_new_encumbrance := COALESCE(v_current_encumbrance, 0) + v_item_record.encumbrance;
        
        -- Check if total encumbrance would exceed strength
        IF v_new_encumbrance > v_player_strength THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'Total encumbrance would exceed strength',
                'current_encumbrance', v_current_encumbrance,
                'item_encumbrance', v_item_record.encumbrance,
                'player_strength', v_player_strength
            );
        END IF;
    END IF;
    
    -- Get currently equipped item in this slot (if any)
    EXECUTE format('SELECT %I FROM player_equipped WHERE player_id = $1', v_column_name)
    USING p_player_id INTO v_old_item_id;
    
    -- Move old item to inventory (if exists)
    IF v_old_item_id IS NOT NULL THEN
        IF p_item_type = 'weapon' THEN
            INSERT INTO player_inventory (player_id, weapon_id) 
            VALUES (p_player_id, v_old_item_id);
        ELSE
            INSERT INTO player_inventory (player_id, armor_id) 
            VALUES (p_player_id, v_old_item_id);
        END IF;
    END IF;
    
    -- Equip new item
    INSERT INTO player_equipped (player_id) 
    VALUES (p_player_id) 
    ON CONFLICT (player_id) DO NOTHING;
    
    EXECUTE format('UPDATE player_equipped SET %I = $1, updated_at = NOW() WHERE player_id = $2', v_column_name)
    USING p_item_id, p_player_id;
    
    -- Remove new item from inventory
    DELETE FROM player_inventory WHERE id = v_inventory_record.id;
    
    -- Update combat stats cache
    PERFORM update_combat_stats(p_player_id);
    
    RETURN jsonb_build_object('success', true, 'message', 'Item equipped successfully');
END;
$$ LANGUAGE plpgsql;

-- Function to unequip an item
CREATE OR REPLACE FUNCTION unequip_item(
    p_player_id UUID,
    p_slot VARCHAR -- 'weapon', 'head', 'body', 'legs', 'hands', 'feet'
) RETURNS JSONB AS $$
DECLARE
    v_column_name VARCHAR;
    v_item_id UUID;
    v_item_type VARCHAR;
BEGIN
    -- Validate slot
    IF p_slot NOT IN ('weapon', 'head', 'body', 'legs', 'hands', 'feet') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid slot');
    END IF;
    
    v_column_name := p_slot || '_id';
    v_item_type := CASE WHEN p_slot = 'weapon' THEN 'weapon' ELSE 'armor' END;
    
    -- Get currently equipped item
    EXECUTE format('SELECT %I FROM player_equipped WHERE player_id = $1', v_column_name)
    USING p_player_id INTO v_item_id;
    
    IF v_item_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No item equipped in slot');
    END IF;
    
    -- Move item to inventory
    IF v_item_type = 'weapon' THEN
        INSERT INTO player_inventory (player_id, weapon_id) 
        VALUES (p_player_id, v_item_id);
    ELSE
        INSERT INTO player_inventory (player_id, armor_id) 
        VALUES (p_player_id, v_item_id);
    END IF;
    
    -- Unequip item
    EXECUTE format('UPDATE player_equipped SET %I = NULL, updated_at = NOW() WHERE player_id = $1', v_column_name)
    USING p_player_id;
    
    -- Update combat stats cache
    PERFORM update_combat_stats(p_player_id);
    
    RETURN jsonb_build_object('success', true, 'message', 'Item unequipped successfully');
END;
$$ LANGUAGE plpgsql;