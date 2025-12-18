# Order Execution Engine

A smart order router that finds the best price across Raydium and Meteora DEXs on Solana, with real-time WebSocket updates.

**Live Demo:** [Add your deployment URL here]  
**Video Demo:** [Add your YouTube link here]  
**GitHub:** https://github.com/nishhantt/order-execution-engine

---

## Why Market Orders?

I chose **market orders** because they execute immediately, which lets me focus on the core challenge: comparing prices across DEXs and routing to the best one. 

**Extending to other order types:**
- **Limit orders:** Add a price monitor that checks market prices every few seconds and triggers execution when target price is hit.
- **Sniper orders:** Listen to Solana blockchain events for new token launches, then immediately execute the routing logic.

---

## How It Works

1. User submits order → API validates and queues it
2. System fetches quotes from both Raydium and Meteora
3. Compares prices (including fees) and picks the cheaper one
4. Executes the swap
5. Returns transaction hash

Throughout this process, WebSocket sends real-time updates: `pending` → `routing` → `building` → `submitted` → `confirmed`

**Example:**
- Raydium: $142.50 + 0.3% fee = $142.93
- Meteora: $141.80 + 0.2% fee = $142.08
- **Picks Meteora** (saves $0.85)

---

## Quick Start

**Requirements:** Node.js 18+, Docker
```bash
# 1. Clone and install
git clone https://github.com/nishhantt/order-execution-engine.git
cd order-execution-engine
npm install

# 2. Start database & cache
docker-compose up -d

# 3. Setup database
docker exec -i order_engine_postgres psql -U orderengine -d order_execution < src/database/schema.sql

# 4. Run
npm run dev
```

Server starts at `http://localhost:3000`

---

## API Usage

### Submit Order
```bash
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "market",
    "tokenIn": "SOL",
    "tokenOut": "USDC",
    "amountIn": 100
  }'
```

**Response:**
```json
{
  "orderId": "abc-123",
  "status": "queued"
}
```

### WebSocket Updates
Connect to: `ws://localhost:3000/api/orders/{orderId}/stream`

You'll receive:
```json
{"type": "status_update", "status": "pending", "message": "Order received"}
{"type": "routing_info", "raydiumPrice": 142.93, "meteoraPrice": 142.08, "selectedDex": "meteora"}
{"type": "execution_result", "txHash": "meteora_xyz123", "executedPrice": 141.82}
```

### Check Order
```bash
curl http://localhost:3000/api/orders/{orderId}
```

---

## Architecture Decisions

**Why these choices:**

- **Fastify:** Fast, built-in WebSocket support
- **BullMQ:** Handles 10 concurrent orders, auto-retry with exponential backoff
- **PostgreSQL:** Permanent storage for order history
- **Redis:** Fast cache for active orders + queue backend
- **Mock DEXs:** Focus on routing logic without blockchain complexity (could easily swap to real Raydium/Meteora SDKs)

**Flow:**
```
HTTP POST → Validate → Queue (BullMQ) → Worker picks up → Fetch quotes (parallel) 
→ Compare prices → Execute → Save to DB → WebSocket updates throughout
```

---

## Testing
```bash
npm test
```

**21 tests | 83% coverage**

Tests cover:
- DEX price comparison logic
- Order validation
- Queue processing
- WebSocket messaging
- Full order lifecycle

---

## Tech Stack

- **Backend:** Node.js 18, TypeScript
- **API:** Fastify (WebSocket support)
- **Queue:** BullMQ + Redis
- **Database:** PostgreSQL 16
- **Testing:** Jest

---

## Deployment

Deployed on [Railway/Render/Fly.io - add your platform]

**Environment variables:**
```bash
NODE_ENV=production
DATABASE_URL=your-postgres-url
REDIS_URL=your-redis-url
PORT=3000
```

---

## Project Structure
```
src/
├── services/dex-router/     # Raydium & Meteora mock services
├── services/order-processor/ # Order orchestration
├── queues/                  # BullMQ worker
├── repositories/            # Database queries
├── routes/                  # API endpoints
└── middleware/              # Validation, rate limiting

tests/
├── unit/                    # Individual function tests
└── integration/             # Full flow tests
```

---

## API Collection

Import `postman_collection.json` to test all endpoints.

---


**Built for Solana DeFi** | Questions? Open an issue.