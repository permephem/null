# Canon Healthcare System User Guide

## 🏥 Overview

The Canon Healthcare System provides HIPAA-compliant, privacy-preserving healthcare data management built on Ethereum with IPFS evidence storage. This guide covers how to use the system for all user types: patients, healthcare providers, researchers, and administrators.

## 🚀 Quick Start

### For Patients
1. **Grant Consent**: Provide consent for data sharing with healthcare providers
2. **Manage Privacy**: Control who can access your medical data and for what purposes
3. **Track Access**: Monitor who has accessed your medical records
4. **Revoke Consent**: Withdraw consent at any time

### For Healthcare Providers
1. **Request Consent**: Obtain patient consent before accessing medical data
2. **Anchor Records**: Securely store medical record commitments on blockchain
3. **Log Access**: Track all data access for audit purposes
4. **Report Breaches**: Report any security breaches or data incidents

### For Researchers
1. **Obtain Research Consent**: Get patient consent for research participation
2. **Access Anonymized Data**: Work with de-identified patient data
3. **Maintain Compliance**: Follow regulatory requirements for clinical trials
4. **Track Data Usage**: Monitor research data access and usage

## 👤 Patient Guide

### Step 1: Grant Consent for Treatment

Grant consent for healthcare providers to access your medical data:

```bash
# Grant consent for treatment purposes
curl -X POST "https://healthcare.null.xyz/consent/grant" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-provider-api-key" \
  -d '{
    "patientId": "patient-123",
    "purpose": "treatment",
    "dataTypes": ["medical_records", "lab_results", "imaging"],
    "expirationDate": "2024-12-31",
    "evidence": {
      "patientSignature": "digital-signature",
      "consentFormVersion": "1.0"
    }
  }'
```

**Response includes:**
- Patient commitment (privacy-preserving identifier)
- Consent commitment (cryptographic proof)
- Canon transaction hash
- IPFS evidence URI

### Step 2: Check Consent Status

Verify your current consent status:

```bash
# Check consent status
curl -X GET "https://healthcare.null.xyz/consent/status/patient-123"
```

**Response includes:**
- Current consent status (granted/revoked)
- Check timestamp
- Patient identifier

### Step 3: Revoke Consent

Withdraw consent at any time:

```bash
# Revoke consent
curl -X POST "https://healthcare.null.xyz/consent/revoke" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-provider-api-key" \
  -d '{
    "patientId": "patient-123",
    "purpose": "research",
    "reason": "Patient requested withdrawal",
    "evidence": {
      "revocationReason": "Patient requested",
      "patientSignature": "digital-signature"
    }
  }'
```

### Step 4: Monitor Data Access

Track who has accessed your medical data:

```bash
# Get audit log for your data
curl -X GET "https://healthcare.null.xyz/audit/log" \
  -H "x-api-key: your-provider-api-key"
```

**Audit log includes:**
- All data access events
- Who accessed your data
- When access occurred
- Purpose of access
- IP addresses and user agents

## 🏥 Healthcare Provider Guide

### Step 1: Request Patient Consent

Before accessing patient data, ensure you have proper consent:

```bash
# Check if patient has granted consent
curl -X GET "https://healthcare.null.xyz/consent/status/patient-123"
```

### Step 2: Anchor Medical Records

Securely store medical record commitments on blockchain:

```bash
# Anchor a medical record
curl -X POST "https://healthcare.null.xyz/records/anchor" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-provider-api-key" \
  -d '{
    "patientId": "patient-123",
    "recordType": "diagnosis",
    "recordHash": "0xabc123...",
    "providerId": "provider-456",
    "assurance": 2,
    "evidence": {
      "diagnosis": "Hypertension",
      "icd10Code": "I10",
      "providerSignature": "signature"
    }
  }'
```

**Record types include:**
- `diagnosis` - Medical diagnoses
- `treatment` - Treatment plans and procedures
- `medication` - Prescribed medications
- `lab_result` - Laboratory test results
- `imaging` - Medical imaging studies

**Assurance levels:**
- `0` - None (no verification)
- `1` - Basic (basic verification)
- `2` - Verified (verified by provider)
- `3` - Attested (attested by multiple parties)
- `4` - Certified (certified by regulatory body)

### Step 3: Log Data Access

Track all access to patient data for audit purposes:

