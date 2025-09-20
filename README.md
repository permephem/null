# Null Protocol

A comprehensive ecosystem of production-ready, privacy-preserving SDKs built on Ethereum with IPFS evidence storage. The Null Protocol provides verifiable, transparent, and secure data management across multiple industries including ticketing, healthcare, and more.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/your-org/null-protocol.git
cd null-protocol

# Start the complete stack
make up

# Run smoke tests
make seed

# Check logs
make logs
```

## 📋 Service Level Objectives (SLOs)

- **Relayer API availability**: 99.9% monthly
- **Verify latency (p95)**: < 150ms with warm cache; < 300ms end-to-end
- **Canon anchor success**: > 99.5% within 60s (with auto-retry)
- **Evidence pin success**: > 99.9%

## 🏗️ Architecture

The Null Protocol ecosystem consists of multiple specialized SDKs, each built on a common foundation of Canon blockchain anchoring, IPFS evidence storage, and PostgreSQL indexing.

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
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Ticket SDK     │    │ Healthcare SDK  │    │  Future SDKs    │
│  (Verification) │    │  (HIPAA)        │    │  (Supply Chain) │
│                 │    │                 │    │                 │
│ • Carfax-like   │    │ • Consent Mgmt  │    │ • Provenance    │
│   History       │    │ • Medical       │    │ • Compliance    │
│ • Escrow        │    │   Records       │    │ • Tracking      │
│ • Compliance    │    │ • Clinical      │    │                 │
│                 │    │   Trials        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ SDK Components

### 🎫 Ticket Verification SDK (`apps/ticket-verification/`)
- **"Carfax for Tickets"**: Complete ownership history and verification
- **Escrow System**: Secure purchase with automatic verification
- **Compliance Tracking**: Monitor resale rules and markup limits
- **Venue Control**: Revocation and fraud prevention
- **API**: `/tickets/{id}/history`, `/escrow/create`, `/tickets/{id}/verify`

### 🏥 Healthcare SDK (`apps/healthcare-sdk/`)
- **HIPAA Compliant**: Privacy-preserving medical data management
- **Consent Management**: Granular patient consent tracking
- **Medical Records**: Immutable audit trail for healthcare data
- **Clinical Trials**: Participant tracking and data provenance
- **API**: `/consent/grant`, `/records/anchor`, `/access/log`

### 🔧 Core Infrastructure

#### Relayer APIs
- **Ticket Relayer** (`apps/relayer-tickets/`): Port 8787
- **Healthcare Relayer** (`apps/healthcare-sdk/`): Port 8787
- **Features**: Issue, transfer, revoke, and verify operations
- **Security**: API key auth, rate limiting, replay protection
- **Monitoring**: Prometheus metrics, health checks

#### Indexers
- **Ticket Indexer** (`apps/indexer-tickets/`): Canon ticket events
- **Healthcare Indexer** (`apps/healthcare-sdk/`): Medical records & consent
- **Database**: PostgreSQL with event log and current state
- **Function**: Tails Canon events in real-time
- **Recovery**: Backfill scripts for crash recovery

#### Client Applications
- **Scanner PWA** (`apps/scanner-pwa/`): Mobile ticket verification
- **Patient Portal** (`apps/healthcare-sdk/`): Healthcare consent management
- **Buyer App** (`apps/ticket-verification/`): Ticket verification interface
- **Features**: QR scanning, holder proof validation, consent management

#### Pinning Adapter (`apps/pinning-adapter/`)
- **Function**: IPFS evidence storage with JWT auth
- **Endpoints**: JSON and binary pinning
- **Integration**: Seamless relayer integration across all SDKs

## 🔧 Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git
- Foundry (for contracts)

### Local Development
```bash
# Install dependencies
npm install --workspaces

# Start development stack
make up

# Run tests
make test

# Format code
make fmt
```

### API Testing
```bash
# Run ticket verification smoke tests
bash apps/ticket-verification/ops/curl-examples.sh

# Run healthcare smoke tests
bash apps/healthcare-sdk/ops/curl-examples.sh

# Manual ticket testing
curl -X POST http://localhost:8787/tickets/issue \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-123" \
  -d '{"eventId":"test","seat":"A1","holderIdentifier":"user123","policy":{}}'

# Manual healthcare testing
curl -X POST http://localhost:8787/consent/grant \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-api-key-123" \
  -d '{"patientId":"patient123","purpose":"treatment","dataTypes":["medical_records"]}'
```

## 🚀 Deployment

### Docker Compose (Recommended)
```bash
# Production deployment
docker-compose -f deploy/docker-compose.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f relayer-tickets
```

### Kubernetes
```bash
# Deploy with Helm
helm install null-protocol ./deploy/k8s

# Check status
kubectl get pods -l app.kubernetes.io/name=relayer-tickets
```

### Environment Configuration
```bash
# Core infrastructure
RPC_URL=https://mainnet.infura.io/v3/xxx
RELAYER_PK=0xabcdef... # Store in KMS/HSM

# Ticket SDK
CANON_ADDRESS=0xCanonRegistryAddress
CANON_TICKET_ADDRESS=0xCanonTicketVerificationAddress
VENUE_HMAC_KEY=change-me-super-secret

# Healthcare SDK
CANON_HEALTH_ADDRESS=0xCanonHealthAddress
PATIENT_SALT=change-me-patient-salt
PROVIDER_SALT=change-me-provider-salt

