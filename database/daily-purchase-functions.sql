-- Daily Purchase System Functions
-- Handles gems store, voting, and mana tree daily limits

-- Function to check if a daily purchase is within limits
CREATE OR REPLACE FUNCTION check_daily_limit(
    p_player_id UUID,
    p_purchase_type VARCHAR(20),
    p_quantity INTEGER,
    p_daily_limit INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_purchases INTEGER;
BEGIN
    SELECT COALESCE(quantity, 0) INTO current_purchases
    FROM player_daily_purchases
    WHERE player_id = p_player_id 
      AND purchase_type = p_purchase_type
      AND purchase_date = CURRENT_DATE;
    
    RETURN (current_purchases + p_quantity) <= p_daily_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to process a daily purchase with limit enforcement
CREATE OR REPLACE FUNCTION process_daily_purchase(
    p_player_id UUID,
    p_purchase_type VARCHAR(20),
    p_quantity INTEGER,
    p_cost_per_unit INTEGER,
    p_daily_limit INTEGER
) RETURNS JSON AS $$
DECLARE
    total_cost INTEGER;
    player_gold INTEGER;
    current_purchases INTEGER;
    result JSON;
BEGIN
    -- Calculate total cost
    total_cost := p_quantity * p_cost_per_unit;
    
    -- Check daily limit
    IF NOT check_daily_limit(p_player_id, p_purchase_type, p_quantity, p_daily_limit) THEN
        RETURN json_build_object('success', false, 'error', 'Daily purchase limit exceeded');
    END IF;
    
    -- Check player gold
    SELECT gold INTO player_gold FROM players WHERE id = p_player_id;
    IF player_gold < total_cost THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient gold');
    END IF;
    
    -- Process purchase (deduct gold)
    UPDATE players SET gold = gold - total_cost WHERE id = p_player_id;
    
    -- Update daily tracking (insert or update)
    INSERT INTO player_daily_purchases (player_id, purchase_type, quantity, gold_spent)
    VALUES (p_player_id, p_purchase_type, p_quantity, total_cost)
    ON CONFLICT (player_id, purchase_type, purchase_date)
    DO UPDATE SET 
        quantity = player_daily_purchases.quantity + p_quantity,
        gold_spent = player_daily_purchases.gold_spent + total_cost;
    
    RETURN json_build_object(
        'success', true, 
        'remaining_gold', player_gold - total_cost,
        'items_purchased', p_quantity,
        'total_cost', total_cost
    );
END;
$$ LANGUAGE plpgsql;

-- Function to purchase gems (fixed at 90g each, 30 daily limit)
CREATE OR REPLACE FUNCTION purchase_gems(
    p_player_id UUID,
    p_quantity INTEGER
) RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT process_daily_purchase(
        p_player_id, 
        'gems', 
        p_quantity, 
        90, -- fixed price per gem
        30  -- daily limit
    ) INTO result;
    
    -- Add gems to player inventory if purchase successful
    IF (result->>'success')::boolean THEN
        UPDATE players 
        SET gems = gems + p_quantity 
        WHERE id = p_player_id;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to handle daily voting (500-1000 gold reward, once per day)
CREATE OR REPLACE FUNCTION daily_vote(
    p_player_id UUID
) RETURNS JSON AS $$
DECLARE
    already_voted BOOLEAN;
    gold_reward INTEGER;
    mana_bonus BOOLEAN := false;
BEGIN
    -- Check if already voted today
    SELECT EXISTS(
        SELECT 1 FROM player_daily_purchases 
        WHERE player_id = p_player_id 
          AND purchase_type = 'vote' 
          AND purchase_date = CURRENT_DATE
    ) INTO already_voted;
    
    IF already_voted THEN
        RETURN json_build_object('success', false, 'error', 'Already voted today');
    END IF;
    
    -- Generate random gold reward (500-1000)
    gold_reward := 500 + (random() * 500)::INTEGER;
    
    -- 5% chance for rare mana reload bonus
    IF random() < 0.05 THEN
        mana_bonus := true;
        UPDATE players SET mana = max_mana WHERE id = p_player_id;
    END IF;
    
    -- Award gold
    UPDATE players SET gold = gold + gold_reward WHERE id = p_player_id;
    
    -- Record vote
    INSERT INTO player_daily_purchases (player_id, purchase_type, quantity, gold_spent)
    VALUES (p_player_id, 'vote', 1, -gold_reward); -- negative gold_spent = gold earned
    
    RETURN json_build_object(
        'success', true,
        'gold_awarded', gold_reward,
        'mana_reload', mana_bonus,
        'message', CASE 
            WHEN mana_bonus THEN 'Voted successfully! Gold awarded and mana restored!'
            ELSE 'Voted successfully! Gold awarded.'
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Function to purchase mana from mana tree (100 gems = 1 max mana, daily limit 1)
CREATE OR REPLACE FUNCTION purchase_mana_tree(
    p_player_id UUID
) RETURNS JSON AS $$
DECLARE
    player_gems INTEGER;
    already_purchased BOOLEAN;
BEGIN
    -- Check if already purchased today
    SELECT EXISTS(
        SELECT 1 FROM player_daily_purchases 
        WHERE player_id = p_player_id 
          AND purchase_type = 'mana' 
          AND purchase_date = CURRENT_DATE
    ) INTO already_purchased;
    
    IF already_purchased THEN
        RETURN json_build_object('success', false, 'error', 'Already purchased mana today');
    END IF;
    
    -- Check player gems
    SELECT gems INTO player_gems FROM players WHERE id = p_player_id;
    IF player_gems < 100 THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient gems (need 100)');
    END IF;
    
    -- Process purchase
    UPDATE players 
    SET gems = gems - 100,
        max_mana = max_mana + 1
    WHERE id = p_player_id;
    
    -- Record purchase
    INSERT INTO player_daily_purchases (player_id, purchase_type, quantity, gold_spent)
    VALUES (p_player_id, 'mana', 1, 0); -- gems spent, not gold
    
    RETURN json_build_object(
        'success', true,
        'gems_spent', 100,
        'max_mana_increased', 1,
        'message', 'Purchased 1 max mana for 100 gems'
    );
END;
$$ LANGUAGE plpgsql;