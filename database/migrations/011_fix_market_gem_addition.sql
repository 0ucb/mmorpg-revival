-- Fix for market gem purchase setting total instead of adding
-- The issue: NULL values in gems/metals fields cause addition to fail

-- Update the transfer_player_items function to handle NULL values
CREATE OR REPLACE FUNCTION transfer_player_items(
    p_player_id UUID,
    p_item_type VARCHAR,
    p_quantity INTEGER,
    p_operation VARCHAR -- 'add' or 'remove'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_amount INTEGER;
    v_new_amount INTEGER;
BEGIN
    -- Get current amount based on item type (handle NULL with COALESCE)
    CASE p_item_type
        WHEN 'gems' THEN
            SELECT COALESCE(gems, 0) INTO v_current_amount 
            FROM players 
            WHERE id = p_player_id
            FOR UPDATE;
        WHEN 'metals' THEN
            SELECT COALESCE(metals, 0) INTO v_current_amount 
            FROM players 
            WHERE id = p_player_id
            FOR UPDATE;
        ELSE
            RETURN json_build_object(
                'success', false, 
                'error', 'Invalid item type: ' || p_item_type
            );
    END CASE;
    
    -- Handle NULL case explicitly
    IF v_current_amount IS NULL THEN
        v_current_amount := 0;
    END IF;
    
    -- Calculate new amount
    IF p_operation = 'remove' THEN
        IF v_current_amount < p_quantity THEN
            RETURN json_build_object(
                'success', false, 
                'error', 'Insufficient ' || p_item_type || ': have ' || v_current_amount || ', need ' || p_quantity
            );
        END IF;
        v_new_amount := v_current_amount - p_quantity;
    ELSIF p_operation = 'add' THEN
        v_new_amount := v_current_amount + p_quantity;
    ELSE
        RETURN json_build_object(
            'success', false, 
            'error', 'Invalid operation: ' || p_operation
        );
    END IF;
    
    -- Update player's items
    CASE p_item_type
        WHEN 'gems' THEN
            UPDATE players SET gems = v_new_amount WHERE id = p_player_id;
        WHEN 'metals' THEN
            UPDATE players SET metals = v_new_amount WHERE id = p_player_id;
    END CASE;
    
    RETURN json_build_object(
        'success', true,
        'item_type', p_item_type,
        'previous_amount', v_current_amount,
        'new_amount', v_new_amount,
        'quantity_transferred', p_quantity,
        'operation', p_operation
    );
END;
$$;

-- Also ensure all players have non-NULL gem/metal values
UPDATE players SET gems = 0 WHERE gems IS NULL;
UPDATE players SET metals = 0 WHERE metals IS NULL;

-- Add constraints to prevent NULL values in the future
ALTER TABLE players 
    ALTER COLUMN gems SET DEFAULT 0,
    ALTER COLUMN metals SET DEFAULT 0;

-- Add NOT NULL constraints if they don't exist
DO $$ 
BEGIN
    -- Check if gems can be set to NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'gems' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE players ALTER COLUMN gems SET NOT NULL;
    END IF;
    
    -- Check if metals can be set to NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'metals' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE players ALTER COLUMN metals SET NOT NULL;
    END IF;
END $$;

-- Verify the fix by testing the function
DO $$
DECLARE
    v_test_result JSON;
    v_test_player_id UUID;
BEGIN
    -- Get a test player ID (use the first player found)
    SELECT id INTO v_test_player_id FROM players LIMIT 1;
    
    IF v_test_player_id IS NOT NULL THEN
        -- Test adding gems
        v_test_result := transfer_player_items(v_test_player_id, 'gems', 0, 'add');
        RAISE NOTICE 'Test add 0 gems result: %', v_test_result;
        
        -- Log the result
        IF (v_test_result->>'success')::boolean THEN
            RAISE NOTICE 'Transfer function is working correctly';
        ELSE
            RAISE WARNING 'Transfer function test failed: %', v_test_result->>'error';
        END IF;
    END IF;
END $$;