# Canon Healthcare System Developer Guide

## 🛠️ Overview

This guide provides comprehensive technical documentation for developers integrating with the Canon Healthcare System. It covers API integration, smart contract interaction, HIPAA compliance, security considerations, and best practices.

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Patient Apps   │    │ Healthcare API  │    │ Smart Contracts │
│  (React/RN)     │───▶│  (Fastify)      │───▶│  (Solidity)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ PostgreSQL DB   │    │ CanonHealth     │
                       │ (Event Store)   │    │ (Ethereum)      │
                       └─────────────────┘    └─────────────────┘
```

### Key Contracts

- **CanonHealth**: Main healthcare data management contract
- **ConsentManager**: Patient consent tracking
- **AuditLogger**: Data access logging
- **BreachReporter**: Security breach reporting

## 🔌 API Integration

### Authentication

```javascript
// API Key authentication for healthcare providers
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': 'your-healthcare-provider-api-key'
};

// JWT authentication for patient operations
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer your-jwt-token'
};
```

### Base Configuration

```javascript
const API_BASE_URL = 'https://healthcare.null.xyz';
const CONTRACT_ADDRESS = '0xYourCanonHealthContract';
const IPFS_GATEWAY = 'https://ipfs.null.xyz';
```

## 📋 Core API Endpoints

### Consent Management

#### Grant Patient Consent
```javascript
async function grantConsent(patientId, purpose, dataTypes, expirationDate, evidence) {
  const response = await fetch(`${API_BASE_URL}/consent/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key'
    },
    body: JSON.stringify({
      patientId,
      purpose,
      dataTypes,
      expirationDate,
      evidence
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Usage
const consent = await grantConsent(
  'patient-123',
  'treatment',
  ['medical_records', 'lab_results', 'imaging'],
  '2024-12-31',
  {
    patientSignature: 'digital-signature',
    consentFormVersion: '1.0'
  }
);
```

#### Revoke Patient Consent
```javascript
async function revokeConsent(patientId, purpose, reason, evidence) {
  const response = await fetch(`${API_BASE_URL}/consent/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key'
    },
    body: JSON.stringify({
      patientId,
      purpose,
      reason,
      evidence
    })
  });
  
  return await response.json();
}
```

#### Check Consent Status
```javascript
async function checkConsentStatus(patientId) {
  const response = await fetch(`${API_BASE_URL}/consent/status/${patientId}`);
  return await response.json();
}

// Usage
const status = await checkConsentStatus('patient-123');
if (status.hasConsent) {
  console.log('Patient has granted consent');
}
```

### Medical Records

#### Anchor Medical Record
```javascript
async function anchorMedicalRecord(patientId, recordType, recordHash, providerId, assurance, evidence) {
  const response = await fetch(`${API_BASE_URL}/records/anchor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key'
    },
    body: JSON.stringify({
      patientId,
      recordType,
      recordHash,
      providerId,
      assurance,
      evidence
    })
  });
  
  return await response.json();
}

// Usage
const record = await anchorMedicalRecord(
  'patient-123',
  'diagnosis',
  '0xabc123...',
  'provider-456',
  2, // Verified assurance level
  {
    diagnosis: 'Hypertension',
    icd10Code: 'I10',
    providerSignature: 'signature'
  }
);
```

#### Verify Record Integrity
```javascript
async function verifyRecordIntegrity(recordHash) {
  const response = await fetch(`${API_BASE_URL}/records/verify`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key'
    },
    body: JSON.stringify({ recordHash })
  });
  
  return await response.json();
}
```

### Audit & Compliance

#### Log Data Access
```javascript
async function logDataAccess(patientId, recordHash, accessorId, purpose, evidence) {
  const response = await fetch(`${API_BASE_URL}/access/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'your-api-key'
    },
    body: JSON.stringify({
      patientId,
      recordHash,
      accessorId,
      purpose,
      evidence
    })
  });
  
  return await response.json();
}

// Usage
await logDataAccess(
  'patient-123',
  '0xabc123...',
  'provider-456',
  'Patient consultation',
  {
    accessReason: 'Patient consultation',
    accessorRole: 'physician'
  }
);
```

#### Get Audit Log
```javascript
async function getAuditLog() {
  const response = await fetch(`${API_BASE_URL}/audit/log`, {
    headers: {
      'x-api-key': 'your-api-key'
    }
  });
  
  return await response.json();
}
```

## 🔗 Smart Contract Integration

### Web3 Setup

```javascript
import { ethers } from 'ethers';

// Provider setup
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/your-project-id');
const wallet = new ethers.Wallet('your-private-key', provider);

