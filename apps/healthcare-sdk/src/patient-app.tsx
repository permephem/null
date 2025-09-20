import React, { useState, useEffect } from 'react';

interface ConsentStatus {
  patientId: string;
  hasConsent: boolean;
  checkedAt: string;
}

interface MedicalRecord {
  recordType: string;
  recordHash: string;
  providerId: string;
  timestamp: string;
  assurance: number;
}

interface ConsentRequest {
  purpose: 'treatment' | 'research' | 'billing' | 'quality_assurance';
  dataTypes: string[];
  expirationDate?: string;
}

const HEALTHCARE_API_BASE = process.env.REACT_APP_HEALTHCARE_API_BASE || 'http://localhost:8787';

export default function PatientApp() {
  const [patientId, setPatientId] = useState('');
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [consentRequest, setConsentRequest] = useState<ConsentRequest>({
    purpose: 'treatment',
    dataTypes: [],
    expirationDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check consent status
  const checkConsentStatus = async () => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${HEALTHCARE_API_BASE}/consent/status/${patientId}`);
      if (!response.ok) throw new Error('Failed to check consent status');
      
      const data = await response.json();
      setConsentStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Grant consent
  const grantConsent = async () => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${HEALTHCARE_API_BASE}/consent/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'demo-api-key-123',
          'X-Provider-ID': 'demo-provider-123'
        },
        body: JSON.stringify({
          patientId,
          purpose: consentRequest.purpose,
          dataTypes: consentRequest.dataTypes,
          expirationDate: consentRequest.expirationDate || undefined,
          evidence: {
            patientSignature: 'digital-signature-placeholder',
            witnessSignature: 'witness-signature-placeholder'
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to grant consent');
      
      const data = await response.json();
      console.log('Consent granted:', data);
      
      // Refresh consent status
      await checkConsentStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Revoke consent
  const revokeConsent = async () => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${HEALTHCARE_API_BASE}/consent/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'demo-api-key-123',
          'X-Provider-ID': 'demo-provider-123'
        },
        body: JSON.stringify({
          patientId,
          purpose: consentRequest.purpose,
          reason: 'Patient requested revocation',
          evidence: {
            patientSignature: 'digital-signature-placeholder',
            revocationReason: 'Patient requested revocation'
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to revoke consent');
      
      const data = await response.json();
      console.log('Consent revoked:', data);
      
      // Refresh consent status
      await checkConsentStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Get healthcare stats
  const getStats = async () => {
    try {
      const response = await fetch(`${HEALTHCARE_API_BASE}/stats`);
      if (!response.ok) throw new Error('Failed to get stats');
      
      const data = await response.json();
      console.log('Healthcare stats:', data);
    } catch (err) {
      console.error('Error getting stats:', err);
    }
  };

  useEffect(() => {
    if (patientId) {
      checkConsentStatus();
    }
  }, [patientId]);

  return (
    <div style={{ fontFamily: 'Inter, system-ui', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>🏥 Null Protocol Healthcare Patient Portal</h1>
      
      {/* Patient ID Input */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Patient ID
        </label>
        <input
          type="text"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          placeholder="Enter your patient ID"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
      </div>

      {/* Consent Status */}
      {consentStatus && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem', 
          border: '1px solid #ccc', 
          borderRadius: '8px',
          backgroundColor: consentStatus.hasConsent ? '#f0f9ff' : '#fef2f2'
        }}>
          <h3>Consent Status</h3>
          <p><strong>Patient ID:</strong> {consentStatus.patientId}</p>
          <p><strong>Has Consent:</strong> 
            <span style={{ 
              color: consentStatus.hasConsent ? 'green' : 'red',
              fontWeight: 'bold',
              marginLeft: '0.5rem'
            }}>
              {consentStatus.hasConsent ? '✅ Yes' : '❌ No'}
            </span>
          </p>
          <p><strong>Last Checked:</strong> {new Date(consentStatus.checkedAt).toLocaleString()}</p>
        </div>
      )}

      {/* Consent Management */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Consent Management</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Purpose
          </label>
          <select
            value={consentRequest.purpose}
            onChange={(e) => setConsentRequest({
              ...consentRequest,
              purpose: e.target.value as any
            })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          >
            <option value="treatment">Treatment</option>
            <option value="research">Research</option>
            <option value="billing">Billing</option>
            <option value="quality_assurance">Quality Assurance</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Data Types
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {['medical_records', 'lab_results', 'imaging', 'medications', 'allergies'].map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={consentRequest.dataTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setConsentRequest({
                        ...consentRequest,
                        dataTypes: [...consentRequest.dataTypes, type]
                      });
                    } else {
                      setConsentRequest({
                        ...consentRequest,
                        dataTypes: consentRequest.dataTypes.filter(t => t !== type)
                      });
                    }
                  }}
                />
                {type.replace('_', ' ')}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Expiration Date (Optional)
          </label>
          <input
            type="date"
            value={consentRequest.expirationDate}
            onChange={(e) => setConsentRequest({
              ...consentRequest,
              expirationDate: e.target.value
            })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={grantConsent}
            disabled={loading || !patientId}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : 'Grant Consent'}
          </button>

          <button
            onClick={revokeConsent}
            disabled={loading || !patientId}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : 'Revoke Consent'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Healthcare Statistics</h3>
        <button
          onClick={getStats}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Get Stats
        </button>
      </div>

      {/* HIPAA Notice */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <h4>HIPAA Privacy Notice</h4>
        <p>
          This application is designed to be HIPAA-compliant. No personally identifiable information (PHI) 
          is stored on the blockchain. Only cryptographic commitments and consent status are recorded. 
          All data access is logged for audit purposes.
        </p>
      </div>
    </div>
  );
}
