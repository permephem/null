# Null Protocol Whitepaper (Expanded Edition)

## Abstract

The Null Protocol standardizes verifiable digital deletion. It couples smart contracts, a relayer service, canonical data schemas, and cryptographic proofs so that a "delete" action is logged immutably and can be audited by any party.

By combining an on-chain Canon Registry (anchor ledger), off-chain warrants and attestations, and optional soulbound receipts (Mask SBTs), the protocol offers a transparent, tamper-evident trail of data removal requests across jurisdictions and platforms.

## 1. Introduction & Background

Modern privacy regulations grant individuals the right to request deletion of personal data. Yet most digital services lack transparent, verifiable mechanisms to demonstrate that deletions occurred.

Null Protocol addresses this gap by:

- **Standardizing the deletion request format** (Null Warrant) so any service provider can understand and process it.
- **Providing a canonical ledger** (Canon Registry) that anchors cryptographic digests of warrants, attestations, and receipts.
- **Enabling optional proof tokens** (Mask SBTs) that function as soulbound acknowledgments of deletion.
- **Ensuring privacy** through canonicalization and subject-tag hashing that prevent re-identification.

## 2. Architectural Overview

Null Protocol follows a three-tier architecture:

- **User Layer** – individuals submit deletion requests (warrants) and receive receipts.
- **Enterprise Layer** – organizations (implementers) accept warrants, perform deletions, and issue attestations.
- **Blockchain Layer** – Ethereum smart contracts provide a tamper-resistant append-only ledger and optional receipt tokens.

A relay service (the "Null Engine") mediates interactions among these layers.

## 3. Core Components

### 3.1 Canon Registry (Smart Contract)

- **Roles:** `RELAYER_ROLE` for anchoring; `TREASURY_ROLE` for fee withdrawal.
- **Fee Split:** 1/13 foundation tithe, 12/13 implementer share.
- **Anchoring Functions:** Separate functions for warrants, attestations, and receipts, each emitting events to record metadata.
- **Security:** Uses OpenZeppelin's AccessControl, Pausable, and ReentrancyGuard.

### 3.2 Mask SBT (Smart Contract)

ERC‑721‑based soulbound token:

- Minting & transfers disabled by default.
- `MINTER_ROLE` gates receipt issuance.
- Admin controls to toggle transferability or burn tokens.
- Tracks receipt hashes and statistics for accountability.

### 3.3 Null Engine Relayer

Express.js backend orchestrating:

- Payload validation (Zod schemas).
- Canonicalization and digest computation (Blake3).
- Subject-tag generation (HMAC-Blake3).
- On-chain anchoring via ethers.js-based Canon and SBT services.
- Optional SBT minting and enterprise callbacks.
- Security middleware: Helmet, CORS, rate limiting, structured logging.

## 4. Protocol Flows

### 4.1 Warrant Submission

1. User submits a Null Warrant JSON document to the relayer.
2. Relayer validates schema, canonicalizes JSON, computes digest and subject tag.
3. Relayer anchors warrant hash on-chain (Canon Registry) with fee payment.
4. Relayer returns a response containing the digest, subject tag, and transaction details.

### 4.2 Attestation

1. Implementer records deletion internally and issues a Deletion Attestation.
2. Attestation undergoes the same canonicalization and anchoring process.
3. Anchoring emits an event, providing auditability of the implementer's action.

### 4.3 Receipt (Mask SBT) – Optional

1. After successful anchoring, the relayer (if configured) mints a Mask SBT to the subject.
2. SBT records the receipt hash, timestamp, and optional metadata.
3. Because SBTs are soulbound, they serve as a non-transferable proof of deletion.

## 5. Cryptographic Primitives

- **Canonicalization:** JSON data normalized per the JSON Canonicalization Scheme (JCS) to ensure deterministic hashing.
- **Hashing:** Blake3 employed for efficiency and collision resistance.
- **Subject Tags:** HMAC-Blake3, using a secret salt, produces non-reversible tags to prevent linking across requests.
- **Signatures:** Supports JSON Web Signatures (JWS) using Ed25519 or Secp256k1. Implementers may reference Decentralized Identifiers (DIDs) like `did:web` or `did:ethr` for public key discovery.

## 6. Data Schemas

`schemas/` houses JSON schemas that define the shape of:

