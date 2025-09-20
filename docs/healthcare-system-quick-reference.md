# Canon Healthcare System Quick Reference

## 🚀 Essential Commands

### Consent Management
```bash
# Grant patient consent
curl -X POST "https://healthcare.null.xyz/consent/grant" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"patientId":"patient-123","purpose":"treatment","dataTypes":["medical_records","lab_results"],"expirationDate":"2024-12-31","evidence":{"patientSignature":"digital-signature"}}'

# Revoke patient consent
curl -X POST "https://healthcare.null.xyz/consent/revoke" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"patientId":"patient-123","purpose":"research","reason":"Patient requested withdrawal","evidence":{"revocationReason":"Patient requested"}}'

# Check consent status
curl -X GET "https://healthcare.null.xyz/consent/status/patient-123"
```

### Medical Records
```bash
# Anchor medical record
curl -X POST "https://healthcare.null.xyz/records/anchor" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"patientId":"patient-123","recordType":"diagnosis","recordHash":"0xabc123...","providerId":"provider-456","assurance":2,"evidence":{"diagnosis":"Hypertension","icd10Code":"I10"}}'

# Verify record integrity
curl -X GET "https://healthcare.null.xyz/records/verify?recordHash=0xabc123..."
```

### Audit & Compliance
```bash
# Log data access
curl -X POST "https://healthcare.null.xyz/access/log" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"patientId":"patient-123","recordHash":"0xabc123...","accessorId":"provider-456","purpose":"Patient consultation","evidence":{"accessReason":"Patient consultation","accessorRole":"physician"}}'

# Get audit log
curl -X GET "https://healthcare.null.xyz/audit/log" \
  -H "x-api-key: your-api-key"
```

## 📊 Reference Tables

### Consent Purposes
| Purpose | Description | Use Case |
|---------|-------------|----------|
| `treatment` | Medical treatment | Patient care, diagnosis, treatment |
| `research` | Research studies | Clinical trials, medical research |
| `billing` | Insurance billing | Claims processing, payment |
| `quality_assurance` | Quality improvement | Performance metrics, quality audits |

### Record Types
| Type | Description | Example |
|------|-------------|---------|
| `diagnosis` | Medical diagnoses | Hypertension, Diabetes |
| `treatment` | Treatment plans | Surgery, Therapy |
| `medication` | Prescribed medications | Prescription drugs |
| `lab_result` | Laboratory results | Blood tests, Urine tests |
| `imaging` | Medical imaging | X-rays, MRI, CT scans |

### Assurance Levels
| Level | Value | Description | Use Case |
|-------|-------|-------------|----------|
| `NONE` | 0 | No verification | Basic records |
| `BASIC` | 1 | Basic verification | Routine data |
| `VERIFIED` | 2 | Verified by provider | Clinical data |
| `ATTESTED` | 3 | Attested by multiple parties | Critical data |
| `CERTIFIED` | 4 | Certified by regulatory body | Regulatory data |

### Operation Types
| Type | Value | Description |
|------|-------|-------------|
| `CONSENT_GRANT` | 0 | Patient grants consent |
| `CONSENT_REVOKE` | 1 | Patient revokes consent |
| `RECORD_ANCHOR` | 2 | Medical record anchored |
| `RECORD_UPDATE` | 3 | Medical record updated |
| `TRIAL_CONSENT` | 4 | Clinical trial consent |
| `TRIAL_DATA` | 5 | Clinical trial data |
| `ACCESS_LOG` | 6 | Data access logged |
| `BREACH_REPORT` | 7 | Security breach reported |

## 🔧 JavaScript SDK

### Basic Usage
```javascript
import { HealthcareAPI } from '@null/healthcare-sdk';

const api = new HealthcareAPI({
  baseUrl: 'https://healthcare.null.xyz',
  apiKey: 'your-api-key'
});

// Grant consent
const consent = await api.grantConsent({
  patientId: 'patient-123',
  purpose: 'treatment',
  dataTypes: ['medical_records', 'lab_results'],
  expirationDate: '2024-12-31',
  evidence: {
    patientSignature: 'digital-signature',
    consentFormVersion: '1.0'
  }
});

// Check consent status
const status = await api.checkConsentStatus('patient-123');

// Anchor medical record
const record = await api.anchorMedicalRecord({
  patientId: 'patient-123',
  recordType: 'diagnosis',
  recordHash: '0xabc123...',
  providerId: 'provider-456',
  assurance: 2,
  evidence: {
    diagnosis: 'Hypertension',
    icd10Code: 'I10',
    providerSignature: 'signature'
  }
});
```

### React Hook
```javascript
import { useConsentStatus } from '@null/healthcare-sdk/react';

function PatientComponent({ patientId }) {
  const { data, loading, error, grantConsent, revokeConsent } = useConsentStatus(patientId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h3>Consent Status: {data.hasConsent ? 'Granted' : 'Not Granted'}</h3>
      <button onClick={() => grantConsent('treatment', ['medical_records'])}>
        Grant Treatment Consent
      </button>
      <button onClick={() => revokeConsent('treatment')}>
        Revoke Treatment Consent
      </button>
    </div>
  );
}
```

## 🎯 Common Patterns

