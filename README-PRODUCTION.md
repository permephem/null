# Null Protocol Production Stack

A complete, containerized production stack for the Null Protocol SDK ecosystem with IPFS pinning, security hardening, and observability. This includes the Ticket Verification SDK ("Carfax for Tickets"), Healthcare SDK (HIPAA-compliant medical data management), Credit Repair SDK (permanent deletion with consumer protection), Digital Estate SDK (guaranteed account closure and post-mortem data management), and Adtech Opt-Out SDK (unified opt-out enforcement with violation detection).

## Architecture

The Null Protocol production stack supports multiple specialized SDKs built on a common infrastructure foundation.

### Core Infrastructure
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  Relayer APIs   │    │  Indexers       │
│   (React/RN)    │───▶│  (Fastify)      │───▶│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Pinning Adapter │    │   Canon Chain   │
                       │   (IPFS)        │    │   (Ethereum)    │
                       └─────────────────┘    └─────────────────┘
```

### SDK Ecosystem
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Ticket SDK     │    │ Healthcare SDK  │    │  Credit SDK     │    │  Digital        │    │  Adtech         │
│  (Verification) │    │  (HIPAA)        │    │  (Repair &      │    │  Estate SDK     │    │  Opt-Out SDK    │
│                 │    │                 │    │   Identity)     │    │  (Post-Mortem)  │    │  (Do Not Track) │
│ • Carfax-like   │    │ • Consent Mgmt  │    │ • Credit Repair │    │ • Account       │    │ • Unified       │
│   History       │    │ • Medical       │    │ • Identity      │    │   Closure       │    │   Opt-Outs      │
│ • Escrow        │    │   Records       │    │   Protection    │    │ • Fraud         │    │ • Violation     │
│ • Compliance    │    │ • Clinical      │    │ • Permanent     │    │   Prevention    │    │   Detection     │
│                 │    │   Trials        │    │   Deletion      │    │ • Estate        │    │ • Consumer      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repo>
   cd null-protocol
   
   # Configure Ticket SDK
   cp apps/relayer-tickets/env.example apps/relayer-tickets/.env
   cp apps/indexer-tickets/env.example apps/indexer-tickets/.env
   cp apps/ticket-verification/env.example apps/ticket-verification/.env
   
   # Configure Healthcare SDK
   cp apps/healthcare-sdk/env.example apps/healthcare-sdk/.env
   
   # Configure Credit Repair SDK
   cp apps/credit-repair/env.example apps/credit-repair/.env
   
   # Configure Digital Estate SDK
   cp apps/digital-estate/env.example apps/digital-estate/.env
   
   # Configure Adtech Opt-Out SDK
   cp apps/adtech-optout/env.example apps/adtech-optout/.env
   ```

2. **Configure environment:**
   ```bash
   # Edit .env files with your actual values
   # - RPC_URL: Ethereum RPC endpoint
   # - CANON_ADDRESS: CanonRegistry contract address
   # - CANON_TICKET_ADDRESS: CanonTicketVerification contract address
   # - CANON_HEALTH_ADDRESS: CanonHealth contract address
   # - RELAYER_PK: Private key for relayer wallet
   ```

3. **Start the stack:**
   ```bash
   docker-compose up -d
   ```

4. **Verify services:**
   ```bash
   # Check all services are healthy
   docker-compose ps
   
   # Test ticket relayer health
   curl http://localhost:8787/healthz
   
   # Test healthcare relayer health
   curl http://localhost:8788/healthz
   
   # Test IPFS gateway
   curl http://localhost:8080/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme
   
   # Run smoke tests
   bash apps/ticket-verification/ops/curl-examples.sh
   bash apps/healthcare-sdk/ops/curl-examples.sh
   ```

## Services

### 🎫 Ticket Verification SDK

#### Ticket Relayer API (`apps/relayer-tickets/`)
- **Port:** 8787
- **Endpoints:**
  - `POST /tickets/issue` - Issue new tickets
  - `POST /tickets/transfer` - Transfer tickets
  - `POST /tickets/revoke` - Revoke tickets
  - `POST /tickets/verify` - Verify tickets at gates
  - `GET /metrics` - Prometheus metrics
  - `GET /healthz` - Health check

#### Ticket Verification API (`apps/ticket-verification/`)
- **Port:** 8787 (alternative port)
- **Endpoints:**
  - `GET /tickets/{id}/history` - Complete Carfax-like ticket history
  - `POST /tickets/{id}/verify` - Pre-purchase verification
  - `POST /escrow/create` - Create secure escrow
  - `POST /escrow/{id}/complete` - Complete escrow after verification

#### Ticket Indexer (`apps/indexer-tickets/`)
- **Database:** PostgreSQL
- **Function:** Tails Canon events and maintains current state
- **Tables:**
  - `canon_ticket_events` - Immutable event log
  - `tickets_current_state` - Materialized current state

