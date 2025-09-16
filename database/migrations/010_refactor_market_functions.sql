-- Refactored market functions using the item transfer helper to eliminate duplication

-- Simplified create_market_listing using helper function
CREATE OR REPLACE FUNCTION create_market_listing(
    p_seller_id UUID,
    p_item_type VARCHAR,
    p_quantity INTEGER,
    p_unit_price INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer_result JSON;
    v_listing_id INTEGER;
BEGIN
    -- Use helper function to remove items from seller
    v_transfer_result := transfer_player_items(p_seller_id, p_item_type, p_quantity, 'remove');
    
    IF NOT (v_transfer_result->>'success')::boolean THEN
        RETURN v_transfer_result;
    END IF;
    
    -- Create listing
    INSERT INTO market (seller_id, item_type, quantity, unit_price)
    VALUES (p_seller_id, p_item_type, p_quantity, p_unit_price)
    RETURNING id INTO v_listing_id;
    
    -- Return listing details
    RETURN json_build_object(
        'id', v_listing_id,
        'item_type', p_item_type,
        'quantity', p_quantity,
        'unit_price', p_unit_price
    );
END;
$$;

-- Simplified purchase_market_listing using helper function
CREATE OR REPLACE FUNCTION purchase_market_listing(
    p_listing_id INTEGER,
    p_buyer_id UUID,
    p_quantity INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_listing RECORD;
    v_buyer_gold INTEGER;
    v_purchase_qty INTEGER;
    v_total_cost INTEGER;
    v_transfer_result JSON;
BEGIN
    -- Lock listing row
    SELECT * INTO v_listing
    FROM market
    WHERE id = p_listing_id
        AND buyer_id IS NULL
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
    
    -- Check buyer funds with lock
    SELECT gold INTO v_buyer_gold
    FROM players
    WHERE id = p_buyer_id
    FOR UPDATE;
    
    IF v_buyer_gold < v_total_cost THEN
        RAISE EXCEPTION 'Insufficient gold';
    END IF;
    
    -- Transfer gold
    UPDATE players
    SET gold = gold - v_total_cost
    WHERE id = p_buyer_id;
    
    UPDATE players
    SET gold = gold + v_total_cost
    WHERE id = v_listing.seller_id;
    
    -- Transfer items using helper function
    v_transfer_result := transfer_player_items(p_buyer_id, v_listing.item_type, v_purchase_qty, 'add');
    
    IF NOT (v_transfer_result->>'success')::boolean THEN
        RAISE EXCEPTION 'Item transfer failed: %', v_transfer_result->>'error';
    END IF;
    
    -- Update listing
    IF v_purchase_qty = v_listing.quantity THEN
        -- Complete sale
        UPDATE market
        SET buyer_id = p_buyer_id,
            sold_at = NOW()
        WHERE id = p_listing_id;
    ELSE
        -- Partial sale
        UPDATE market
        SET quantity = quantity - v_purchase_qty
        WHERE id = p_listing_id;
    END IF;
    
    -- Return purchase details
    RETURN json_build_object(
        'purchased', v_purchase_qty,
        'total_cost', v_total_cost,
        'complete', v_purchase_qty = v_listing.quantity
    );
END;
$$;

-- Simplified cancel_market_listing using helper function
CREATE OR REPLACE FUNCTION cancel_market_listing(
    p_listing_id INTEGER,
    p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_listing RECORD;
    v_transfer_result JSON;
BEGIN
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
    
    -- Return items to seller using helper function
    v_transfer_result := transfer_player_items(p_user_id, v_listing.item_type, v_listing.quantity, 'add');
    
    IF NOT (v_transfer_result->>'success')::boolean THEN
        RAISE EXCEPTION 'Item return failed: %', v_transfer_result->>'error';
    END IF;
    
    -- Mark as cancelled (soft delete)
    UPDATE market
    SET buyer_id = seller_id,
        sold_at = NOW()
    WHERE id = p_listing_id;
    
    -- Return cancellation details
    RETURN json_build_object(
        'returned', v_listing.quantity,
        'item_type', v_listing.item_type
    );
END;
$$;