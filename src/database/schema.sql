-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'sniper')),
    token_in VARCHAR(50) NOT NULL,
    token_out VARCHAR(50) NOT NULL,
    amount_in DECIMAL(20, 8) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'routing', 'building', 'submitted', 'confirmed', 'failed')),
    
    selected_dex VARCHAR(20),
    raydium_quote_price DECIMAL(20, 8),
    meteora_quote_price DECIMAL(20, 8),
    
    executed_price DECIMAL(20, 8),
    amount_out DECIMAL(20, 8),
    tx_hash VARCHAR(128),
    
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Order events (audit trail)
CREATE TABLE IF NOT EXISTS order_events (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);