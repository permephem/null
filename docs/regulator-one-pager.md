# Null Protocol — Verifiable Ticket Transfer & Revocation (Canon)

## Problem

Secondary ticket markets regularly enable extreme price inflation, fraud, and consumer harm. Today's systems lack a shared, tamper-evident record of who currently holds a ticket and whether a resale was authorized. Without independent verification, venues face chargebacks, fans face gouging, and regulators face opacity.

## Solution (What Canon Provides)

Null Protocol's Canon is a neutral, append-only ledger that records the facts of a ticket's lifecycle: issuance, transfer, and revocation. No personal data is written on-chain—only cryptographic commitments and signed evidence pointers. Any venue, marketplace, or regulator can verify the current legitimate holder and whether a resale followed policy (price caps, time windows, KYC).

## How It Works (Summary)

1. **Issuance**: Venue issues a ticket and anchors an issuance record to Canon (commitments only).
2. **Transfer**: Approved resales anchor a transfer record, updating the legitimate holder.
3. **Revocation**: Policy breaches (scalping, fraud) anchor a revocation record—a public tombstone.
4. **Verification**: At the gate, a fast Canon check confirms validity with <150ms latency via local indexing.

## Privacy by Design

- **No PII on-chain**.
- **Holder is represented by a venue-derived privacy tag (HMAC)**.
- **Evidence is signed and pinned (IPFS/Arweave) with redactions**.
- **Selective disclosure for regulators is supported**.

## Benefits

- **For Fans**: Fair-price resale, fewer scams, clear recourse.
- **For Venues/Promoters**: Reduced chargebacks and disputes; portable enforcement against rogue markets.
- **For Regulators**: Audit-ready transparency without exposing personal data.
- **For Marketplaces**: Interoperability; simple integration via SDK/API.

## Adoption Model

- **No rip-and-replace**. Venues keep existing ticketing; Canon is a thin verification layer.
- **Integration is one API call** (issue/transfer/revoke/verify) using our SDK and relayer.
- **White-label friendly**: incumbents can integrate Canon quietly, retain their UI, and improve compliance.

## Safeguards & Assurance

- **Assurance tiers**: DKIM → DID/JWS → HSM/TEE → Zero-Knowledge proof (roadmap).
- **Full audit trail**: Canon events + signed evidence packages.
- **Reliability**: local caches and signed offline allowlists for at-venue scanning.

## Policy Alignment

- **Enables enforceable price caps and anti-scalping**.
- **Creates a standardized, regulator-verifiable record of lawful transfers**.
- **Lowers consumer harm and increases trust in secondary markets**.

## What We're Asking

- **Regulators**: Recognize Canon events as admissible provenance for ticket ownership and resale compliance; convene a pilot with a venue chain.
- **Venues/Promoters**: Run a controlled pilot (2–3 events). We provide SDKs, SLAs, and transparency reporting.
- **Marketplaces**: Honor Canon transfers and revocations; gain compliant inventory and improved trust.

## Contact

- **Integration**: engineering@nullprotocol.org
- **Policy & Pilots**: policy@nullprotocol.org
- **Website**: nullprotocol.org

> "A simple, verifiable check that turns scalping from a grey market into a transparent, enforceable flow—without tracking people."
