# @null/relayer-tickets

Production-ready TypeScript relayer service for Null Protocol ticket lifecycle management.

## Features

- **Fastify-based**: High-performance HTTP server with CORS support
- **Zod validation**: Type-safe request/response validation
- **Canon integration**: Direct anchoring to Canon Registry
- **Privacy-preserving**: Server-side HMAC computation (no PII on-chain)
- **Evidence signing**: JWS-style evidence packages with pinning
- **State management**: In-memory indexer (replace with persistent storage)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your configuration
# - Set VENUE_HMAC_KEY to a secure random key
# - Configure RPC_URL for your network
# - Set CANON_ADDRESS to your CanonRegistry contract
# - Configure RELAYER_PK for anchoring transactions

# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /healthz
```

### Issue Ticket
```
POST /tickets/issue
{
  "eventId": "ARENA-2025-10-12-TourA",
  "seat": "112-D-8",
  "holderIdentifier": "alice@example.com",
  "policy": {
    "maxResalePct": 110,
    "transferWindowHours": 48,
    "kycLevel": "light"
  },
  "assurance": 1
}
```

### Transfer Ticket
```
POST /tickets/transfer
{
  "ticketIdCommit": "0x...",
  "fromIdentifier": "alice@example.com",
  "toIdentifier": "bob@example.com"
}
```

### Revoke Ticket
```
POST /tickets/revoke
{
  "ticketIdCommit": "0x...",
  "reason": "policy_breach"
}
```

### Verify at Gate
```
POST /tickets/verify
{
  "ticketQrPayload": "TICKET:ARENA-2025-10-12-TourA:0x...",
  "holderProof": "123456"
}
```

## Architecture

### Security Model
- **Server-side HMAC**: Venue HMAC keys never exposed to clients
- **Evidence signing**: JWS-style signatures for audit trails
- **PII protection**: No personal information stored on-chain
- **Policy enforcement**: Transfer restrictions and KYC validation

### Evidence Flow
1. **Issue**: Create evidence package with event details and policy
2. **Sign**: Apply JWS signature (stubbed - replace with real DID signing)
3. **Pin**: Store evidence on IPFS/Arweave (stubbed - replace with real pinning)
4. **Anchor**: Submit to Canon Registry with evidence URI

### State Management
- **In-memory indexer**: Current implementation (demo only)
- **Production**: Replace with persistent storage (Postgres/SQLite)
- **Event sourcing**: Tail Canon events for state reconstruction

## Production Considerations

### Replace Stubs
1. **Canon ABI**: Update with your actual CanonRegistry interface
2. **Evidence signing**: Implement real DID/JWS signing (e.g., `did-jwt`, `jose`)
3. **Evidence pinning**: Use IPFS (`ipfs-http-client`) or Arweave
4. **State persistence**: Replace in-memory indexer with database
5. **Holder proof validation**: Implement OTP/wallet signature verification

### Security
- **Key management**: Use secure key storage (HSM, key vault)
- **Rate limiting**: Add request throttling
- **Authentication**: Implement API key or JWT authentication
- **Monitoring**: Add logging and metrics collection

### Scalability
- **Database**: Use PostgreSQL or similar for state persistence
- **Caching**: Add Redis for session management
- **Load balancing**: Deploy behind load balancer
- **Event sourcing**: Implement proper event store

## Development

```bash
# Type checking
npm run build

# Linting
npm run lint

# Development server
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8787` |
| `VENUE_HMAC_KEY` | Secret HMAC key for venue | `dev-key-DO-NOT-USE` |
| `RPC_URL` | Ethereum RPC endpoint | `http://localhost:8545` |
| `CANON_ADDRESS` | CanonRegistry contract address | `0xCanonRegistryAddress` |
| `FOUNDATION_ADDRESS` | Foundation treasury address | `0xFoundation` |
| `RELAYER_PK` | Relayer private key | `0xdeadbeef` |
| `FEE_WEI_ISSUE` | Issue fee in wei | `0` |
| `FEE_WEI_TRANSFER` | Transfer fee in wei | `0` |
| `FEE_WEI_REVOKE` | Revoke fee in wei | `0` |
