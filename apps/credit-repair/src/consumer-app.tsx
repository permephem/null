import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface Dispute {
  disputeId: string;
  status: string;
  disputeType: string;
  submittedAt: number;
  resolvedAt: number;
  resolutionReason: string;
  isPermanentlyDeleted: boolean;
}

interface Subscription {
  consumerCommit: string;
  monthlyFee: string;
  startDate: number;
  lastPayment: number;
  active: boolean;
  disputesSubmitted: number;
  disputesResolved: number;
  totalPaid: string;
  totalRefunded: string;
}

interface CreditAccount {
  accountNumber?: string;
  creditorName: string;
  accountType: string;
  originalAmount?: string;
  currentBalance?: string;
  dateOpened?: string;
  dateReported?: string;
  lastPaymentDate?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8787';

export default function CreditRepairConsumerApp() {
  const [consumerId, setConsumerId] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);

  // Dispute form state
  const [disputeForm, setDisputeForm] = useState({
    accountInfo: {
      creditorName: '',
      accountType: '',
      originalAmount: '',
      currentBalance: '',
      dateOpened: '',
      dateReported: '',
      lastPaymentDate: ''
    },
    disputeType: 'inaccurate_info',
    explanation: '',
    consumerSignature: ''
  });

  // Subscription form state
  const [subscriptionForm, setSubscriptionForm] = useState({
    monthlyFee: '99.99',
    paymentMethod: 'credit_card'
  });

  useEffect(() => {
    if (consumerId) {
      loadSubscription();
      loadDisputes();
    }
  }, [consumerId]);

