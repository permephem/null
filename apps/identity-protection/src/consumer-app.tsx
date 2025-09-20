import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface IdentityProfile {
  identityCommit: string;
  status: string;
  verifiedAt: number;
  lastActivity: number;
  isProtected: boolean;
}

interface ProtectionPlan {
  identityCommit: string;
  monthlyFee: string;
  protectionLevel: number;
  active: boolean;
  startDate: number;
  lastPayment: number;
  fraudCases: number;
  resolvedCases: number;
  totalPaid: string;
  totalRefunded: string;
}

interface FraudAlert {
  alertId: string;
  fraudType: string;
  description: string;
  detectedAt: number;
  resolved: boolean;
  resolutionEvidence: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8787';

export default function IdentityProtectionConsumerApp() {
  const [identityId, setIdentityId] = useState('');
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [protectionPlan, setProtectionPlan] = useState<ProtectionPlan | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showProtectionForm, setShowProtectionForm] = useState(false);
  const [showFraudReportForm, setShowFraudReportForm] = useState(false);

  // Verification form state
  const [verificationForm, setVerificationForm] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      ssnLastFour: '',
      address: '',
      phoneNumber: '',
      emailAddress: ''
    },
    biometricData: {
      fingerprintHash: '',
      faceRecognitionHash: '',
      voicePrintHash: '',
      irisScanHash: ''
    },
    evidence: {
      governmentId: '',
      utilityBill: '',
      bankStatement: '',
      verificationMethod: 'government_id'
    }
  });

  // Protection plan form state
  const [protectionForm, setProtectionForm] = useState({
    protectionLevel: 5,
    monthlyFee: '29.99',
    features: {
      creditFreeze: true,
      accountMonitoring: true,
      biometricVerification: true,
      fraudPrevention: true,
      identityRestoration: true
    }
  });

  // Fraud report form state
  const [fraudReportForm, setFraudReportForm] = useState({
    fraudType: 'account_opening',
    description: '',
    institution: '',
    evidence: {
      suspiciousActivity: '',
      supportingDocuments: [] as string[],
      reportedBy: ''
    }
  });

  useEffect(() => {
    if (identityId) {
      loadProfile();
      loadProtectionPlan();
      loadFraudAlerts();
    }
  }, [identityId]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/${identityId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadProtectionPlan = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/protection/${identityId}/plan`);
      if (response.ok) {
        const data = await response.json();
        setProtectionPlan(data);
      }
    } catch (error) {
      console.error('Failed to load protection plan:', error);
    }
  };

  const loadFraudAlerts = async () => {
    try {
      // This would need to be implemented to fetch fraud alerts by identity
      // For now, we'll use a placeholder
      setFraudAlerts([]);
    } catch (error) {
      console.error('Failed to load fraud alerts:', error);
    }
  };

  const verifyIdentity = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/identity/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityId,
          ...verificationForm
        })
      });

      if (response.ok) {
        await loadProfile();
        setShowVerificationForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to verify identity');
      }
    } catch (error) {
      setError('Failed to verify identity');
    } finally {
      setLoading(false);
    }
  };

  const createProtectionPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/protection/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityId,
          ...protectionForm
        })
      });

      if (response.ok) {
        await loadProtectionPlan();
        setShowProtectionForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create protection plan');
      }
    } catch (error) {
      setError('Failed to create protection plan');
    } finally {
      setLoading(false);
    }
  };

  const reportFraud = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/fraud/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityId,
          ...fraudReportForm
        })
      });

      if (response.ok) {
        await loadFraudAlerts();
        setShowFraudReportForm(false);
        setFraudReportForm({
          fraudType: 'account_opening',
          description: '',
          institution: '',
          evidence: {
            suspiciousActivity: '',
            supportingDocuments: [],
            reportedBy: ''
          }
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to report fraud');
      }
    } catch (error) {
      setError('Failed to report fraud');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'compromised': return 'text-red-600 bg-red-100';
      case 'under_investigation': return 'text-yellow-600 bg-yellow-100';
      case 'restored': return 'text-blue-600 bg-blue-100';
      case 'permanently_protected': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFraudTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'account_opening': 'Fraudulent Account Opening',
      'credit_application': 'Fraudulent Credit Application',
      'loan_application': 'Fraudulent Loan Application',
      'tax_fraud': 'Tax Fraud',
      'medical_identity': 'Medical Identity Theft',
      'synthetic_identity': 'Synthetic Identity Creation',
      'account_takeover': 'Account Takeover'
    };
    return labels[type] || type;
  };

  if (!identityId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Identity Protection Portal</h1>
          <div className="space-y-4">
            <div>
              <label htmlFor="identityId" className="block text-sm font-medium text-gray-700">
                Identity ID
              </label>
              <input
                type="text"
                id="identityId"
                value={identityId}
                onChange={(e) => setIdentityId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your identity ID"
              />
            </div>
            <button
              onClick={() => setIdentityId(identityId)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Access Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Identity Protection Portal</h1>
          <p className="text-gray-600 mt-2">Identity ID: {identityId}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Identity Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Identity Status</h2>
            {!profile && (
              <button
                onClick={() => setShowVerificationForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Verify Identity
              </button>
            )}
          </div>

          {profile ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Status</h3>
                <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(profile.status)}`}>
                  {profile.status.toUpperCase()}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Verified</h3>
                <p className="text-sm text-gray-600">
                  {new Date(profile.verifiedAt * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Protection</h3>
                <p className={`text-sm ${profile.isProtected ? 'text-green-600' : 'text-red-600'}`}>
                  {profile.isProtected ? 'Protected' : 'Not Protected'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Identity not verified</p>
          )}
        </div>

        {/* Protection Plan */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Protection Plan</h2>
            {!protectionPlan && profile && (
              <button
                onClick={() => setShowProtectionForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Protection Plan
              </button>
            )}
          </div>

          {protectionPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Status</h3>
                <p className={`text-sm ${protectionPlan.active ? 'text-green-600' : 'text-red-600'}`}>
                  {protectionPlan.active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Monthly Fee</h3>
                <p className="text-sm text-gray-600">${protectionPlan.monthlyFee}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Protection Level</h3>
                <p className="text-sm text-gray-600">{protectionPlan.protectionLevel}/10</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Fraud Cases</h3>
                <p className="text-sm text-gray-600">
                  {protectionPlan.fraudCases} reported, {protectionPlan.resolvedCases} resolved
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No active protection plan</p>
          )}
        </div>

        {/* Fraud Alerts */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Fraud Alerts</h2>
            {protectionPlan?.active && (
              <button
                onClick={() => setShowFraudReportForm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Report Fraud
              </button>
            )}
          </div>

          {fraudAlerts.length > 0 ? (
            <div className="space-y-4">
              {fraudAlerts.map((alert) => (
                <div key={alert.alertId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getFraudTypeLabel(alert.fraudType)}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {alert.alertId}</p>
                      <p className="text-sm text-gray-600">
                        Detected: {new Date(alert.detectedAt * 1000).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{alert.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${alert.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {alert.resolved ? 'RESOLVED' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No fraud alerts</p>
          )}
        </div>

        {/* Verification Form Modal */}
        {showVerificationForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Verify Identity</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={verificationForm.personalInfo.firstName}
                      onChange={(e) => setVerificationForm({
                        ...verificationForm,
                        personalInfo: {...verificationForm.personalInfo, firstName: e.target.value}
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={verificationForm.personalInfo.lastName}
                      onChange={(e) => setVerificationForm({
                        ...verificationForm,
                        personalInfo: {...verificationForm.personalInfo, lastName: e.target.value}
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={verificationForm.personalInfo.dateOfBirth}
                    onChange={(e) => setVerificationForm({
                      ...verificationForm,
                      personalInfo: {...verificationForm.personalInfo, dateOfBirth: e.target.value}
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="ssnLastFour" className="block text-sm font-medium text-gray-700">
                    SSN Last 4 Digits
                  </label>
                  <input
                    type="text"
                    id="ssnLastFour"
                    maxLength={4}
                    value={verificationForm.personalInfo.ssnLastFour}
                    onChange={(e) => setVerificationForm({
                      ...verificationForm,
                      personalInfo: {...verificationForm.personalInfo, ssnLastFour: e.target.value}
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={verificationForm.personalInfo.address}
                    onChange={(e) => setVerificationForm({
                      ...verificationForm,
                      personalInfo: {...verificationForm.personalInfo, address: e.target.value}
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={verificationForm.personalInfo.phoneNumber}
                      onChange={(e) => setVerificationForm({
                        ...verificationForm,
                        personalInfo: {...verificationForm.personalInfo, phoneNumber: e.target.value}
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="emailAddress"
                      value={verificationForm.personalInfo.emailAddress}
                      onChange={(e) => setVerificationForm({
                        ...verificationForm,
                        personalInfo: {...verificationForm.personalInfo, emailAddress: e.target.value}
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowVerificationForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyIdentity}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Identity'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Protection Plan Form Modal */}
        {showProtectionForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Protection Plan</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="protectionLevel" className="block text-sm font-medium text-gray-700">
                    Protection Level (1-10)
                  </label>
                  <input
                    type="number"
                    id="protectionLevel"
                    min="1"
                    max="10"
                    value={protectionForm.protectionLevel}
                    onChange={(e) => setProtectionForm({...protectionForm, protectionLevel: parseInt(e.target.value)})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700">
                    Monthly Fee (USD)
                  </label>
                  <input
                    type="number"
                    id="monthlyFee"
                    step="0.01"
                    value={protectionForm.monthlyFee}
                    onChange={(e) => setProtectionForm({...protectionForm, monthlyFee: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Protection Features</h4>
                  {Object.entries(protectionForm.features).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setProtectionForm({
                          ...protectionForm,
                          features: {...protectionForm.features, [key]: e.target.checked}
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowProtectionForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createProtectionPlan}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fraud Report Form Modal */}
        {showFraudReportForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Fraud</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fraudType" className="block text-sm font-medium text-gray-700">
                    Fraud Type
                  </label>
                  <select
                    id="fraudType"
                    value={fraudReportForm.fraudType}
                    onChange={(e) => setFraudReportForm({...fraudReportForm, fraudType: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="account_opening">Fraudulent Account Opening</option>
                    <option value="credit_application">Fraudulent Credit Application</option>
                    <option value="loan_application">Fraudulent Loan Application</option>
                    <option value="tax_fraud">Tax Fraud</option>
                    <option value="medical_identity">Medical Identity Theft</option>
                    <option value="synthetic_identity">Synthetic Identity Creation</option>
                    <option value="account_takeover">Account Takeover</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                    Institution
                  </label>
                  <input
                    type="text"
                    id="institution"
                    value={fraudReportForm.institution}
                    onChange={(e) => setFraudReportForm({...fraudReportForm, institution: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Bank, credit card company, etc."
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={fraudReportForm.description}
                    onChange={(e) => setFraudReportForm({...fraudReportForm, description: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the fraudulent activity..."
                  />
                </div>
                <div>
                  <label htmlFor="suspiciousActivity" className="block text-sm font-medium text-gray-700">
                    Suspicious Activity Details
                  </label>
                  <textarea
                    id="suspiciousActivity"
                    rows={3}
                    value={fraudReportForm.evidence.suspiciousActivity}
                    onChange={(e) => setFraudReportForm({
                      ...fraudReportForm,
                      evidence: {...fraudReportForm.evidence, suspiciousActivity: e.target.value}
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide details about the suspicious activity..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowFraudReportForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={reportFraud}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Reporting...' : 'Report Fraud'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