```bash
# Log data access
curl -X POST "https://healthcare.null.xyz/access/log" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-provider-api-key" \
  -d '{
    "patientId": "patient-123",
    "recordHash": "0xabc123...",
    "accessorId": "provider-456",
    "purpose": "Patient consultation",
    "evidence": {
      "accessReason": "Patient consultation",
      "accessorRole": "physician"
    }
  }'
```

### Step 4: Report Security Breaches

Report any security breaches or data incidents:

```bash
# Report a breach
curl -X POST "https://healthcare.null.xyz/breach/report" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-provider-api-key" \
  -d '{
    "patientId": "patient-123",
    "breachType": "unauthorized_access",
    "description": "Unauthorized access to patient records",
    "evidence": {
      "breachDetails": "Details of the breach",
      "remediationSteps": "Steps taken to address the breach"
    }
  }'
```

## 🔬 Researcher Guide

### Step 1: Obtain Research Consent

Get patient consent for research participation:

```bash
# Request research consent
curl -X POST "https://healthcare.null.xyz/consent/grant" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-researcher-api-key" \
  -d '{
    "patientId": "patient-123",
    "purpose": "research",
    "dataTypes": ["medical_records", "lab_results"],
    "expirationDate": "2025-12-31",
    "evidence": {
      "researchProtocol": "PROTOCOL-001",
      "irbApproval": "IRB-2024-001",
      "patientSignature": "digital-signature"
    }
  }'
```

### Step 2: Register Clinical Trial

Register a clinical trial for regulatory compliance:

```bash
# Register clinical trial
curl -X POST "https://healthcare.null.xyz/trials/register" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-researcher-api-key" \
  -d '{
    "trialId": "TRIAL-001",
    "title": "Hypertension Treatment Study",
    "protocol": "PROTOCOL-001",
    "irbApproval": "IRB-2024-001",
    "sponsor": "Research Institute",
    "evidence": {
      "fdaApproval": "FDA-2024-001",
      "protocolVersion": "1.0"
    }
  }'
```

### Step 3: Record Trial Consent

Record patient consent for specific clinical trial:

```bash
# Record trial consent
curl -X POST "https://healthcare.null.xyz/trials/consent" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-researcher-api-key" \
  -d '{
    "trialId": "TRIAL-001",
    "patientId": "patient-123",
    "consentType": "participation",
    "evidence": {
      "consentForm": "CONSENT-001",
      "patientSignature": "digital-signature",
      "witnessSignature": "witness-signature"
    }
  }'
```

### Step 4: Anchor Research Data

Securely store research data commitments:

```bash
# Anchor research data
curl -X POST "https://healthcare.null.xyz/records/anchor" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-researcher-api-key" \
  -d '{
    "patientId": "patient-123",
    "recordType": "lab_result",
    "recordHash": "0xdef456...",
    "providerId": "researcher-789",
    "assurance": 3,
    "evidence": {
      "trialId": "TRIAL-001",
      "dataType": "blood_pressure",
      "measurement": "120/80",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }'
```

## 🛡️ Privacy & Compliance

### HIPAA Compliance Features

#### Data Protection
- **No PHI on-chain**: Only cryptographic commitments and consent hashes
- **Access Controls**: Role-based access with audit trails
- **Data Minimization**: Only necessary data is processed
- **Right to Erasure**: Patient data deletion capabilities

#### Audit Requirements
- **Complete Audit Trail**: All data access logged immutably
- **Access Monitoring**: Real-time monitoring of data access
- **Breach Detection**: Automated breach detection and notification
- **Compliance Reporting**: Automated compliance reports

### Consent Management

#### Granular Consent
- **Purpose-based**: Consent for specific purposes (treatment, research, billing)
- **Data Type Control**: Control which types of data can be shared
- **Time-limited**: Set expiration dates for consent
- **Revocable**: Patients can revoke consent at any time

#### Consent Verification
- **Real-time Checking**: Verify consent before data access
- **Status Tracking**: Track consent status over time
- **Evidence Storage**: Store consent forms and signatures
- **Audit Trail**: Complete history of consent changes

## 📊 Monitoring & Analytics

### System Statistics

Get healthcare system statistics:

```bash
# Get system statistics
curl -X GET "https://healthcare.null.xyz/stats"
```

**Statistics include:**
- Total healthcare events
- Total consents granted
- Total breach reports
- Provider activity counts
- Data access patterns

