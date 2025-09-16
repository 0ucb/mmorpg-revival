-- Daily purchase limits tracking table
-- Tracks daily purchases for gems, mana, voting rewards, etc.

CREATE TABLE player_daily_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    purchase_type VARCHAR(20) NOT NULL, -- 'gems', 'mana', 'vote'
    purchase_date DATE DEFAULT CURRENT_DATE,
    quantity INTEGER DEFAULT 0,
    gold_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(player_id, purchase_type, purchase_date)
);

-- Index for fast daily lookups
CREATE INDEX idx_player_daily_purchases ON player_daily_purchases(player_id, purchase_type, purchase_date);

-- Add comments for documentation
COMMENT ON TABLE player_daily_purchases IS 'Tracks daily purchase limits for NPC shops and resources';
COMMENT ON COLUMN player_daily_purchases.purchase_type IS 'Type: gems (30/day), mana (1/day), vote (1/day)';
COMMENT ON COLUMN player_daily_purchases.quantity IS 'Number of items purchased (gems count, mana count, vote count)';
COMMENT ON COLUMN player_daily_purchases.gold_spent IS 'Total gold spent on this purchase type today';