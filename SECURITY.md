# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Threat Model

The Null Protocol ticket system handles sensitive operations including ticket issuance, transfers, and verification. This document outlines the threat model and security controls.

### Key Assets

1. **Ticket State**: Current holder, validity, and transfer history
2. **Evidence**: Signed attestations and revocation proofs
3. **API Keys**: Venue authentication credentials
4. **Private Keys**: Relayer wallet for Canon anchoring
5. **HMAC Keys**: Holder tag generation secrets

### Threat Analysis (STRIDE)

#### Spoofing (S)
**Threat**: Attacker impersonates legitimate ticket holder
**Controls**:
- HMAC holder tags bound to venue secrets
- OTP or wallet signature verification at gates
- Session tokens in QR payloads with short TTL
- No PII stored on-chain (only commitments)

#### Tampering (T)
**Threat**: Evidence or ticket state manipulation
**Controls**:
- JWS-signed evidence packages
- IPFS content addressing (CIDs)
- Canon registry immutability
- Database integrity constraints

#### Repudiation (R)
**Threat**: Denial of ticket operations
**Controls**:
- Canon blockchain provides immutable audit trail
- Signed evidence with timestamps
- Comprehensive logging and metrics
- Database transaction logs

#### Information Disclosure (I)
**Threat**: Sensitive data exposure
**Controls**:
- Zero PII in logs or on-chain data
- API key authentication per venue
- Rate limiting and DDoS protection
- Encrypted secrets in KMS/HSM

#### Denial of Service (D)
**Threat**: Service unavailability
**Controls**:
- Rate limiting (100 req/min per IP)
- Circuit breakers for Canon operations
- Auto-scaling infrastructure
- CDN and load balancing

#### Elevation of Privilege (E)
**Threat**: Unauthorized access to admin functions
**Controls**:
- API key scoping per venue
- Principle of least privilege
- Regular key rotation
- Audit logging

## Security Controls

### Authentication & Authorization

- **API Keys**: Required for all `/tickets/*` endpoints
- **Rate Limiting**: 100 requests/minute per IP address
- **CORS**: Restricted to scanner domains
- **Session Tokens**: Short-lived tokens in QR payloads

### Data Protection

- **Encryption at Rest**: Database encryption enabled
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Key Management**: AWS KMS or GCP KMS for secrets
- **PII Redaction**: No personal data in logs or on-chain

### Network Security

- **Firewall Rules**: Restrictive ingress/egress
- **VPC**: Private subnets for database and internal services
- **WAF**: Web Application Firewall for DDoS protection
- **DDoS Protection**: CloudFlare or AWS Shield

### Monitoring & Incident Response

- **Security Logging**: All API calls and errors logged
- **Metrics**: Real-time monitoring of security events
- **Alerting**: Automated alerts for security violations
- **Incident Response**: 24/7 on-call rotation

## Secret Management

### Relayer Private Key
- **Storage**: AWS KMS or GCP KMS
- **Access**: IAM roles with least privilege
- **Rotation**: Quarterly or on compromise
- **Backup**: Encrypted backup in separate region

### Venue HMAC Keys
- **Storage**: KMS with key versioning
- **Rotation**: Quarterly schedule
- **Scope**: Per-venue isolation
- **Audit**: All key usage logged

### API Keys
- **Format**: Cryptographically secure random strings
- **Storage**: Hashed in database
- **Scope**: Per-venue with operation limits
- **Rotation**: On-demand or quarterly

## Vulnerability Reporting

### Reporting Process

1. **Email**: tech@nullengine.io
2. **Response Time**: 24 hours for acknowledgment
3. **Resolution**: 90 days for critical issues
4. **Disclosure**: Coordinated disclosure after fix

### Bug Bounty Program

- **Scope**: Production relayer and indexer
- **Rewards**: $100 - $10,000 based on severity
- **Exclusions**: DoS, social engineering, physical access
- **Platform**: HackerOne or direct email

### Security Contacts

- **Primary**: tech@nullengine.io
- **Backup**: tech@nullengine.io
- **PGP Key**: Available on request

## Compliance

### Data Retention

- **On-chain Data**: Permanent (by design)
- **Evidence**: 2 years or as required by law
- **Logs**: 30 days hot, 365 days cold
- **Metrics**: 13 months retention

### Privacy

- **GDPR**: Right to erasure for off-chain data
- **CCPA**: Data portability and deletion
- **Local Laws**: Compliance with venue jurisdiction
- **Audit Trail**: Immutable Canon records

### Regulatory

- **Financial**: Anti-money laundering (AML) checks
- **Tax**: Transaction reporting where required
- **Consumer**: Refund and chargeback policies
- **Venue**: Local licensing and regulations

## Security Checklist

### Pre-Production

- [ ] All secrets in KMS/HSM
- [ ] API keys configured per venue
- [ ] Rate limiting enabled
- [ ] HTTPS certificates valid
- [ ] Database encryption enabled
- [ ] Firewall rules configured
- [ ] Monitoring and alerting active
- [ ] Incident response plan tested

### Post-Production

- [ ] Regular security scans
- [ ] Dependency updates
- [ ] Key rotation schedule
- [ ] Access review quarterly
- [ ] Penetration testing annually
- [ ] Security training for team
- [ ] Incident response drills

## Incident Response

### Severity Levels

1. **Critical**: Service compromise, data breach
2. **High**: Authentication bypass, privilege escalation
3. **Medium**: Information disclosure, DoS
4. **Low**: Minor vulnerabilities, misconfigurations

### Response Process

1. **Detection**: Automated monitoring or manual report
2. **Assessment**: Severity and impact analysis
3. **Containment**: Immediate threat isolation
4. **Eradication**: Remove threat and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-incident review

### Communication

- **Internal**: Slack #security channel
- **External**: Status page updates
- **Regulatory**: Required notifications
- **Public**: Coordinated disclosure

## Security Training

### Team Requirements

- **Annual Training**: Security awareness and best practices
- **Role-Specific**: Developer, operations, and management tracks
- **Certifications**: Relevant security certifications encouraged
- **Updates**: Quarterly security briefings

### Topics Covered

- Secure coding practices
- Incident response procedures
- Threat modeling and risk assessment
- Compliance and regulatory requirements
- Privacy and data protection

## Contact

For security-related questions or to report vulnerabilities:

- **Email**: security@null.xyz
- **PGP**: [Key fingerprint]
- **Response Time**: 24 hours
- **Disclosure**: Coordinated disclosure preferred