- **Null Warrant** – deletion request with metadata such as subject ID, data categories, and expiration.
- **Deletion Attestation** – statement by an implementer confirming deletion.
- **Receipt** – optional SBT minting metadata.

These schemas ensure interop between different implementations and underpin validation logic in the relayer.

## 7. Smart Contract Details

### 7.1 CanonRegistry Functions

```solidity
anchorWarrant(bytes32 digest, bytes32 subjectTag, uint8 assurance)
anchorAttestation(bytes32 digest, bytes32 subjectTag, uint8 assurance)
anchorReceipt(bytes32 digest, address to)
```

Each emits an event and updates internal mappings for last anchor, fee stats, and counts.

### 7.2 Fee Mechanism

- **Ritual Cost:** Each anchor requires `msg.value`; the contract splits the payment according to the 12/13 vs 1/13 rule.
- **Pull Payments:** Foundation and implementers withdraw funds individually, minimizing attack surface.

### 7.3 MaskSBT Functions

- `mint(address to, bytes32 receiptHash)` gated by `MINTER_ROLE`.
- Transfers are disabled unless `transferEnabled` feature flag is set.
- Metadata includes counters for minted/burned receipts.

## 8. Relayer Service Detail

### 8.1 API Endpoints

- `POST /api/v1/warrants`
- `POST /api/v1/attestations`
- `GET /api/v1/status/:id`
- `GET /health`

### 8.2 Services

- **CanonService:** Wraps ethers.js contract calls to CanonRegistry.
- **SBTService:** Handles MaskSBT interactions (mint, burn, etc.).
- **CryptoService:** Currently stubs for hashing, HMAC, signature verification.
- **EmailService:** Placeholder for notifications or callbacks.

### 8.3 Logging & Monitoring

- Winston-based logger: JSON logs to files, console output in non-production.
- Rate limiter to prevent abuse.
- Error middleware standardizes responses.

## 9. Security & Assurance Levels

The protocol defines three assurance tiers:

### High Assurance

- JWS signatures, DID-based key resolution.
- Mutually authenticated TLS.
- Optional KMS-backed key storage.

### Medium Assurance

- JWT and mutual TLS without DID resolution.

### Low Assurance

- DKIM and HTTPS.

Contracts rely on audited OpenZeppelin libraries. Relayer aims to handle uncaught exceptions, unhandled rejections, and implement retry logic to maintain availability.

## 10. Privacy Considerations

- **Zero PII:** No direct personal data stored on-chain or in logs.
- **Subject Tags:** HMAC-based tags prevent correlation, even if the same subject submits multiple warrants.
- **Receipts Optionality:** SBT minting can be disabled entirely for high-privacy scenarios.

## 11. Economic Model

Anchoring fees incentivize network participants:

- Implementers recover costs for processing deletions via fee shares.
- Foundation receives a tithe to maintain the protocol.
- Fixed ratios resist economic capture and ensure sustainability.

## 12. Governance & Ecosystem

While the codebase is currently managed by the Null Foundation, future governance may include:

- DAO-style voting on contract upgrades.
- Standardization bodies to ratify schema changes.
- Ecosystem integrations (e.g., data brokers, privacy centers).

## 13. Reference Implementation

The repository provides a reference implementation:

- **Contracts:** Hardhat + Solidity.
- **Relayer:** Node.js/TypeScript with Express.
- **Schemas:** JSON definitions consumed by both on-chain and off-chain components.
- **Tests:** Jest scaffolding; developers are expected to expand coverage as features mature.

## 14. Roadmap

### Production Cryptography

- Replace stubs with verified implementations (Ed25519, Secp256k1, Blake3 libs).
- Integrate DID resolution and mTLS enforcement.

### Contract Hardening

- Add failure modes, gas optimizations, and event indexing improvements.
- Formal verification for high-assurance deployments.

### Monitoring & Alerts

- Publish metrics for anchoring events, failure rates, gas costs.
- Detection of resurfacing or non-compliance.

### Developer Experience

- CLI/SDK for warrant generation and verification.
- Dashboard for tracking deletion proofs.

## 15. Conclusion

Null Protocol establishes a transparent, interoperable framework for verifiable data deletion. Its modular design—pairing canonical off-chain artifacts with on-chain proofs—bridges legal rights and technical enforcement. Future expansions in cryptography, assurance, and tooling will further solidify its role as a foundational privacy layer on the web.