// Contract instances
const canonHealthContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CanonHealthABI,
  wallet
);
```

### Healthcare Operations

#### Anchor Healthcare Event
```javascript
async function anchorHealthcareEvent(
  patientCommit,
  recordCommit,
  consentCommit,
  providerCommit,
  operation,
  assurance,
  evidenceUri
) {
  const tx = await canonHealthContract.anchorHealthcareEvent(
    patientCommit,
    recordCommit,
    consentCommit,
    providerCommit,
    operation,
    assurance,
    evidenceUri,
    { gasLimit: 500000 }
  );
  
  const receipt = await tx.wait();
  return receipt;
}
```

#### Check Patient Consent
```javascript
async function hasPatientConsent(patientCommit) {
  const hasConsent = await canonHealthContract.hasPatientConsent(patientCommit);
  return hasConsent;
}
```

#### Get Provider Activity
```javascript
async function getProviderActivity(providerAddress) {
  const activity = await canonHealthContract.getProviderActivity(providerAddress);
  return activity;
}
```

## 🎨 Frontend Integration

### React Components

#### Patient Consent Widget
```jsx
import React, { useState, useEffect } from 'react';

function PatientConsentWidget({ patientId }) {
  const [consentStatus, setConsentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchConsentStatus() {
      try {
        setLoading(true);
        const response = await fetch(`/api/consent/status/${patientId}`);
        const data = await response.json();
        setConsentStatus(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchConsentStatus();
  }, [patientId]);

  const grantConsent = async (purpose, dataTypes) => {
    try {
      const response = await fetch('/api/consent/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          purpose,
          dataTypes,
          expirationDate: '2024-12-31',
          evidence: {
            patientSignature: 'digital-signature',
            consentFormVersion: '1.0'
          }
        })
      });
      
      const result = await response.json();
      setConsentStatus({ hasConsent: true, ...result });
    } catch (error) {
      setError(error.message);
    }
  };

  const revokeConsent = async (purpose) => {
    try {
      const response = await fetch('/api/consent/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          purpose,
          reason: 'Patient requested withdrawal',
          evidence: {
            revocationReason: 'Patient requested',
            patientSignature: 'digital-signature'
          }
        })
      });
      
      const result = await response.json();
      setConsentStatus({ hasConsent: false, ...result });
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading consent status...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="consent-widget">
      <h3>Patient Consent Management</h3>
      
      <div className="consent-status">
        <h4>Current Status</h4>
        <span className={`status ${consentStatus?.hasConsent ? 'granted' : 'revoked'}`}>
          {consentStatus?.hasConsent ? 'Consent Granted' : 'No Consent'}
        </span>
      </div>

      <div className="consent-actions">
        <h4>Grant Consent</h4>
        <button onClick={() => grantConsent('treatment', ['medical_records', 'lab_results'])}>
          Grant Treatment Consent
        </button>
        <button onClick={() => grantConsent('research', ['medical_records'])}>
          Grant Research Consent
        </button>
      </div>

      <div className="revoke-actions">
        <h4>Revoke Consent</h4>
        <button onClick={() => revokeConsent('treatment')}>
          Revoke Treatment Consent
        </button>
        <button onClick={() => revokeConsent('research')}>
          Revoke Research Consent
        </button>
      </div>
    </div>
  );
}

export default PatientConsentWidget;
```

#### Medical Record Component
```jsx
import React, { useState } from 'react';

