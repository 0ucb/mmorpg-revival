-- Helper function to handle all item transfers (DRY principle)
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
    -- Get current amount based on item type
    CASE p_item_type
        WHEN 'gems' THEN
            SELECT gems INTO v_current_amount 
            FROM players 
            WHERE id = p_player_id
            FOR UPDATE;
        WHEN 'metals' THEN
            SELECT metals INTO v_current_amount 
            FROM players 
            WHERE id = p_player_id
            FOR UPDATE;
        ELSE
            RETURN json_build_object(
                'success', false, 
                'error', 'Invalid item type: ' || p_item_type
            );
    END CASE;
    
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
        'quantity_changed', p_quantity
    );
END;
$$;

-- Wrapper function with retry logic for market listing creation
CREATE OR REPLACE FUNCTION safe_market_listing(
    p_seller_id UUID,
    p_item_type VARCHAR,
    p_quantity INTEGER,
    p_unit_price INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt INTEGER := 0;
    v_max_attempts INTEGER := 3;
    v_result JSON;
    v_listing_id INTEGER;
    v_total_price BIGINT;
BEGIN
    -- Validate total price server-side
    v_total_price := p_quantity::BIGINT * p_unit_price::BIGINT;
    IF v_total_price > 100000000 THEN -- 100M gold max
        RAISE EXCEPTION 'Total price exceeds maximum allowed';
    END IF;
    
    -- Retry loop for handling concurrent access
    WHILE v_attempt < v_max_attempts LOOP
        BEGIN
            v_attempt := v_attempt + 1;
            
            -- Use helper function to remove items
            v_result := transfer_player_items(p_seller_id, p_item_type, p_quantity, 'remove');
            
            IF NOT (v_result->>'success')::boolean THEN
                RAISE EXCEPTION '%', v_result->>'error';
            END IF;
            
            -- Create the listing
            INSERT INTO market (seller_id, item_type, quantity, unit_price)
            VALUES (p_seller_id, p_item_type, p_quantity, p_unit_price)
            RETURNING id INTO v_listing_id;
            
            -- Success - exit loop
            RETURN json_build_object(
                'id', v_listing_id,
                'item_type', p_item_type,
                'quantity', p_quantity,
                'unit_price', p_unit_price,
                'total_price', v_total_price
            );
            
        EXCEPTION
            WHEN OTHERS THEN
                IF v_attempt >= v_max_attempts THEN
                    RAISE;
                END IF;
                -- Exponential backoff
                PERFORM pg_sleep(0.1 * v_attempt);
        END;
    END LOOP;
END;
$$;

-- Wrapper function with retry logic for market purchases
CREATE OR REPLACE FUNCTION safe_market_purchase(
    p_listing_id INTEGER,
    p_buyer_id UUID,
    p_quantity INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt INTEGER := 0;
    v_max_attempts INTEGER := 3;
    v_listing RECORD;
    v_buyer_gold INTEGER;
    v_purchase_qty INTEGER;
    v_total_cost INTEGER;
    v_result JSON;
BEGIN
    WHILE v_attempt < v_max_attempts LOOP
        BEGIN
            v_attempt := v_attempt + 1;
            
            -- Lock listing row
            SELECT * INTO v_listing
            FROM market
            WHERE id = p_listing_id AND buyer_id IS NULL
            FOR UPDATE;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Listing not available';
            END IF;
            
            -- Prevent self-trading
            IF v_listing.seller_id = p_buyer_id THEN
                RAISE EXCEPTION 'Cannot buy own listing';
            END IF;
            
            -- Calculate purchase quantity
            v_purchase_qty := LEAST(p_quantity, v_listing.quantity);
            v_total_cost := v_purchase_qty * v_listing.unit_price;
            
            -- Check and deduct buyer gold
            SELECT gold INTO v_buyer_gold
            FROM players
            WHERE id = p_buyer_id
            FOR UPDATE;
            
            IF v_buyer_gold < v_total_cost THEN
                RAISE EXCEPTION 'Insufficient gold';
            END IF;
            
            UPDATE players
            SET gold = gold - v_total_cost
            WHERE id = p_buyer_id;
            
            -- Pay seller
            UPDATE players
            SET gold = gold + v_total_cost
            WHERE id = v_listing.seller_id;
            
            -- Transfer items to buyer using helper
            v_result := transfer_player_items(p_buyer_id, v_listing.item_type, v_purchase_qty, 'add');
            
            IF NOT (v_result->>'success')::boolean THEN
                RAISE EXCEPTION '%', v_result->>'error';
            END IF;
            
            -- Update listing
            IF v_purchase_qty = v_listing.quantity THEN
                UPDATE market
                SET buyer_id = p_buyer_id, sold_at = NOW()
                WHERE id = p_listing_id;
            ELSE
                UPDATE market
                SET quantity = quantity - v_purchase_qty
                WHERE id = p_listing_id;
            END IF;
            
            -- Success - exit loop
            RETURN json_build_object(
                'purchased', v_purchase_qty,
                'total_cost', v_total_cost,
                'complete', v_purchase_qty = v_listing.quantity
            );
            
        EXCEPTION
            WHEN OTHERS THEN
                IF v_attempt >= v_max_attempts THEN
                    RAISE;
                END IF;
                -- Exponential backoff
                PERFORM pg_sleep(0.1 * v_attempt);
        END;
    END LOOP;
END;
$$;

-- Wrapper function for cancelling listings with retry
CREATE OR REPLACE FUNCTION safe_cancel_listing(
    p_listing_id INTEGER,
    p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt INTEGER := 0;
    v_max_attempts INTEGER := 3;
    v_listing RECORD;
    v_result JSON;
BEGIN
    WHILE v_attempt < v_max_attempts LOOP
        BEGIN
            v_attempt := v_attempt + 1;
            
            -- Lock and verify ownership
            SELECT * INTO v_listing
            FROM market
            WHERE id = p_listing_id
                AND seller_id = p_user_id
                AND buyer_id IS NULL
            FOR UPDATE;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Listing not found or already sold';
            END IF;
            
            -- Return items using helper
            v_result := transfer_player_items(p_user_id, v_listing.item_type, v_listing.quantity, 'add');
            
            IF NOT (v_result->>'success')::boolean THEN
                RAISE EXCEPTION '%', v_result->>'error';
            END IF;
            
            -- Mark as cancelled
            UPDATE market
            SET buyer_id = seller_id, sold_at = NOW()
            WHERE id = p_listing_id;
            
            -- Success - exit loop
            RETURN json_build_object(
                'returned', v_listing.quantity,
                'item_type', v_listing.item_type
            );
            
        EXCEPTION
            WHEN OTHERS THEN
                IF v_attempt >= v_max_attempts THEN
                    RAISE;
                END IF;
                -- Exponential backoff
                PERFORM pg_sleep(0.1 * v_attempt);
        END;
    END LOOP;
END;
$$;