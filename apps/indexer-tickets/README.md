# Null Protocol Ticket Indexer

A PostgreSQL-backed indexer that tails Canon Topic.Tickets events and maintains both an immutable event log and a current-state view.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

3. **Initialize PostgreSQL database:**
   ```bash
   # Create database and user
   createdb null_indexer
   psql null_indexer < sql/001_init.sql
   ```

4. **Run the indexer:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## Configuration

- `RPC_URL`: Ethereum RPC endpoint
- `CANON_ADDRESS`: CanonRegistry contract address
- `CANON_TOPIC_TICKETS`: Topic ID for tickets (default: 4)
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`: PostgreSQL connection
- `START_BLOCK`: Block to start indexing from (0 for genesis)
- `CONFIRMATIONS`: Block confirmations before processing (default: 5)

## Database Schema

- `canon_ticket_events`: Immutable append-only log of all ticket events
- `tickets_current_state`: Materialized current state view for fast lookups

## Notes

- The indexer never stores PII - only commitments and tags
- Use a small confirmation buffer to avoid reorg issues
- For backfill, run a one-off script from `START_BLOCK` before subscribing to live events