#### Scanner PWA (`apps/scanner-pwa/`)
- **Port:** 5173 (dev), static build (prod)
- **Function:** Mobile-friendly ticket verification interface
- **Features:**
  - Manual ticket payload input
  - Holder proof verification
  - Real-time verification results

#### Buyer App (`apps/ticket-verification/`)
- **Function:** Complete ticket verification interface
- **Features:**
  - Carfax-like ticket history display
  - Pre-purchase verification
  - Secure escrow creation
  - Risk assessment and compliance checking

### 🏥 Healthcare SDK

#### Healthcare Relayer API (`apps/healthcare-sdk/`)
- **Port:** 8788
- **Endpoints:**
  - `POST /consent/grant` - Grant patient consent
  - `POST /consent/revoke` - Revoke patient consent
  - `POST /records/anchor` - Anchor medical record
  - `POST /access/log` - Log data access for audit
  - `GET /audit/log` - Get audit trail
  - `GET /stats` - Healthcare statistics

#### Healthcare Indexer (`apps/healthcare-sdk/`)
- **Database:** PostgreSQL
- **Function:** Tails CanonHealth events and maintains consent/record state
- **Tables:**
  - `healthcare_events` - Immutable healthcare event log
  - `patient_consent_status` - Current consent status
  - `record_access_log` - Data access tracking
  - `breach_reports` - Security breach reports

#### Patient Portal (`apps/healthcare-sdk/`)
- **Function:** HIPAA-compliant patient consent management
- **Features:**
  - Granular consent controls
  - Real-time consent status
  - Medical record verification
  - Privacy notices and compliance information

### 🔧 Core Infrastructure

#### Pinning Adapter (`apps/pinning-adapter/`)
- **Port:** 8789
- **Function:** IPFS pinning service for evidence storage
- **Endpoints:**
  - `POST /pin/json` - Pin JSON evidence
  - `POST /pin/buffer` - Pin binary data
  - `GET /healthz` - Health check

**Security Features (All Services):**
- API key authentication for all endpoints
- Rate limiting (100 req/min per IP)
- Replay protection via session tokens
- Request/response metrics and error tracking
- HIPAA compliance for healthcare services

## Production Deployment

### Environment Variables

**Core Infrastructure:**
```bash
RPC_URL=https://mainnet.infura.io/v3/xxx
RELAYER_PK=0xabcdef... # Store in KMS/HSM
PINNER_BASE=http://pinning-adapter:8789
PINNER_TOKEN=change-me
```

**Ticket SDK:**
```bash
PORT=8787
VENUE_HMAC_KEY=change-me-super-secret
CANON_ADDRESS=0xCanonRegistryAddress
CANON_TICKET_ADDRESS=0xCanonTicketVerificationAddress
FOUNDATION_ADDRESS=0xFoundation
FEE_WEI_ISSUE=0
FEE_WEI_TRANSFER=0
FEE_WEI_REVOKE=0
```

**Healthcare SDK:**
```bash
PORT=8788
CANON_HEALTH_ADDRESS=0xCanonHealthAddress
PATIENT_SALT=change-me-patient-salt
PROVIDER_SALT=change-me-provider-salt
```

**Database (Shared):**
```bash
PGHOST=postgres
PGPORT=5432
PGDATABASE=null_indexer
PGUSER=null_user
PGPASSWORD=change-me
START_BLOCK=0
CONFIRMATIONS=5
```

### Security Checklist

**Core Security:**
- [ ] Store `RELAYER_PK` in KMS/HSM (AWS KMS, Hashicorp Vault)
- [ ] Enable HTTPS with valid certificates
- [ ] Set up proper firewall rules
- [ ] Configure database backups and WAL archiving
- [ ] Set up monitoring and alerting

**Ticket SDK Security:**
- [ ] Rotate venue HMAC keys quarterly
- [ ] Use proper API key management for venues
- [ ] Review evidence for PII leakage
- [ ] Configure escrow timeouts and limits

**Healthcare SDK Security:**
- [ ] Ensure HIPAA compliance for all components
- [ ] Rotate patient and provider salts quarterly
- [ ] Configure audit logging for all data access
- [ ] Set up breach detection and notification
- [ ] Review evidence for PHI leakage
- [ ] Configure data retention policies

### Observability

**Metrics Endpoints:** `GET /metrics` (per service)

**Ticket SDK Metrics:**
```json
{
  "ticket_requests_total": 1234,
  "ticket_requests_by_endpoint": {
    "/tickets/verify": 800,
    "/tickets/issue": 200,
    "/tickets/transfer": 150,
    "/tickets/revoke": 84
  },
  "escrow_creations_total": 150,
  "escrow_completions_total": 145,
  "verification_decisions": {
    "ALLOW": 750,
    "DENY": 50
  },
  "compliance_violations_total": 12
}
```

