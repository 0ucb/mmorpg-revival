-- Create market listing with atomic item removal
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
    v_seller_items INTEGER;
    v_listing_id INTEGER;
BEGIN
    -- Lock seller's row and check items
    IF p_item_type = 'gems' THEN
        SELECT gems INTO v_seller_items
        FROM players
        WHERE id = p_seller_id
        FOR UPDATE;
    ELSIF p_item_type = 'metals' THEN
        SELECT metals INTO v_seller_items
        FROM players
        WHERE id = p_seller_id
        FOR UPDATE;
    ELSE
        RAISE EXCEPTION 'Invalid item type';
    END IF;
    
    -- Check sufficient items
    IF v_seller_items < p_quantity THEN
        RAISE EXCEPTION 'Insufficient %', p_item_type;
    END IF;
    
    -- Deduct items from seller
    IF p_item_type = 'gems' THEN
        UPDATE players
        SET gems = gems - p_quantity
        WHERE id = p_seller_id;
    ELSE
        UPDATE players
        SET metals = metals - p_quantity
        WHERE id = p_seller_id;
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

-- Purchase from market listing with atomic transfer
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
    
    -- Check buyer funds
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
    
    -- Transfer items
    IF v_listing.item_type = 'gems' THEN
        UPDATE players
        SET gems = gems + v_purchase_qty
        WHERE id = p_buyer_id;
    ELSE
        UPDATE players
        SET metals = metals + v_purchase_qty
        WHERE id = p_buyer_id;
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

-- Cancel market listing and return items
CREATE OR REPLACE FUNCTION cancel_market_listing(
    p_listing_id INTEGER,
    p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_listing RECORD;
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
    
    -- Return items to seller
    IF v_listing.item_type = 'gems' THEN
        UPDATE players
        SET gems = gems + v_listing.quantity
        WHERE id = p_user_id;
    ELSE
        UPDATE players
        SET metals = metals + v_listing.quantity
        WHERE id = p_user_id;
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