  const loadSubscription = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/${consumerId}`);
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const loadDisputes = async () => {
    try {
      // This would need to be implemented to fetch disputes by consumer
      // For now, we'll use a placeholder
      setDisputes([]);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    }
  };

  const createSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerId,
          ...subscriptionForm
        })
      });

      if (response.ok) {
        await loadSubscription();
        setShowSubscriptionForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create subscription');
      }
    } catch (error) {
      setError('Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const submitDispute = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/disputes/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerId,
          accountInfo: disputeForm.accountInfo,
          disputeType: disputeForm.disputeType,
          evidence: {
            explanation: disputeForm.explanation,
            consumerSignature: disputeForm.consumerSignature,
            dateSigned: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes([...disputes, {
          disputeId: data.disputeId,
          status: 'pending',
          disputeType: disputeForm.disputeType,
          submittedAt: Date.now(),
          resolvedAt: 0,
          resolutionReason: '',
          isPermanentlyDeleted: false
        }]);
        setShowDisputeForm(false);
        setDisputeForm({
          accountInfo: {
            creditorName: '',
            accountType: '',
            originalAmount: '',
            currentBalance: '',
            dateOpened: '',
            dateReported: '',
            lastPaymentDate: ''
          },
          disputeType: 'inaccurate_info',
          explanation: '',
          consumerSignature: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit dispute');
      }
    } catch (error) {
      setError('Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async (disputeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/${consumerId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId,
          reason: 'Dispute not resolved within agreed timeframe'
        })
      });

      if (response.ok) {
        await loadSubscription();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to request refund');
      }
    } catch (error) {
      setError('Failed to request refund');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'investigating': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'denied': return 'text-red-600 bg-red-100';
      case 'permanently_deleted': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDisputeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'inaccurate_info': 'Inaccurate Information',
      'identity_theft': 'Identity Theft',
      'outdated_info': 'Outdated Information',
      'duplicate_entry': 'Duplicate Entry',
      'paid_debt': 'Paid Debt',
      'bankruptcy_discharge': 'Bankruptcy Discharge',
      'statute_limitation': 'Statute of Limitations'
    };
    return labels[type] || type;
  };

  if (!consumerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Credit Repair Portal</h1>
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
                placeholder="Enter your consumer ID"
              />
            </div>
            <button
              onClick={() => setConsumerId(consumerId)}
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
          <h1 className="text-3xl font-bold text-gray-900">Credit Repair Portal</h1>
          <p className="text-gray-600 mt-2">Consumer ID: {consumerId}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Subscription Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Subscription Status</h2>
            {!subscription && (
              <button
                onClick={() => setShowSubscriptionForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Subscription
              </button>
            )}
          </div>

          {subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Status</h3>
                <p className={`text-sm ${subscription.active ? 'text-green-600' : 'text-red-600'}`}>
                  {subscription.active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Monthly Fee</h3>
                <p className="text-sm text-gray-600">${subscription.monthlyFee}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Disputes</h3>
                <p className="text-sm text-gray-600">
                  {subscription.disputesSubmitted} submitted, {subscription.disputesResolved} resolved
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No active subscription</p>
          )}
        </div>

        {/* Disputes */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Disputes</h2>
            {subscription?.active && (
              <button
                onClick={() => setShowDisputeForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Submit New Dispute
              </button>
            )}
          </div>

          {disputes.length > 0 ? (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.disputeId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getDisputeTypeLabel(dispute.disputeType)}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {dispute.disputeId}</p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(dispute.submittedAt).toLocaleDateString()}
                      </p>
                      {dispute.resolvedAt > 0 && (
                        <p className="text-sm text-gray-600">
                          Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                        {dispute.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {dispute.isPermanentlyDeleted && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          PERMANENTLY DELETED
                        </span>
                      )}
                    </div>
                  </div>
                  {dispute.resolutionReason && (
                    <p className="text-sm text-gray-600 mt-2">{dispute.resolutionReason}</p>
                  )}
                  {dispute.status === 'denied' && (
                    <button
                      onClick={() => requestRefund(dispute.disputeId)}
                      className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Request Refund
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No disputes submitted</p>
          )}
        </div>

        {/* Subscription Form Modal */}
        {showSubscriptionForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Subscription</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700">
                    Monthly Fee (USD)
                  </label>
                  <input
                    type="number"
                    id="monthlyFee"
                    value={subscriptionForm.monthlyFee}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, monthlyFee: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    value={subscriptionForm.paymentMethod}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, paymentMethod: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_account">Bank Account</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSubscriptionForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createSubscription}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Form Modal */}
        {showDisputeForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Dispute</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="creditorName" className="block text-sm font-medium text-gray-700">
                      Creditor Name
                    </label>
                    <input
                      type="text"
                      id="creditorName"
                      value={disputeForm.accountInfo.creditorName}
                      onChange={(e) => setDisputeForm({
                        ...disputeForm,
                        accountInfo: {...disputeForm.accountInfo, creditorName: e.target.value}
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                      Account Type
                    </label>
                    <input
                      type="text"
                      id="accountType"
                      value={disputeForm.accountInfo.accountType}
                      onChange={(e) => setDisputeForm({
                        ...disputeForm,
                        accountInfo: {...disputeForm.accountInfo, accountType: e.target.value}
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="disputeType" className="block text-sm font-medium text-gray-700">
                    Dispute Type
                  </label>
                  <select
                    id="disputeType"
                    value={disputeForm.disputeType}
                    onChange={(e) => setDisputeForm({...disputeForm, disputeType: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="inaccurate_info">Inaccurate Information</option>
                    <option value="identity_theft">Identity Theft</option>
                    <option value="outdated_info">Outdated Information</option>
                    <option value="duplicate_entry">Duplicate Entry</option>
                    <option value="paid_debt">Paid Debt</option>
                    <option value="bankruptcy_discharge">Bankruptcy Discharge</option>
                    <option value="statute_limitation">Statute of Limitations</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
                    Explanation
                  </label>
                  <textarea
                    id="explanation"
                    rows={4}
                    value={disputeForm.explanation}
                    onChange={(e) => setDisputeForm({...disputeForm, explanation: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Explain why this information is incorrect..."
                  />
                </div>
                <div>
                  <label htmlFor="consumerSignature" className="block text-sm font-medium text-gray-700">
                    Digital Signature
                  </label>
                  <input
                    type="text"
                    id="consumerSignature"
                    value={disputeForm.consumerSignature}
                    onChange={(e) => setDisputeForm({...disputeForm, consumerSignature: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your digital signature"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDisputeForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDispute}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
