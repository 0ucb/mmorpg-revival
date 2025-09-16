-- PvP Battle Transaction Function
-- Ensures atomic updates for all PvP battle operations

CREATE OR REPLACE FUNCTION execute_pvp_battle(
    p_attacker_id UUID,
    p_defender_id UUID,
    p_attacker_damage INTEGER,
    p_defender_health_before INTEGER,
    p_defender_health_after INTEGER,
    p_intelligence_modifier DECIMAL(3,2),
    p_gold_stolen INTEGER,
    p_gems_stolen INTEGER,
    p_metals_stolen INTEGER,
    p_is_kill BOOLEAN,
    p_attacker_pvp_mana_after INTEGER,
    p_attacker_gold_after INTEGER,
    p_attacker_gems_after INTEGER,
    p_attacker_metals_after INTEGER,
    p_defender_gold_after INTEGER,
    p_defender_gems_after INTEGER,
    p_defender_metals_after INTEGER,
    p_protection_until TIMESTAMP
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_battle_id UUID;
    v_result JSON;
BEGIN
    -- Generate battle ID
    v_battle_id := gen_random_uuid();
    
    -- Start transaction (already in function context)
    
    -- 1. Update attacker
    UPDATE players 
    SET 
        pvp_mana = p_attacker_pvp_mana_after,
        gold = p_attacker_gold_after,
        gems = p_attacker_gems_after,
        metals = p_attacker_metals_after,
        last_active = NOW()
    WHERE id = p_attacker_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attacker not found: %', p_attacker_id;
    END IF;
    
    -- 2. Update defender
    UPDATE players 
    SET 
        health = p_defender_health_after,
        gold = p_defender_gold_after,
        gems = p_defender_gems_after,
        metals = p_defender_metals_after,
        last_active = NOW()
    WHERE id = p_defender_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Defender not found: %', p_defender_id;
    END IF;
    
    -- 3. Update attacker PvP stats
    UPDATE player_stats 
    SET 
        pvp_damage_dealt = pvp_damage_dealt + p_attacker_damage,
        pvp_kills = CASE WHEN p_is_kill THEN pvp_kills + 1 ELSE pvp_kills END
    WHERE player_id = p_attacker_id;
    
    -- 4. Update defender PvP stats
    UPDATE player_stats 
    SET 
        pvp_damage_taken = pvp_damage_taken + p_attacker_damage,
        pvp_deaths = CASE WHEN p_is_kill THEN pvp_deaths + 1 ELSE pvp_deaths END
    WHERE player_id = p_defender_id;
    
    -- 5. Insert battle record
    INSERT INTO pvp_battles (
        id,
        attacker_id,
        defender_id,
        attacker_damage,
        defender_health_before,
        defender_health_after,
        intelligence_modifier,
        gold_stolen,
        gems_stolen,
        metals_stolen,
        is_kill,
        created_at
    ) VALUES (
        v_battle_id,
        p_attacker_id,
        p_defender_id,
        p_attacker_damage,
        p_defender_health_before,
        p_defender_health_after,
        p_intelligence_modifier,
        p_gold_stolen,
        p_gems_stolen,
        p_metals_stolen,
        p_is_kill,
        NOW()
    );
    
    -- 6. Create/update protection for defender
    INSERT INTO pvp_protection (
        player_id,
        protected_until,
        last_attacker_id,
        updated_at
    ) VALUES (
        p_defender_id,
        p_protection_until,
        p_attacker_id,
        NOW()
    )
    ON CONFLICT (player_id) DO UPDATE SET
        protected_until = EXCLUDED.protected_until,
        last_attacker_id = EXCLUDED.last_attacker_id,
        updated_at = EXCLUDED.updated_at;
    
    -- Build success response
    v_result := json_build_object(
        'success', true,
        'battle_id', v_battle_id,
        'attacker_id', p_attacker_id,
        'defender_id', p_defender_id,
        'damage', p_attacker_damage,
        'is_kill', p_is_kill,
        'resources_stolen', json_build_object(
            'gold', p_gold_stolen,
            'gems', p_gems_stolen,
            'metals', p_metals_stolen
        ),
        'protection_until', p_protection_until
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- PostgreSQL automatically rolls back function on exception
        RAISE EXCEPTION 'PvP battle transaction failed: %', SQLERRM;
END;
$$;