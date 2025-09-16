-- Market System Tables
CREATE TABLE market (
    id SERIAL PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES players(id),
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('gems', 'metals')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price BETWEEN 1 AND 1000000),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- NULL until sold
    buyer_id UUID REFERENCES players(id),
    sold_at TIMESTAMP,
    
    -- Prevent self-trading
    CONSTRAINT no_self_trade CHECK (buyer_id IS NULL OR buyer_id != seller_id)
);

-- Indexes for performance
CREATE INDEX idx_market_active ON market (item_type, unit_price) 
WHERE buyer_id IS NULL;

CREATE INDEX idx_market_seller ON market (seller_id) 
WHERE buyer_id IS NULL;

CREATE INDEX idx_market_buyer ON market (buyer_id) 
WHERE buyer_id IS NOT NULL;

-- Enable RLS
ALTER TABLE market ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active listings" ON market
    FOR SELECT USING (buyer_id IS NULL);

CREATE POLICY "View own sold/bought items" ON market
    FOR SELECT USING (
        auth.uid() = seller_id OR 
        auth.uid() = buyer_id
    );

CREATE POLICY "Create own listings" ON market
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Cannot modify listings" ON market
    FOR UPDATE USING (false);

CREATE POLICY "Cannot delete listings" ON market
    FOR DELETE USING (false);