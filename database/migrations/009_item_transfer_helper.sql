-- Helper function for all item transfers to eliminate code duplication
CREATE OR REPLACE FUNCTION transfer_player_items(
    p_player_id UUID,
    p_item_type VARCHAR,
    p_quantity INTEGER,
    p_operation VARCHAR -- 'add' or 'remove'
) RETURNS JSON AS $$
DECLARE
    v_current_amount INTEGER;
    v_new_amount INTEGER;
BEGIN
    -- Get current amount with row lock
    IF p_item_type = 'gems' THEN
        SELECT gems INTO v_current_amount 
        FROM players 
        WHERE id = p_player_id
        FOR UPDATE;
    ELSIF p_item_type = 'metals' THEN
        SELECT metals INTO v_current_amount 
        FROM players 
        WHERE id = p_player_id
        FOR UPDATE;
    ELSE
        RETURN json_build_object(
            'success', false, 
            'error', 'Invalid item type: ' || p_item_type
        );
    END IF;

    -- Check if player exists
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Player not found'
        );
    END IF;

    -- Calculate new amount based on operation
    IF p_operation = 'remove' THEN
        IF v_current_amount < p_quantity THEN
            RETURN json_build_object(
                'success', false, 
                'error', 'Insufficient ' || p_item_type
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

    -- Update player inventory
    IF p_item_type = 'gems' THEN
        UPDATE players 
        SET gems = v_new_amount 
        WHERE id = p_player_id;
    ELSE -- metals
        UPDATE players 
        SET metals = v_new_amount 
        WHERE id = p_player_id;
    END IF;

    -- Return success with new amount
    RETURN json_build_object(
        'success', true,
        'old_amount', v_current_amount,
        'new_amount', v_new_amount,
        'transferred', p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;