-- Transaction retry wrapper for atomic operations
CREATE OR REPLACE FUNCTION safe_market_purchase(
    p_listing_id INTEGER,
    p_buyer_id UUID,
    p_quantity INTEGER
) RETURNS JSON AS $$
DECLARE
    v_attempt INTEGER := 0;
    v_max_attempts INTEGER := 3;
    v_result JSON;
BEGIN
    WHILE v_attempt < v_max_attempts LOOP
        BEGIN
            v_result := purchase_market_listing(p_listing_id, p_buyer_id, p_quantity);
            RETURN v_result;
        EXCEPTION
            WHEN serialization_failure OR deadlock_detected THEN
                v_attempt := v_attempt + 1;
                IF v_attempt >= v_max_attempts THEN
                    RAISE;
                END IF;
                PERFORM pg_sleep(0.1 * v_attempt);
            WHEN OTHERS THEN
                RAISE;
        END;
    END LOOP;
    
    RAISE EXCEPTION 'Max retry attempts exceeded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe wrapper for market listing creation  
CREATE OR REPLACE FUNCTION safe_market_listing(
    p_seller_id UUID,
    p_item_type VARCHAR,
    p_quantity INTEGER,
    p_unit_price INTEGER
) RETURNS JSON AS $$
DECLARE
    v_attempt INTEGER := 0;
    v_max_attempts INTEGER := 3;
    v_result JSON;
BEGIN
    WHILE v_attempt < v_max_attempts LOOP
        BEGIN
            v_result := create_market_listing(p_seller_id, p_item_type, p_quantity, p_unit_price);
            RETURN v_result;
        EXCEPTION
            WHEN serialization_failure OR deadlock_detected THEN
                v_attempt := v_attempt + 1;
                IF v_attempt >= v_max_attempts THEN
                    RAISE;
                END IF;
                PERFORM pg_sleep(0.1 * v_attempt);
            WHEN OTHERS THEN
                RAISE;
        END;
    END LOOP;
    
    RAISE EXCEPTION 'Max retry attempts exceeded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe wrapper for market listing cancellation
CREATE OR REPLACE FUNCTION safe_market_cancel(
    p_listing_id INTEGER,
    p_user_id UUID
) RETURNS JSON AS $$
DECLARE
    v_attempt INTEGER := 0;
    v_max_attempts INTEGER := 3;
    v_result JSON;
BEGIN
    WHILE v_attempt < v_max_attempts LOOP
        BEGIN
            v_result := cancel_market_listing(p_listing_id, p_user_id);
            RETURN v_result;
        EXCEPTION
            WHEN serialization_failure OR deadlock_detected THEN
                v_attempt := v_attempt + 1;
                IF v_attempt >= v_max_attempts THEN
                    RAISE;
                END IF;
                PERFORM pg_sleep(0.1 * v_attempt);
            WHEN OTHERS THEN
                RAISE;
        END;
    END LOOP;
    
    RAISE EXCEPTION 'Max retry attempts exceeded';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;