function MedicalRecordComponent({ patientId, providerId }) {
  const [recordType, setRecordType] = useState('diagnosis');
  const [recordData, setRecordData] = useState('');
  const [loading, setLoading] = useState(false);

  const anchorRecord = async () => {
    setLoading(true);
    
    try {
      // Calculate hash of record data
      const recordHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(recordData));
      
      const response = await fetch('/api/records/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });
      
      const result = await response.json();
      console.log('Record anchored:', result);
    } catch (error) {
      console.error('Failed to anchor record:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medical-record">
      <h3>Anchor Medical Record</h3>
      
      <div className="form-group">
        <label htmlFor="recordType">Record Type</label>
        <select
          id="recordType"
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
        >
          <option value="diagnosis">Diagnosis</option>
          <option value="treatment">Treatment</option>
          <option value="medication">Medication</option>
          <option value="lab_result">Lab Result</option>
          <option value="imaging">Imaging</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="recordData">Record Data</label>
        <textarea
          id="recordData"
          value={recordData}
          onChange={(e) => setRecordData(e.target.value)}
          rows="5"
          placeholder="Enter medical record data..."
        />
      </div>

      <button onClick={anchorRecord} disabled={loading}>
        {loading ? 'Anchoring Record...' : 'Anchor Record'}
      </button>
    </div>
  );
}

export default MedicalRecordComponent;
```

### Mobile Integration (React Native)

```javascript
import { Alert } from 'react-native';

class HealthcareService {
  static async grantConsent(patientId, purpose, dataTypes) {
    try {
      const response = await fetch(`${API_BASE_URL}/consent/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your-api-key'
        },
        body: JSON.stringify({
          patientId,
          purpose,
          dataTypes,
          expirationDate: '2024-12-31',
          evidence: {
            patientSignature: 'digital-signature',
            consentFormVersion: '1.0'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      Alert.alert('Consent Error', error.message);
      throw error;
    }
  }

  static async checkConsentStatus(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/consent/status/${patientId}`);
      return await response.json();
    } catch (error) {
      Alert.alert('Status Check Error', error.message);
      throw error;
    }
  }

  static async logDataAccess(patientId, recordHash, accessorId, purpose) {
    try {
      const response = await fetch(`${API_BASE_URL}/access/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your-api-key'
        },
        body: JSON.stringify({
          patientId,
          recordHash,
          accessorId,
          purpose,
          evidence: {
            accessReason: purpose,
            accessorRole: 'healthcare_provider',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      return await response.json();
    } catch (error) {
      Alert.alert('Access Log Error', error.message);
      throw error;
    }
  }
}

export default HealthcareService;
```

## 🔒 HIPAA Compliance

### Data Protection

```javascript
// Patient data hashing for privacy
const crypto = require('crypto');

function hashPatientData(patientId, salt) {
  const hash = crypto.createHash('sha256');
  hash.update(patientId + salt);
  return '0x' + hash.digest('hex');
}

// Consent data hashing
function hashConsentData(consentData) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(consentData));
  return '0x' + hash.digest('hex');
}

// Medical record hashing
function hashMedicalRecord(recordData) {
  const hash = crypto.createHash('sha256');
  hash.update(recordData);
  return '0x' + hash.digest('hex');
}
```

### Access Control

```javascript
// Role-based access control
const ROLES = {
  PATIENT: 'patient',
  HEALTHCARE_PROVIDER: 'healthcare_provider',
  RESEARCHER: 'researcher',
  AUDITOR: 'auditor',
  ADMIN: 'admin'
};

function checkAccess(userRole, requiredRole) {
  const roleHierarchy = {
    [ROLES.PATIENT]: 1,
    [ROLES.HEALTHCARE_PROVIDER]: 2,
    [ROLES.RESEARCHER]: 3,
    [ROLES.AUDITOR]: 4,
    [ROLES.ADMIN]: 5
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Usage
if (!checkAccess(userRole, ROLES.HEALTHCARE_PROVIDER)) {
  throw new Error('Insufficient permissions');
}
```

### Audit Logging

```javascript
// Comprehensive audit logging
class AuditLogger {
  static async logEvent(eventType, patientId, userId, details) {
    const auditEvent = {
      eventType,
      patientId: hashPatientData(patientId, process.env.AUDIT_SALT),
      userId,
      timestamp: new Date().toISOString(),
      ip: details.ip,
      userAgent: details.userAgent,
      details: details
    };
    
    // Store in database
    await this.storeAuditEvent(auditEvent);
    
    // Anchor to blockchain
    await this.anchorAuditEvent(auditEvent);
  }
  
  static async storeAuditEvent(event) {
    // Store in PostgreSQL
    const query = `
      INSERT INTO audit_events (event_type, patient_commit, user_id, timestamp, ip, user_agent, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await db.query(query, [
      event.eventType,
      event.patientId,
      event.userId,
      event.timestamp,
      event.ip,
      event.userAgent,
      JSON.stringify(event.details)
    ]);
  }
  
  static async anchorAuditEvent(event) {
    // Anchor to CanonHealth contract
    const patientCommit = event.patientId;
    const recordCommit = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(event)));
    const consentCommit = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(event.eventType));
    const providerCommit = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(event.userId));
    
    await canonHealthContract.anchorHealthcareEvent(
      patientCommit,
      recordCommit,
      consentCommit,
      providerCommit,
      6, // ACCESS_LOG operation
      2, // VERIFIED assurance
      `ipfs://${event.ipfsHash}`
    );
  }
}
```

## 📊 Error Handling

### API Error Handling

```javascript
class HealthcareError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'HealthcareError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const handleApiError = (response) => {
  switch (response.status) {
    case 400:
      throw new HealthcareError('Bad Request', 'BAD_REQUEST', 400);
    case 401:
      throw new HealthcareError('Unauthorized', 'UNAUTHORIZED', 401);
    case 403:
      throw new HealthcareError('Forbidden', 'FORBIDDEN', 403);
    case 404:
      throw new HealthcareError('Not Found', 'NOT_FOUND', 404);
    case 500:
      throw new HealthcareError('Internal Server Error', 'SERVER_ERROR', 500);
    default:
      throw new HealthcareError('Unknown Error', 'UNKNOWN', response.status);
  }
};

