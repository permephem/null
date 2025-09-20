# Null Protocol Healthcare SDK

A HIPAA-compliant, privacy-preserving healthcare data management system built on Ethereum with IPFS evidence storage.

## 🏥 Healthcare Use Cases

### Medical Records Management
- **Patient Consent Tracking**: Record and verify patient consent for data sharing
- **Medical Record Integrity**: Immutable audit trail for medical records
- **Cross-Provider Data Sharing**: Secure, consent-based data exchange
- **Research Participation**: Track patient consent for research studies

### Clinical Trials
- **Participant Consent**: Immutable consent records for trial participation
- **Data Provenance**: Track data collection and processing in trials
- **Regulatory Compliance**: FDA/EMA audit trail for trial data
- **Multi-site Coordination**: Secure data sharing between trial sites

### Insurance & Billing
- **Claims Verification**: Immutable proof of medical services rendered
- **Fraud Prevention**: Detect duplicate or fraudulent claims
- **Prior Authorization**: Track approval workflows for treatments
- **Audit Trails**: Complete audit trail for insurance claims

## 🔒 Privacy & Compliance

### HIPAA Compliance
- **No PHI on-chain**: Only cryptographic commitments and consent hashes
- **Access Controls**: Role-based access with audit trails
- **Data Minimization**: Only necessary data is processed
- **Right to Erasure**: Patient data deletion capabilities

### Regulatory Features
- **Audit Trails**: Complete audit trail for all data access
- **Consent Management**: Granular consent tracking and revocation
- **Data Portability**: Patient data export capabilities
- **Breach Notification**: Automated breach detection and notification

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Patient App    │    │ Healthcare API  │    │  Health Indexer │
│  (React/RN)     │───▶│  (Fastify)      │───▶│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Consent Manager │    │   CanonHealth   │
                       │   (IPFS)        │    │   (Ethereum)    │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development environment
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📋 Key Features

### Patient Consent Management
- **Granular Consent**: Per-purpose consent tracking
- **Consent Revocation**: Patient can revoke consent at any time
- **Consent Verification**: Real-time consent status checking
- **Audit Trail**: Complete consent history

### Medical Record Integrity
- **Immutable Records**: Medical records anchored to blockchain
- **Data Provenance**: Track data origin and modifications
- **Integrity Verification**: Verify record authenticity
- **Cross-Provider Sharing**: Secure data exchange

### Clinical Trial Management
- **Participant Tracking**: Track trial participants and consent
- **Data Collection**: Immutable data collection records
- **Regulatory Compliance**: FDA/EMA audit trails
- **Multi-site Coordination**: Secure inter-site data sharing

## 🔧 Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Foundry (for smart contracts)
- PostgreSQL 16+

### Local Development
```bash
# Start all services
docker-compose up -d

# Run tests
npm test

# Start development server
npm run dev
```

## 📚 Documentation

### User Guides
- **[Healthcare System User Guide](../../docs/healthcare-system-user-guide.md)** - Complete guide for patients, providers, researchers, and administrators
- **[Healthcare System Developer Guide](../../docs/healthcare-system-developer-guide.md)** - Technical integration guide for healthcare developers
- **[Healthcare System Quick Reference](../../docs/healthcare-system-quick-reference.md)** - Essential commands and patterns for healthcare

## 📚 API Documentation

### Core Endpoints
- `POST /consent/grant` - Grant patient consent
- `POST /consent/revoke` - Revoke patient consent
- `GET /consent/status` - Check consent status
- `POST /records/anchor` - Anchor medical record
- `GET /records/verify` - Verify record integrity
- `POST /trials/register` - Register clinical trial
- `POST /trials/consent` - Record trial consent

### Authentication
- **API Keys**: Required for all endpoints
- **JWT Tokens**: For patient authentication
- **Role-based Access**: Different access levels for different roles

## 🛡️ Security

### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **Access Controls**: Role-based access with audit trails
- **Data Minimization**: Only necessary data is processed
- **Anonymization**: Patient data is anonymized where possible

### Compliance
- **HIPAA**: Full HIPAA compliance
- **GDPR**: GDPR compliance for EU patients
- **FDA**: FDA compliance for clinical trials
- **SOC 2**: SOC 2 Type II compliance

## 📊 Monitoring

### Health Metrics
- **Consent Rates**: Track consent grant/revoke rates
- **Data Access**: Monitor data access patterns
- **Audit Events**: Track all audit events
- **Compliance**: Monitor compliance metrics

### Alerting
- **Breach Detection**: Automated breach detection
- **Consent Violations**: Alert on consent violations
- **Data Access Anomalies**: Detect unusual access patterns
- **Compliance Issues**: Alert on compliance violations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.nullprotocol.org/healthcare](https://docs.nullprotocol.org/healthcare)
- **Issues**: [GitHub Issues](https://github.com/your-org/null-protocol/issues)
- **Support**: healthcare@nullprotocol.org
