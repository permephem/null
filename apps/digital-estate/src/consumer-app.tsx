import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface DigitalEstate {
  estateId: string;
  status: string;
  createdAt: number;
  deathDate: number;
  completedAt: number;
  totalAccounts: number;
  closedAccounts: number;
}

interface DigitalAccount {
  accountId: string;
  accountType: string;
  serviceProvider: string;
  accountIdentifier: string;
  requiresClosure: boolean;
  closed: boolean;
  closedAt: number;
  closureEvidence: string;
  notes: string;
}

interface ExecutorProfile {
  executorCommit: string;
  totalEstates: number;
  successfulEstates: number;
  totalEarnings: string;
  rating: number;
  active: boolean;
  joinedAt: number;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8787';

export default function DigitalEstateConsumerApp() {
  const [estateId, setEstateId] = useState('');
  const [estate, setEstate] = useState<DigitalEstate | null>(null);
  const [accounts, setAccounts] = useState<DigitalAccount[]>([]);
  const [executors, setExecutors] = useState<ExecutorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEstateForm, setShowEstateForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showExecutorForm, setShowExecutorForm] = useState(false);

  // Estate form state
  const [estateForm, setEstateForm] = useState({
    deceasedInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      deathDate: '',
      ssnLastFour: '',
      address: '',
      phoneNumber: '',
      emailAddress: ''
    },
    executorInfo: {
      firstName: '',
      lastName: '',
      relationship: '',
      phoneNumber: '',
      emailAddress: '',
      address: ''
    },
    documents: {
      deathCertificate: '',
      will: '',
      trust: '',
      powerOfAttorney: ''
    }
  });

  // Account form state
  const [accountForm, setAccountForm] = useState({
    accountType: 'banking',
    serviceProvider: '',
    accountIdentifier: '',
    requiresClosure: true,
    notes: ''
  });

  // Executor form state
  const [executorForm, setExecutorForm] = useState({
    executorInfo: {
      firstName: '',
      lastName: '',
      credentials: '',
      experience: '',
      certifications: [] as string[]
    }
  });

  useEffect(() => {
    if (estateId) {
      loadEstate();
      loadAccounts();
      loadExecutors();
    }
  }, [estateId]);

  const loadEstate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estate/${estateId}`);
      if (response.ok) {
        const data = await response.json();
        setEstate(data);
      }
    } catch (error) {
      console.error('Failed to load estate:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      // This would need to be implemented to fetch accounts by estate
      // For now, we'll use a placeholder
      setAccounts([]);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadExecutors = async () => {
    try {
      // This would need to be implemented to fetch available executors
      // For now, we'll use a placeholder
      setExecutors([]);
    } catch (error) {
      console.error('Failed to load executors:', error);
    }
  };

  const createEstate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/estate/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estateForm)
      });

      if (response.ok) {
        const data = await response.json();
        setEstateId(data.estateId);
        setShowEstateForm(false);
        await loadEstate();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create estate');
      }
    } catch (error) {
      setError('Failed to create estate');
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/estate/account/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estateId,
          ...accountForm
        })
      });

      if (response.ok) {
        await loadAccounts();
        setShowAccountForm(false);
        setAccountForm({
          accountType: 'banking',
          serviceProvider: '',
          accountIdentifier: '',
          requiresClosure: true,
          notes: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add account');
      }
    } catch (error) {
      setError('Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const registerExecutor = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/executor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executorForm)
      });

      if (response.ok) {
        await loadExecutors();
        setShowExecutorForm(false);
        setExecutorForm({
          executorInfo: {
            firstName: '',
            lastName: '',
            credentials: '',
            experience: '',
            certifications: []
          }
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to register executor');
      }
    } catch (error) {
      setError('Failed to register executor');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'executing': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      case 'permanently_closed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'banking': 'Banking',
      'credit_card': 'Credit Card',
      'investment': 'Investment',
      'social_media': 'Social Media',
      'email': 'Email',
      'subscription': 'Subscription',
      'utility': 'Utility',
      'insurance': 'Insurance',
      'government': 'Government',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  if (!estateId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Digital Estate Management</h1>
          <div className="space-y-4">
            <div>
              <label htmlFor="estateId" className="block text-sm font-medium text-gray-700">
                Estate ID
              </label>
              <input
                type="text"
                id="estateId"
                value={estateId}
                onChange={(e) => setEstateId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter estate ID"
              />
            </div>
            <button
              onClick={() => setEstateId(estateId)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Access Estate
            </button>
            <button
              onClick={() => setShowEstateForm(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Create New Estate
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
          <h1 className="text-3xl font-bold text-gray-900">Digital Estate Management</h1>
          <p className="text-gray-600 mt-2">Estate ID: {estateId}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Estate Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Estate Status</h2>
            <button
              onClick={() => setShowAccountForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Account
            </button>
          </div>

          {estate ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Status</h3>
                <span className={`inline-block px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(estate.status)}`}>
                  {estate.status.toUpperCase()}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Death Date</h3>
                <p className="text-sm text-gray-600">
                  {new Date(estate.deathDate * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Accounts</h3>
                <p className="text-sm text-gray-600">
                  {estate.closedAccounts} of {estate.totalAccounts} closed
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Progress</h3>
                <p className="text-sm text-gray-600">
                  {estate.totalAccounts > 0 ? Math.round((estate.closedAccounts / estate.totalAccounts) * 100) : 0}%
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Estate not found</p>
          )}
        </div>

        {/* Digital Accounts */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Digital Accounts</h2>
            <button
              onClick={() => setShowExecutorForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Register as Executor
            </button>
          </div>

          {accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.accountId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getAccountTypeLabel(account.accountType)} - {account.serviceProvider}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {account.accountIdentifier}</p>
                      <p className="text-sm text-gray-600">
                        {account.requiresClosure ? 'Requires Closure' : 'No Closure Required'}
                      </p>
                      {account.notes && (
                        <p className="text-sm text-gray-600 mt-2">{account.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${account.closed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {account.closed ? 'CLOSED' : 'OPEN'}
                      </span>
                    </div>
                  </div>
                  {account.closed && (
                    <p className="text-sm text-gray-600 mt-2">
                      Closed: {new Date(account.closedAt * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No accounts added</p>
          )}
        </div>

        {/* Available Executors */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Executors</h2>

          {executors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {executors.map((executor) => (
                <div key={executor.executorCommit} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Executor Profile</h3>
                  <p className="text-sm text-gray-600">ID: {executor.executorCommit.substring(0, 8)}...</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      Estates: {executor.successfulEstates}/{executor.totalEstates}
                    </p>
                    <p className="text-sm text-gray-600">
                      Rating: {executor.rating}/5
                    </p>
                    <p className="text-sm text-gray-600">
                      Earnings: ${executor.totalEarnings}
                    </p>
                    <p className="text-sm text-gray-600">
                      Joined: {new Date(executor.joinedAt * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${executor.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {executor.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No executors available</p>
          )}
        </div>

        {/* Estate Form Modal */}
        {showEstateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Digital Estate</h3>
              <div className="space-y-6">
                {/* Deceased Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Deceased Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="deceasedFirstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="deceasedFirstName"
                        value={estateForm.deceasedInfo.firstName}
                        onChange={(e) => setEstateForm({
                          ...estateForm,
                          deceasedInfo: {...estateForm.deceasedInfo, firstName: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="deceasedLastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="deceasedLastName"
                        value={estateForm.deceasedInfo.lastName}
                        onChange={(e) => setEstateForm({
                          ...estateForm,
                          deceasedInfo: {...estateForm.deceasedInfo, lastName: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        value={estateForm.deceasedInfo.dateOfBirth}
                        onChange={(e) => setEstateForm({
                          ...estateForm,
                          deceasedInfo: {...estateForm.deceasedInfo, dateOfBirth: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700">
                        Death Date
                      </label>
                      <input
                        type="date"
                        id="deathDate"
                        value={estateForm.deceasedInfo.deathDate}
                        onChange={(e) => setEstateForm({
                          ...estateForm,
                          deceasedInfo: {...estateForm.deceasedInfo, deathDate: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Executor Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Executor Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="executorFirstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="executorFirstName"
                        value={estateForm.executorInfo.firstName}
                        onChange={(e) => setEstateForm({
                          ...estateForm,
                          executorInfo: {...estateForm.executorInfo, firstName: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="executorLastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="executorLastName"
                        value={estateForm.executorInfo.lastName}
                        onChange={(e) => setEstateForm({
                          ...estateForm,
                          executorInfo: {...estateForm.executorInfo, lastName: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                        Relationship
                      </label>
                      <input
                        type="text"
                        id="relationship"
                        value={estateForm.executorInfo.relationship}
                        onChange={(e) => setEstateForm({
                          ...estateForm,
                          executorInfo: {...estateForm.executorInfo, relationship: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Spouse, child, sibling, etc."
                      />
                    </div>
                    <div>
                      <label htmlFor="executorEmail" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="executorEmail"
                        value={estateForm.executorInfo.emailAddress}
                        onChange={(e) => setEstateForm({
                          ...estateForm,
                          executorInfo: {...estateForm.executorInfo, emailAddress: e.target.value}
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="deathCertificate" className="block text-sm font-medium text-gray-700">
                        Death Certificate (Required)
                      </label>
                      <input
                        type="file"
                        id="deathCertificate"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="will" className="block text-sm font-medium text-gray-700">
                        Will (Optional)
                      </label>
                      <input
                        type="file"
                        id="will"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEstateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createEstate}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Estate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Form Modal */}
        {showAccountForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Digital Account</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                    Account Type
                  </label>
                  <select
                    id="accountType"
                    value={accountForm.accountType}
                    onChange={(e) => setAccountForm({...accountForm, accountType: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="banking">Banking</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="investment">Investment</option>
                    <option value="social_media">Social Media</option>
                    <option value="email">Email</option>
                    <option value="subscription">Subscription</option>
                    <option value="utility">Utility</option>
                    <option value="insurance">Insurance</option>
                    <option value="government">Government</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="serviceProvider" className="block text-sm font-medium text-gray-700">
                    Service Provider
                  </label>
                  <input
                    type="text"
                    id="serviceProvider"
                    value={accountForm.serviceProvider}
                    onChange={(e) => setAccountForm({...accountForm, serviceProvider: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Bank name, app name, etc."
                  />
                </div>
                <div>
                  <label htmlFor="accountIdentifier" className="block text-sm font-medium text-gray-700">
                    Account Identifier
                  </label>
                  <input
                    type="text"
                    id="accountIdentifier"
                    value={accountForm.accountIdentifier}
                    onChange={(e) => setAccountForm({...accountForm, accountIdentifier: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Account number, username, etc."
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={accountForm.requiresClosure}
                      onChange={(e) => setAccountForm({...accountForm, requiresClosure: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Requires Closure</span>
                  </label>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={accountForm.notes}
                    onChange={(e) => setAccountForm({...accountForm, notes: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional information about this account..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAccountForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={addAccount}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Executor Form Modal */}
        {showExecutorForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Register as Executor</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="executorFirstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="executorFirstName"
                      value={executorForm.executorInfo.firstName}
                      onChange={(e) => setExecutorForm({
                        ...executorForm,
                        executorInfo: {...executorForm.executorInfo, firstName: e.target.value}
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="executorLastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="executorLastName"
                      value={executorForm.executorInfo.lastName}
                      onChange={(e) => setExecutorForm({
                        ...executorForm,
                        executorInfo: {...executorForm.executorInfo, lastName: e.target.value}
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="credentials" className="block text-sm font-medium text-gray-700">
                    Credentials
                  </label>
                  <textarea
                    id="credentials"
                    rows={4}
                    value={executorForm.executorInfo.credentials}
                    onChange={(e) => setExecutorForm({
                      ...executorForm,
                      executorInfo: {...executorForm.executorInfo, credentials: e.target.value}
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your qualifications and experience..."
                  />
                </div>
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Experience
                  </label>
                  <textarea
                    id="experience"
                    rows={3}
                    value={executorForm.executorInfo.experience}
                    onChange={(e) => setExecutorForm({
                      ...executorForm,
                      executorInfo: {...executorForm.executorInfo, experience: e.target.value}
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your relevant experience..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowExecutorForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={registerExecutor}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register Executor'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
