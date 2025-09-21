import React, { useState, useEffect } from 'react';

interface ConsumerOptOut {
  optOutType: string;
  status: string;
  createdAt: number;
  verifiedAt: number;
  expiresAt: number;
  evidenceUri: string;
}

interface AdNetwork {
  name: string;
  domain: string;
  compliant: boolean;
  violations: number;
  lastViolation: number;
  blacklisted: boolean;
  registeredAt: number;
}

interface ComplianceScore {
  adNetwork: string;
  score: number;
  totalChecks: number;
  violations: number;
  lastCheck: number;
  certified: boolean;
  certificationExpiry: number;
}

interface SystemStats {
  optOuts: {
    total: number;
    violations: number;
    penalties: number;
    networks: number;
  };
  monitoring: {
    totalRules: number;
    totalSessions: number;
    totalViolations: number;
    totalDetections: number;
  };
  protection: {
    totalClaims: number;
    totalPenalties: number;
    totalPayouts: string;
    totalDeposits: string;
    poolBalance: string;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8787';

export default function AdtechOptOutConsumerApp() {
  const [consumerId, setConsumerId] = useState('');
  const [optOuts, setOptOuts] = useState<ConsumerOptOut[]>([]);
  const [networks, setNetworks] = useState<AdNetwork[]>([]);
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptOutForm, setShowOptOutForm] = useState(false);
  const [showViolationForm, setShowViolationForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);

  // Opt-out form state
  const [optOutForm, setOptOutForm] = useState({
    consumerInfo: {
      email: '',
      phone: '',
      deviceId: '',
      browserFingerprint: ''
    },
    optOutType: 'gpc',
    evidence: {
      optOutScreenshot: '',
      optOutConfirmation: '',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ipAddress: ''
    },
    preferences: {
      expiresAt: 0,
      notifyOnViolation: true,
      allowMonitoring: true
    }
  });

  // Violation form state
  const [violationForm, setViolationForm] = useState({
    adNetwork: '',
    violationType: 'tracking_after_optout',
    evidence: {
      screenshot: '',
      networkRequests: '',
      cookies: '',
      localStorage: '',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    },
    severity: 5
  });

  // Claim form state
  const [claimForm, setClaimForm] = useState({
    violationType: 'tracking_after_optout',
    claimAmount: '100',
    evidenceUri: ''
  });

  useEffect(() => {
    if (consumerId) {
      loadOptOuts();
      loadStats();
    }
  }, [consumerId]);

  const loadOptOuts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/optout/${consumerId}`);
      if (response.ok) {
        const data = await response.json();
        setOptOuts(data.optOuts);
      }
    } catch (error) {
      console.error('Failed to load opt-outs:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const registerOptOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/optout/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optOutForm)
      });

      if (response.ok) {
        const data = await response.json();
        setConsumerId(data.consumerId);
        setShowOptOutForm(false);
        await loadOptOuts();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to register opt-out');
      }
    } catch (error) {
      setError('Failed to register opt-out');
    } finally {
      setLoading(false);
    }
  };

  const reportViolation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/violation/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerId,
          ...violationForm
        })
      });

      if (response.ok) {
        await loadOptOuts();
        setShowViolationForm(false);
        setViolationForm({
          adNetwork: '',
          violationType: 'tracking_after_optout',
          evidence: {
            screenshot: '',
            networkRequests: '',
            cookies: '',
            localStorage: '',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
          },
          severity: 5
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to report violation');
      }
    } catch (error) {
      setError('Failed to report violation');
    } finally {
      setLoading(false);
    }
  };

  const submitClaim = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/claim/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerId,
          ...claimForm
        })
      });

      if (response.ok) {
        setShowClaimForm(false);
        setClaimForm({
          violationType: 'tracking_after_optout',
          claimAmount: '100',
          evidenceUri: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit claim');
      }
    } catch (error) {
      setError('Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'verified': return 'text-blue-600 bg-blue-100';
      case 'violated': return 'text-red-600 bg-red-100';
      case 'revoked': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOptOutTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'nai': 'Network Advertising Initiative',
      'daa': 'Digital Advertising Alliance',
      'gpc': 'Global Privacy Control',
      'ccpa': 'California Consumer Privacy Act',
      'gdpr': 'General Data Protection Regulation',
      'custom': 'Custom Opt-Out'
    };
    return labels[type] || type;
  };

  const getViolationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'tracking_after_optout': 'Tracking After Opt-Out',
      'retargeting_after_optout': 'Retargeting After Opt-Out',
      'data_collection_after_optout': 'Data Collection After Opt-Out',
      'ad_serving_after_optout': 'Ad Serving After Opt-Out',
      'cross_site_tracking': 'Cross-Site Tracking',
      'fingerprinting_after_optout': 'Fingerprinting After Opt-Out'
    };
    return labels[type] || type;
  };

  if (!consumerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Adtech Opt-Out Management</h1>
          <div className="space-y-4">
            <div>
              <label htmlFor="consumerId" className="block text-sm font-medium text-gray-700">
                Consumer ID
              </label>
              <input
                type="text"
                id="consumerId"
                value={consumerId}
                onChange={(e) => setConsumerId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter consumer ID"
              />
            </div>
            <button
              onClick={() => setConsumerId(consumerId)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Access Opt-Outs
            </button>
            <button
              onClick={() => setShowOptOutForm(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Register New Opt-Out
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
          <h1 className="text-3xl font-bold text-gray-900">Adtech Opt-Out Management</h1>
          <p className="text-gray-600 mt-2">Consumer ID: {consumerId}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* System Statistics */}
        {stats && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Opt-Outs</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.optOuts.total.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{stats.optOuts.violations} violations</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Monitoring</h3>
                <p className="text-2xl font-bold text-green-600">{stats.monitoring.totalSessions.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{stats.monitoring.totalDetections} detections</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Protection Pool</h3>
                <p className="text-2xl font-bold text-purple-600">${stats.protection.poolBalance}</p>
                <p className="text-sm text-gray-600">{stats.protection.totalClaims} claims</p>
              </div>
            </div>
          </div>
        )}

        {/* Consumer Opt-Outs */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Opt-Outs</h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowViolationForm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Report Violation
              </button>
              <button
                onClick={() => setShowClaimForm(true)}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
              >
                Submit Claim
              </button>
            </div>
          </div>

          {optOuts.length > 0 ? (
            <div className="space-y-4">
              {optOuts.map((optOut, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getOptOutTypeLabel(optOut.optOutType)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(optOut.createdAt * 1000).toLocaleDateString()}
                      </p>
                      {optOut.verifiedAt > 0 && (
                        <p className="text-sm text-gray-600">
                          Verified: {new Date(optOut.verifiedAt * 1000).toLocaleDateString()}
                        </p>
                      )}
                      {optOut.expiresAt > 0 && (
                        <p className="text-sm text-gray-600">
                          Expires: {new Date(optOut.expiresAt * 1000).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(optOut.status)}`}>
                        {optOut.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {optOut.evidenceUri && (
                    <div className="mt-2">
                      <a
                        href={optOut.evidenceUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Evidence
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No opt-outs registered</p>
          )}
        </div>

        {/* Opt-Out Form Modal */}
        {showOptOutForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Register Opt-Out</h3>
              <div className="space-y-6">
                {/* Consumer Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Consumer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={optOutForm.consumerInfo.email}
                        onChange={(e) => setOptOutForm({
                          ...optOutForm,
                          consumerInfo: {...optOutForm.consumerInfo, email: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={optOutForm.consumerInfo.phone}
                        onChange={(e) => setOptOutForm({
                          ...optOutForm,
                          consumerInfo: {...optOutForm.consumerInfo, phone: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Opt-Out Type */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Opt-Out Type</h4>
                  <select
                    value={optOutForm.optOutType}
                    onChange={(e) => setOptOutForm({...optOutForm, optOutType: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="gpc">Global Privacy Control (GPC)</option>
                    <option value="ccpa">California Consumer Privacy Act (CCPA)</option>
                    <option value="gdpr">General Data Protection Regulation (GDPR)</option>
                    <option value="nai">Network Advertising Initiative (NAI)</option>
                    <option value="daa">Digital Advertising Alliance (DAA)</option>
                    <option value="custom">Custom Opt-Out</option>
                  </select>
                </div>

                {/* Evidence */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Evidence</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700">
                        Opt-Out Screenshot (Optional)
                      </label>
                      <input
                        type="file"
                        id="screenshot"
                        accept="image/*"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700">
                        Opt-Out Confirmation (Optional)
                      </label>
                      <input
                        type="file"
                        id="confirmation"
                        accept="image/*,.pdf"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Preferences</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="date"
                        id="expiresAt"
                        value={optOutForm.preferences.expiresAt ? new Date(optOutForm.preferences.expiresAt * 1000).toISOString().split('T')[0] : ''}
                        onChange={(e) => setOptOutForm({
                          ...optOutForm,
                          preferences: {
                            ...optOutForm.preferences,
                            expiresAt: e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : 0
                          }
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={optOutForm.preferences.notifyOnViolation}
                          onChange={(e) => setOptOutForm({
                            ...optOutForm,
                            preferences: {...optOutForm.preferences, notifyOnViolation: e.target.checked}
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Notify me of violations</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={optOutForm.preferences.allowMonitoring}
                          onChange={(e) => setOptOutForm({
                            ...optOutForm,
                            preferences: {...optOutForm.preferences, allowMonitoring: e.target.checked}
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Allow monitoring for compliance</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowOptOutForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={registerOptOut}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register Opt-Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Violation Form Modal */}
        {showViolationForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Violation</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="adNetwork" className="block text-sm font-medium text-gray-700">
                    Ad Network
                  </label>
                  <input
                    type="text"
                    id="adNetwork"
                    value={violationForm.adNetwork}
                    onChange={(e) => setViolationForm({...violationForm, adNetwork: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Google, Facebook, Amazon"
                  />
                </div>
                <div>
                  <label htmlFor="violationType" className="block text-sm font-medium text-gray-700">
                    Violation Type
                  </label>
                  <select
                    id="violationType"
                    value={violationForm.violationType}
                    onChange={(e) => setViolationForm({...violationForm, violationType: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tracking_after_optout">Tracking After Opt-Out</option>
                    <option value="retargeting_after_optout">Retargeting After Opt-Out</option>
                    <option value="data_collection_after_optout">Data Collection After Opt-Out</option>
                    <option value="ad_serving_after_optout">Ad Serving After Opt-Out</option>
                    <option value="cross_site_tracking">Cross-Site Tracking</option>
                    <option value="fingerprinting_after_optout">Fingerprinting After Opt-Out</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                    Severity (1-10)
                  </label>
                  <input
                    type="range"
                    id="severity"
                    min="1"
                    max="10"
                    value={violationForm.severity}
                    onChange={(e) => setViolationForm({...violationForm, severity: parseInt(e.target.value)})}
                    className="mt-1 block w-full"
                  />
                  <p className="text-sm text-gray-600">Severity: {violationForm.severity}</p>
                </div>
                <div>
                  <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700">
                    Evidence Screenshot
                  </label>
                  <input
                    type="file"
                    id="screenshot"
                    accept="image/*"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowViolationForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={reportViolation}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Reporting...' : 'Report Violation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Claim Form Modal */}
        {showClaimForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Claim</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="claimViolationType" className="block text-sm font-medium text-gray-700">
                    Violation Type
                  </label>
                  <select
                    id="claimViolationType"
                    value={claimForm.violationType}
                    onChange={(e) => setClaimForm({...claimForm, violationType: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tracking_after_optout">Tracking After Opt-Out</option>
                    <option value="retargeting_after_optout">Retargeting After Opt-Out</option>
                    <option value="data_collection_after_optout">Data Collection After Opt-Out</option>
                    <option value="ad_serving_after_optout">Ad Serving After Opt-Out</option>
                    <option value="cross_site_tracking">Cross-Site Tracking</option>
                    <option value="fingerprinting_after_optout">Fingerprinting After Opt-Out</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="claimAmount" className="block text-sm font-medium text-gray-700">
                    Claim Amount (USD)
                  </label>
                  <input
                    type="number"
                    id="claimAmount"
                    value={claimForm.claimAmount}
                    onChange={(e) => setClaimForm({...claimForm, claimAmount: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label htmlFor="claimEvidence" className="block text-sm font-medium text-gray-700">
                    Evidence URI
                  </label>
                  <input
                    type="text"
                    id="claimEvidence"
                    value={claimForm.evidenceUri}
                    onChange={(e) => setClaimForm({...claimForm, evidenceUri: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ipfs://Qm..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowClaimForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitClaim}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
