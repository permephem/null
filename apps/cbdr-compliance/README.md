# 🌍 Cross-Border Data Regulation (CBDR) Compliance API

**Real-time GDPR compliance for international data transfers**

## Overview

The CBDR Compliance API provides real-time decisioning for cross-border data transfers under GDPR Article 45 (adequacy), Article 46 (SCCs/BCRs), and Article 49 (derogations). This system enables enterprises to check transfer compliance before moving data across borders.

## Features

- **Real-time Transfer Decisions**: Instant compliance checks for data transfers
- **Multi-Legal Basis Support**: Adequacy decisions, SCCs, BCRs, and derogations
- **Vendor Attestation Registry**: Self-attested vendor certifications and compliance programs
- **Audit Trail**: Immutable logging with JWS signatures for regulatory compliance
- **Intelligent Caching**: TTL-based caching with instant invalidation on regulatory changes
- **Webhook Integration**: Real-time notifications for audit streams

## API Endpoints

### Transfer Compliance Check
```http
POST /api/v1/transfer/check
```

**Request:**
```json
{
  "origin_country": "DE",
  "destination_country": "US", 
  "vendor_id": "aws",
  "processing_context": {
    "controller": "Acme Corp GmbH",
    "purpose": "Cloud Storage",
    "data_categories": ["personal_data"],
    "special_categories": false
  },
  "claimed_legal_basis": "ART45_ADEQUACY",
  "transfer_date": "2025-09-21T16:00:00Z",
  "client_ref": "transfer-12345"
}
```

**Response:**
```json
{
  "request_id": "cbdr_01JES5Q2R6E2A6PH6A3VQ6TS1D",
  "decision": "ALLOW",
  "legal_basis_resolved": "ART45_ADEQUACY",
  "rationale": "US has adequacy decision under EU-US Data Privacy Framework.",
  "machine_rationale": {
    "rules": ["adequacy(US)==true"],
    "evidence": ["eu_us_dpf_adequacy_2023"]
  },
  "references": [
    {"title": "EU-US Data Privacy Framework", "url": "https://eur-lex.europa.eu/..."}
  ],
  "audit": {
    "audit_token": "aud_01JES5Q3M5V9N4C",
    "timestamp": "2025-09-21T16:00:01Z",
    "client_ref": "transfer-12345"
  },
  "cache_ttl_seconds": 86400,
  "signature": "jws_..."
}
```

### Vendor Attestation Management
```http
POST /api/v1/vendors/attest
GET /api/v1/vendors/{vendor_id}/attestations
```

### Regulatory Data Sources
```http
GET /api/v1/regulatory/adequacy-decisions
GET /api/v1/regulatory/scc-updates
```

## Architecture

### Core Components

1. **Decision Engine**: Evaluates transfer requests against regulatory rules
2. **Vendor Registry**: Manages vendor attestations and certifications
3. **Regulatory Data Ingestion**: Pulls updates from EU Commission, ICO, etc.
4. **Audit System**: Immutable logging with cryptographic signatures
5. **Caching Layer**: Intelligent TTL-based caching with invalidation
6. **Webhook System**: Real-time notifications for audit streams

### Data Flow

1. **Transfer Request** → Decision Engine
2. **Decision Engine** → Checks adequacy, SCCs, derogations
3. **Decision** → Cached with appropriate TTL
4. **Audit Log** → Signed and stored immutably
5. **Webhook** → Notifies subscribers (optional)

## Legal Basis Support

### Article 45 - Adequacy Decisions
- EU Commission adequacy decisions
- Real-time status updates
- Long TTL caching (24 hours)

### Article 46 - Standard Contractual Clauses (SCCs)
- SCC Module 1, 2, 3 support
- Vendor attestation verification
- Transfer Impact Assessment (TIA) requirements
- Medium TTL caching (1 hour)

### Article 49 - Derogations
- Vital interests, public interest, legitimate interests
- Scope limitations and retention limits
- No caching (immediate re-evaluation)

## Security & Compliance

- **JWS Signatures**: All responses cryptographically signed
- **Audit Tokens**: Unique identifiers for regulatory investigations
- **SOC 2 Ready**: Security controls and monitoring
- **GDPR Compliant**: Privacy-preserving design
- **Immutable Logs**: Blockchain-style audit trail

## Integration

### Enterprise DLP/SIEM
```bash
curl -X POST https://cbdr.nullprotocol.org/api/v1/transfer/check \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"origin_country": "DE", "destination_country": "US", ...}'
```

### Privacy Ops Platforms
- OneTrust integration
- BigID connector
- Transcend webhook

## Deployment

```bash
# Start the CBDR API
npm run start

# Run with Docker
docker-compose up cbdr-api

# Kubernetes deployment
kubectl apply -f deploy/k8s/cbdr-api.yaml
```

## Monitoring

- **Health Check**: `/health`
- **Metrics**: Prometheus-compatible metrics
- **Logs**: Structured JSON logging
- **Alerts**: Regulatory change notifications

## License

Apache 2.0 - See LICENSE file for details.