**Healthcare SDK Metrics:**
```json
{
  "healthcare_requests_total": 567,
  "healthcare_requests_by_endpoint": {
    "/consent/grant": 200,
    "/consent/revoke": 50,
    "/records/anchor": 250,
    "/access/log": 67
  },
  "consent_grants_total": 200,
  "consent_revokes_total": 50,
  "breach_reports_total": 2,
  "audit_events_total": 567
}
```

**Core Infrastructure Metrics:**
```json
{
  "canon_anchors_total": 434,
  "canon_anchor_failures": 2,
  "ipfs_pins_total": 1000,
  "ipfs_pin_failures": 5,
  "avg_response_time_ms": 45.2,
  "errors_total": 5
}
```

**Health Checks:**
- Ticket Relayer: `GET /healthz` (port 8787)
- Healthcare Relayer: `GET /healthz` (port 8788)
- Ticket Indexer: Database connectivity
- Healthcare Indexer: Database connectivity
- Pinning Adapter: `GET /healthz` (port 8789)
- IPFS: `ipfs id` command

### Operational Runbook

**Daily Operations:**
1. Check service health: `docker-compose ps`
2. Monitor ticket metrics: `curl http://localhost:8787/metrics`
3. Monitor healthcare metrics: `curl http://localhost:8788/metrics`
4. Check Canon anchoring success rate
5. Verify IPFS pinning is working
6. Review audit logs for healthcare compliance

**Event Day Operations:**
1. Generate offline snapshot: `tsx src/offline-snapshot.ts venue event`
2. Distribute snapshot to scanners
3. Monitor verification latency (<300ms target)
4. Have grace mode ready if Canon unavailable

**Recovery Procedures:**
1. **Ticket Indexer crash:** Run backfill script: `tsx apps/indexer-tickets/src/backfill.ts --from-block=12345`
2. **Healthcare Indexer crash:** Run backfill script: `tsx apps/healthcare-sdk/src/backfill.ts --from-block=12345`
3. **Canon unavailable:** Switch to offline mode with signed snapshot
4. **Database corruption:** Restore from latest backup
5. **HIPAA breach:** Follow incident response procedures in healthcare docs

### Testing

**Contract Integration Tests:**
```bash
cd null-protocol
forge test --match-contract CanonRegistry
forge test --match-contract CanonTicketVerification
forge test --match-contract CanonHealth
```

**SDK Unit Tests:**
```bash
# Ticket SDK
cd apps/relayer-tickets && npm test
cd apps/ticket-verification && npm test

# Healthcare SDK
cd apps/healthcare-sdk && npm test
```

**End-to-End Tests:**
```bash
# Ticket SDK smoke tests
bash apps/ticket-verification/ops/curl-examples.sh

# Healthcare SDK smoke tests
bash apps/healthcare-sdk/ops/curl-examples.sh

# Manual ticket testing
curl -X POST http://localhost:8787/tickets/issue \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"eventId":"event123","seat":"A1","holderIdentifier":"user123","policy":{}}'

# Manual healthcare testing
curl -X POST http://localhost:8788/consent/grant \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"patientId":"patient123","purpose":"treatment","dataTypes":["medical_records"]}'
```

### CI/CD Pipeline

The GitHub Actions pipeline includes:
- Linting and testing
- Docker image building
- Container registry publishing
- Automated deployment to staging

**Manual Deployment:**
```bash
# Build and push images
docker-compose build
docker-compose push

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## Future Enhancements

### Short Term
- [ ] **Ticket SDK**: QR camera integration, advanced compliance rules
- [ ] **Healthcare SDK**: DID/JWS evidence signing, clinical trial management
- [ ] **Core**: EIP-712 typed data, Redis rate limiting, Prometheus metrics export

### Medium Term
- [ ] **Supply Chain SDK**: Product provenance and compliance tracking
- [ ] **Financial SDK**: KYC/AML compliance and transaction verification
- [ ] **TEE/ZK**: Advanced assurance tiers for all SDKs
- [ ] **Regulator Dashboard**: Cross-SDK compliance monitoring

### Long Term
- [ ] **Cross-chain Support**: Multi-blockchain anchoring
- [ ] **Decentralized Governance**: Community-driven SDK development
- [ ] **Advanced Privacy**: Zero-knowledge proofs for sensitive data
- [ ] **Enterprise Integrations**: Major platform partnerships

## Support

For production issues:
1. Check service logs: `docker-compose logs <service>`
2. Verify environment configuration
3. Check Canon contract status
4. Review metrics and health endpoints
5. Consult operational runbook

For SDK-specific questions:
- **Ticket SDK**: See [apps/ticket-verification/README.md](apps/ticket-verification/README.md)
- **Healthcare SDK**: See [apps/healthcare-sdk/README.md](apps/healthcare-sdk/README.md)
- **Core Infrastructure**: See individual README files in each app directory

For compliance questions:
- **HIPAA**: See [apps/healthcare-sdk/docs/HIPAA_COMPLIANCE.md](apps/healthcare-sdk/docs/HIPAA_COMPLIANCE.md)
- **Security**: See [SECURITY.md](SECURITY.md)