# IPFS & Database
PINNER_BASE=http://localhost:8789
PGHOST=127.0.0.1
PGDATABASE=null_indexer
```

## 📊 Monitoring

### Metrics Endpoint
```bash
curl http://localhost:8787/metrics
```

### Key Metrics
- **Ticket SDK**: Request rate, verification success, escrow completion, compliance rates
- **Healthcare SDK**: Consent grants/revokes, record access, breach detection, audit events
- **Core Infrastructure**: Canon anchoring success/failure, IPFS pinning success, database performance
- **System-wide**: Error rates, response times, SLO compliance

### Grafana Dashboard
Import `ops/dashboards/relayer-dashboard.json` for comprehensive monitoring.

### Prometheus Alerts
Configure `ops/alerts.yml` for automated alerting on:
- High error rates (>5%)
- Canon anchor latency (>2s)
- Service downtime
- SLO breaches

## 🔒 Security

### Authentication
- **API Keys**: Required for all ticket operations
- **Rate Limiting**: 100 requests/minute per IP
- **Session Tokens**: Short-lived tokens in QR payloads
- **CORS**: Restricted to scanner domains

### Data Protection
- **No PII**: Only commitments and tags stored
- **Encryption**: TLS for transit, database encryption at rest
- **Key Management**: AWS KMS or GCP KMS for secrets
- **Audit Trail**: Immutable Canon blockchain records

### Threat Model
See [SECURITY.md](SECURITY.md) for comprehensive threat analysis and controls.

## 📚 Documentation

### User Guides
- **[Ticketing System User Guide](docs/ticketing-system-user-guide.md)** - Complete guide for buyers, sellers, venues, and marketplaces
- **[Ticketing System Developer Guide](docs/ticketing-system-developer-guide.md)** - Technical integration guide for developers
- **[Ticketing System Quick Reference](docs/ticketing-system-quick-reference.md)** - Essential commands and patterns
- **[Healthcare System User Guide](docs/healthcare-system-user-guide.md)** - Complete guide for patients, providers, researchers, and administrators
- **[Healthcare System Developer Guide](docs/healthcare-system-developer-guide.md)** - Technical integration guide for healthcare developers
- **[Healthcare System Quick Reference](docs/healthcare-system-quick-reference.md)** - Essential commands and patterns for healthcare
- **[Credit Repair Solution](docs/credit-repair-solution.md)** - Blockchain-based credit repair with permanent deletion
- **[Identity Theft Protection Solution](docs/identity-theft-protection-solution.md)** - Proactive fraud prevention with guaranteed resolution

### API Documentation

#### OpenAPI Specification
- **File**: `OPENAPI.relayer.yaml`
- **Interactive**: Import into Postman/Insomnia
- **Generation**: Auto-generated from code annotations

#### Key Endpoints

##### Ticket Verification SDK
- `GET /tickets/{id}/history` - Complete Carfax-like ticket history
- `POST /tickets/{id}/verify` - Pre-purchase verification
- `POST /escrow/create` - Create secure escrow
- `POST /escrow/{id}/complete` - Complete escrow after verification

##### Healthcare SDK
- `POST /consent/grant` - Grant patient consent
- `POST /consent/revoke` - Revoke patient consent
- `POST /records/anchor` - Anchor medical record
- `POST /access/log` - Log data access for audit

#### Core Infrastructure
- `GET /healthz` - Health check
- `GET /metrics` - Prometheus metrics

## 🔄 Operations

### Daily Operations
```bash
# Check service health
make logs

# Monitor metrics
curl http://localhost:8787/metrics

# Run smoke tests
make seed
```

### Event Day Operations
1. Generate offline snapshot: `tsx src/offline-snapshot.ts venue event`
2. Distribute to scanners
3. Monitor verification latency
4. Have grace mode ready if Canon unavailable

### Recovery Procedures
- **Indexer crash**: `tsx src/backfill.ts --from-block=12345`
- **Canon unavailable**: Switch to offline mode
- **Database corruption**: Restore from backup

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
make up
make seed
```

### Smart Contract Tests
```bash
forge test
```

## 📖 Documentation

### SDK-Specific Documentation
- **Ticket Verification**: [apps/ticket-verification/README.md](apps/ticket-verification/README.md)
- **Healthcare**: [apps/healthcare-sdk/README.md](apps/healthcare-sdk/README.md)
- **Deployment Guides**: [apps/ticket-verification/docs/](apps/ticket-verification/docs/), [apps/healthcare-sdk/docs/](apps/healthcare-sdk/docs/)

### API Documentation
- **Ticket API**: [apps/ticket-verification/OPENAPI.verification.yaml](apps/ticket-verification/OPENAPI.verification.yaml)
- **Healthcare API**: [apps/healthcare-sdk/OPENAPI.healthcare.yaml](apps/healthcare-sdk/OPENAPI.healthcare.yaml)
- **Core API**: [OPENAPI.relayer.yaml](OPENAPI.relayer.yaml)

### Compliance & Security
- [Security Guide](SECURITY.md)
- [HIPAA Compliance](apps/healthcare-sdk/docs/HIPAA_COMPLIANCE.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Production Deployment](README-PRODUCTION.md)

### Consumer Protection
- [Canon Ticket Consumer Bill of Rights](docs/canon-ticket-consumer-bill-of-rights.md)
- [Canon Code of Conduct for Sellers & Venues](docs/canon-code-of-conduct-sellers-venues.md)
- [Canon Ticketing Addendum: Escrow & Consumer Protection](docs/canon-ticketing-addendum-escrow-consumer-protection.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/null-protocol/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/null-protocol/discussions)
- **Security**: security@null.xyz
- **General**: contact@null.xyz

## 🎯 Roadmap

### Short Term
- [ ] **Ticket SDK**: QR camera integration, advanced compliance rules
- [ ] **Healthcare SDK**: DID/JWS evidence signing, clinical trial management
- [ ] **Core**: EIP-712 typed data, Redis rate limiting
- [ ] **Infrastructure**: Multi-tenant support, advanced monitoring

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

---

**Built with ❤️ by the Null Protocol team**