// Usage
try {
  const response = await fetch(`${API_BASE_URL}/consent/status/patient-123`);
  if (!response.ok) {
    handleApiError(response);
  }
  const data = await response.json();
} catch (error) {
  if (error instanceof HealthcareError) {
    console.error(`Healthcare API Error [${error.code}]: ${error.message}`);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

### Smart Contract Error Handling

```javascript
const handleContractError = (error) => {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    throw new Error('Insufficient funds for transaction');
  } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    throw new Error('Transaction may fail - check contract state');
  } else if (error.message.includes('revert')) {
    const revertReason = error.message.match(/revert (.+)/)?.[1];
    throw new Error(`Transaction reverted: ${revertReason}`);
  } else {
    throw new Error(`Contract error: ${error.message}`);
  }
};

// Usage
try {
  const tx = await canonHealthContract.anchorHealthcareEvent(
    patientCommit,
    recordCommit,
    consentCommit,
    providerCommit,
    operation,
    assurance,
    evidenceUri
  );
  await tx.wait();
} catch (error) {
  handleContractError(error);
}
```

## 🧪 Testing

### Unit Tests

```javascript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('HealthcareService', () => {
  let service;
  
  beforeEach(() => {
    service = new HealthcareService();
  });

  it('should grant consent successfully', async () => {
    const mockResponse = {
      patientCommit: '0x1234...',
      consentCommit: '0x5678...',
      canonTx: '0xabcd...',
      evidenceUri: 'ipfs://QmX...'
    };
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    const result = await service.grantConsent(
      'patient-123',
      'treatment',
      ['medical_records', 'lab_results']
    );
    
    expect(result.patientCommit).toBe('0x1234...');
    expect(result.consentCommit).toBe('0x5678...');
  });

  it('should handle consent grant failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400
    });
    
    await expect(service.grantConsent('patient-123', 'treatment', [])).rejects.toThrow();
  });
});
```

### Integration Tests

```javascript
describe('Healthcare Integration', () => {
  it('should complete consent workflow', async () => {
    // Grant consent
    const consent = await grantConsent('patient-123', 'treatment', ['medical_records']);
    expect(consent.patientCommit).toBeDefined();
    
    // Check consent status
    const status = await checkConsentStatus('patient-123');
    expect(status.hasConsent).toBe(true);
    
    // Anchor medical record
    const record = await anchorMedicalRecord(
      'patient-123',
      'diagnosis',
      '0xabc123...',
      'provider-456',
      2
    );
    expect(record.recordCommit).toBeDefined();
    
    // Log data access
    const accessLog = await logDataAccess(
      'patient-123',
      '0xabc123...',
      'provider-456',
      'Patient consultation'
    );
    expect(accessLog.canonTx).toBeDefined();
  });
});
```

## 📈 Performance Optimization

### Caching

```javascript
class HealthcareCache {
  constructor(ttl = 300000) { // 5 minutes
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

const healthcareCache = new HealthcareCache();

// Usage
async function getCachedConsentStatus(patientId) {
  const cached = healthcareCache.get(patientId);
  if (cached) return cached;
  
  const status = await checkConsentStatus(patientId);
  healthcareCache.set(patientId, status);
  return status;
}
```

### Batch Operations

```javascript
async function batchCheckConsentStatus(patientIds) {
  const promises = patientIds.map(id => checkConsentStatus(id));
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => ({
    patientId: patientIds[index],
    status: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

## 🚀 Deployment

### Environment Configuration

```bash
# Production environment
export NODE_ENV=production
export API_BASE_URL=https://healthcare.null.xyz
export CONTRACT_ADDRESS=0xYourProductionContract
export RPC_URL=https://mainnet.infura.io/v3/your-project-id
export API_KEY_SECRET=your-production-secret
export HIPAA_COMPLIANCE=true

# Staging environment
export NODE_ENV=staging
export API_BASE_URL=https://staging-healthcare.null.xyz
export CONTRACT_ADDRESS=0xYourStagingContract
export RPC_URL=https://goerli.infura.io/v3/your-project-id
export API_KEY_SECRET=your-staging-secret
export HIPAA_COMPLIANCE=true
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S healthcare -u 1001
USER healthcare

EXPOSE 3000

CMD ["npm", "start"]
```

### Health Checks

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    // Check contract connection
    await canonHealthContract.totalEvents();
    
    // Check IPFS connection
    await ipfs.pin.ls();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      hipaaCompliant: true
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## 📚 Additional Resources

- [API Reference](api-reference.md)
- [Smart Contract Documentation](smart-contracts.md)
- [HIPAA Compliance Guide](hipaa-compliance.md)
- [Security Guidelines](security-guidelines.md)
- [Testing Guide](testing-guide.md)
- [Deployment Guide](deployment-guide.md)

*This developer guide provides comprehensive technical documentation for integrating with the Canon Healthcare System. For additional support, contact the development team at dev@null.xyz.*