### Audit Logging

Monitor all system activity:

```bash
# Get audit log
curl -X GET "https://healthcare.null.xyz/audit/log" \
  -H "x-api-key: your-api-key"
```

**Audit log includes:**
- All consent grants and revocations
- Medical record anchoring events
- Data access logs
- Breach reports
- System access events

## 🔒 Security Best Practices

### For Patients
1. **Review Consent**: Regularly review your consent settings
2. **Monitor Access**: Check audit logs for unauthorized access
3. **Report Issues**: Report any privacy concerns immediately
4. **Use Strong Authentication**: Use strong passwords and 2FA
5. **Keep Records**: Keep copies of your consent forms

### For Healthcare Providers
1. **Verify Consent**: Always verify consent before accessing data
2. **Log All Access**: Log every access to patient data
3. **Use Strong Authentication**: Implement strong authentication
4. **Regular Audits**: Conduct regular security audits
5. **Train Staff**: Train staff on privacy and security

### For Researchers
1. **Obtain Proper Consent**: Get appropriate consent for research
2. **Follow Protocols**: Follow approved research protocols
3. **Minimize Data**: Use only necessary data for research
4. **Secure Storage**: Securely store research data
5. **Regular Reviews**: Conduct regular compliance reviews

## 🚨 Troubleshooting

### Common Issues

#### "Consent Not Found"
- Verify patient ID is correct
- Check if consent has expired
- Ensure consent was properly granted

#### "Access Denied"
- Verify you have proper consent
- Check your API key permissions
- Ensure you have the required role

#### "Record Not Found"
- Verify record hash is correct
- Check if record was properly anchored
- Ensure record exists in system

#### "Breach Report Failed"
- Verify breach details are complete
- Check API key permissions
- Ensure proper evidence is provided

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check patient/record ID |
| 500 | Server Error | Contact support |

## 📞 Support

### Getting Help
- **Documentation**: Check this guide and API docs
- **Community**: Join our Discord community
- **Support**: Contact support@null.xyz
- **Status**: Check system status at status.null.xyz

### Reporting Issues
- **Bugs**: Report via GitHub issues
- **Security**: Email security@null.xyz
- **Privacy**: Email privacy@null.xyz
- **Feature Requests**: Submit via community forum

## 🔄 System Status

### Real-time Monitoring
- **API Status**: https://status.null.xyz
- **Uptime**: 99.9% SLA
- **Response Times**: < 200ms average
- **Availability**: 24/7 monitoring

### Maintenance Windows
- **Scheduled**: First Sunday of each month, 2-4 AM UTC
- **Emergency**: As needed with 1-hour notice
- **Updates**: Deployed continuously with zero downtime

## 📈 Compliance Reporting

### Automated Reports
- **HIPAA Compliance**: Monthly compliance reports
- **Audit Trails**: Complete audit trail exports
- **Breach Reports**: Automated breach notifications
- **Consent Reports**: Consent status and changes

### Manual Reports
- **Custom Queries**: Custom compliance queries
- **Data Exports**: Patient data exports
- **Access Reports**: Data access reports
- **Compliance Certificates**: Compliance certificates

---

## 🎯 Quick Reference

### Essential Endpoints
- `POST /consent/grant` - Grant patient consent
- `POST /consent/revoke` - Revoke patient consent
- `GET /consent/status/{id}` - Check consent status
- `POST /records/anchor` - Anchor medical record
- `POST /access/log` - Log data access
- `GET /audit/log` - Get audit log

### Consent Purposes
- **treatment** - Medical treatment
- **research** - Research studies
- **billing** - Insurance billing
- **quality_assurance** - Quality improvement

### Record Types
- **diagnosis** - Medical diagnoses
- **treatment** - Treatment plans
- **medication** - Prescribed medications
- **lab_result** - Laboratory results
- **imaging** - Medical imaging

### Assurance Levels
- **0** - None (no verification)
- **1** - Basic (basic verification)
- **2** - Verified (verified by provider)
- **3** - Attested (attested by multiple parties)
- **4** - Certified (certified by regulatory body)

---

*This guide covers the essential usage patterns for the Canon Healthcare System. For advanced features and detailed API documentation, see the [API Reference](api-reference.md) and [Developer Guide](developer-guide.md).*