### Consent Workflow
```javascript
async function handleConsentWorkflow(patientId, purpose, dataTypes) {
  try {
    // 1. Check current consent status
    const status = await api.checkConsentStatus(patientId);
    
    if (status.hasConsent) {
      console.log('Patient already has consent');
      return { success: true, alreadyGranted: true };
    }
    
    // 2. Grant consent
    const consent = await api.grantConsent({
      patientId,
      purpose,
      dataTypes,
      expirationDate: '2024-12-31',
      evidence: {
        patientSignature: 'digital-signature',
        consentFormVersion: '1.0'
      }
    });
    
    // 3. Verify consent was granted
    const newStatus = await api.checkConsentStatus(patientId);
    
    return { 
      success: true, 
      consent, 
      status: newStatus 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Medical Record Management
```javascript
async function manageMedicalRecord(patientId, recordType, recordData, providerId) {
  try {
    // 1. Check consent before accessing data
    const consentStatus = await api.checkConsentStatus(patientId);
    if (!consentStatus.hasConsent) {
      throw new Error('Patient consent required');
    }
    
    // 2. Calculate record hash
    const recordHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(recordData));
    
    // 3. Anchor record to blockchain
    const record = await api.anchorMedicalRecord({
      patientId,
      recordType,
      recordHash,
      providerId,
      assurance: 2, // Verified
      evidence: {
        recordData,
        providerSignature: 'digital-signature',
        timestamp: new Date().toISOString()
      }
    });
    
    // 4. Log data access
    await api.logDataAccess({
      patientId,
      recordHash,
      accessorId: providerId,
      purpose: 'Record creation',
      evidence: {
        accessReason: 'Medical record creation',
        accessorRole: 'healthcare_provider'
      }
    });
    
    return { success: true, record };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Clinical Trial Management
```javascript
async function manageClinicalTrial(trialId, patientId, consentType) {
  try {
    // 1. Register clinical trial
    const trial = await api.registerTrial({
      trialId,
      title: 'Hypertension Treatment Study',
      protocol: 'PROTOCOL-001',
      irbApproval: 'IRB-2024-001',
      sponsor: 'Research Institute',
      evidence: {
        fdaApproval: 'FDA-2024-001',
        protocolVersion: '1.0'
      }
    });
    
    // 2. Record trial consent
    const trialConsent = await api.recordTrialConsent({
      trialId,
      patientId,
      consentType,
      evidence: {
        consentForm: 'CONSENT-001',
        patientSignature: 'digital-signature',
        witnessSignature: 'witness-signature'
      }
    });
    
    // 3. Anchor trial data
    const trialData = await api.anchorMedicalRecord({
      patientId,
      recordType: 'lab_result',
      recordHash: '0xdef456...',
      providerId: 'researcher-789',
      assurance: 3, // Attested
      evidence: {
        trialId,
        dataType: 'blood_pressure',
        measurement: '120/80',
        timestamp: new Date().toISOString()
      }
    });
    
    return { success: true, trial, trialConsent, trialData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 🚨 Error Handling

### Common Error Codes
| Code | Description | Solution |
|------|-------------|----------|
| `400` | Bad Request | Check request format |
| `401` | Unauthorized | Verify API key |
| `403` | Forbidden | Check permissions |
| `404` | Not Found | Check patient/record ID |
| `500` | Server Error | Contact support |

### Error Handling Pattern
```javascript
async function handleApiCall(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.status === 404) {
      throw new Error('Patient or record not found');
    } else if (error.status === 401) {
      throw new Error('Invalid API key');
    } else if (error.status === 403) {
      throw new Error('Insufficient permissions');
    } else {
      throw new Error(`API error: ${error.message}`);
    }
  }
}
```

## 📱 Mobile Integration

### React Native
```javascript
import { HealthcareAPI } from '@null/healthcare-sdk/react-native';

const api = new HealthcareAPI({
  baseUrl: 'https://healthcare.null.xyz',
  apiKey: 'your-api-key'
});

// Grant consent
const consent = await api.grantConsent({
  patientId: 'patient-123',
  purpose: 'treatment',
  dataTypes: ['medical_records']
});

// Check consent status
const status = await api.checkConsentStatus('patient-123');
```

### Flutter
```dart
import 'package:null_healthcare_sdk/null_healthcare_sdk.dart';

final api = HealthcareAPI(
  baseUrl: 'https://healthcare.null.xyz',
  apiKey: 'your-api-key',
);

// Grant consent
final consent = await api.grantConsent(
  patientId: 'patient-123',
  purpose: 'treatment',
  dataTypes: ['medical_records'],
);

// Check consent status
final status = await api.checkConsentStatus('patient-123');
```

## 🔍 Debugging

### Enable Debug Logging
```javascript
import { HealthcareAPI } from '@null/healthcare-sdk';

const api = new HealthcareAPI({
  baseUrl: 'https://healthcare.null.xyz',
  apiKey: 'your-api-key',
  debug: true // Enable debug logging
});
```

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

## 📞 Support

### Getting Help
- **Documentation**: [docs.null.xyz](https://docs.null.xyz)
- **API Reference**: [api.null.xyz](https://api.null.xyz)
- **Community**: [Discord](https://discord.gg/null)
- **Support**: support@null.xyz

### System Status
- **Status Page**: [status.null.xyz](https://status.null.xyz)
- **Uptime**: 99.9% SLA
- **Response Times**: < 200ms average

---

*This quick reference provides essential commands and patterns for using the Canon Healthcare System. For detailed documentation, see the [User Guide](healthcare-system-user-guide.md) and [Developer Guide](healthcare-system-developer-guide.md).*
