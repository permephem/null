# @null/sdk-tickets

TypeScript SDK for Null Protocol ticket lifecycle management.

## Features

- **Privacy-preserving**: Uses HMAC-based holder tags to avoid putting PII on-chain
- **EVM-compatible**: Uses Keccak-256 hashing for commitments
- **Production-ready**: Separates client and relayer concerns
- **Type-safe**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @null/sdk-tickets
```

## Quick Start

```typescript
import { NullTicketsClient } from "@null/sdk-tickets";

const sdk = new NullTicketsClient({
  apiBase: "https://relay.null.xyz",
  canonContract: "0xCanon...",
  foundationAddress: "0xFoundation...",
  venueHmacKey: new TextEncoder().encode("super-secret-per-venue-key")
});

// Issue a ticket
const issued = await sdk.issue({
  eventId: "ARENA-2025-10-12-TourA",
  seat: "112-D-8",
  holderIdentifier: "alice@example.com",
  policy: { maxResalePct: 110, transferWindowHours: 48, kycLevel: "light" },
  assurance: 1
});

// Transfer ticket
const transfer = await sdk.transfer({
  ticketIdCommit: issued.ticketIdCommit,
  fromIdentifier: "alice@example.com",
  toIdentifier: "bob@example.com"
});

// Verify at gate
const verification = await sdk.verifyAtGate({
  ticketQrPayload: "TICKET:ARENA-2025-10-12-TourA:112-D-8:session-xyz",
  holderProof: "123456"
});
```

## Architecture

### Client vs Relayer

- **Client SDK**: Handles commitment computation, API calls, and user interactions
- **Relayer**: Performs Canon anchoring, fee handling, and evidence package signing
- **Privacy**: Never sends PII to Canon; uses HMAC-based holder tags

### Assurance Tiers

- `0`: DKIM (Email verification)
- `1`: DID/JWS (Decentralized identity with JSON Web Signatures)
- `2`: TEE/HSM (Trusted Execution Environment/Hardware Security Module)
- `3`: ZK (Zero-knowledge proofs)

## Development

```bash
npm run build
npm run lint
npm test
```

## Security Considerations

1. **HMAC Keys**: Keep venue HMAC keys server-side when possible
2. **Evidence**: Relayer should assemble and sign evidence packages
3. **Offline Gates**: Use signed Merkle snapshots for sub-150ms offline verification
4. **PII Protection**: Never store personal information on-chain


