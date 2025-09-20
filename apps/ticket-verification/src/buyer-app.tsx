import React, { useState, useEffect } from 'react';

interface TicketHistory {
  ticketId: string;
  currentStatus: string;
  currentOwner: string;
  eventInfo: {
    eventId: string;
    seatLocation: string;
    originalPrice: number;
    validUntil: string;
  };
  transferRules: {
    maxResaleMarkup: number;
    authorizedExchanges: string[];
  };
  ownershipHistory: Array<{
    transferNumber: number;
    from: string;
    to: string;
    price: number;
    markup: number;
    compliance: string;
    exchange: string;
    timestamp: string;
    evidenceUri: string;
  }>;
  priceAnalysis: {
    currentPrice: number;
    totalMarkup: number;
    averagePrice: number;
    priceTrend: string;
    maxPrice: number;
    minPrice: number;
  };
  complianceStatus: {
    complianceRate: number;
    totalViolations: number;
    violationTypes: Record<string, number>;
  };
  riskAssessment: string;
  generatedAt: string;
}

interface VerificationResult {
  ticketId: string;
  isValid: boolean;
  currentOwner: string;
  sellerVerified: boolean;
  priceCompliant: boolean;
  exchangeCompliant: boolean;
  riskLevel: string;
  warnings: string[];
  recommendations: string[];
}

const VERIFICATION_API_BASE = process.env.REACT_APP_VERIFICATION_API_BASE || 'http://localhost:8787';

export default function BuyerApp() {
  const [ticketId, setTicketId] = useState('');
  const [ticketHistory, setTicketHistory] = useState<TicketHistory | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'verify' | 'escrow'>('history');

  // Get complete ticket history (Carfax-like report)
  const getTicketHistory = async () => {
    if (!ticketId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${VERIFICATION_API_BASE}/tickets/${ticketId}/history`);
      if (!response.ok) throw new Error('Failed to get ticket history');
      
      const data = await response.json();
      setTicketHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Verify ticket before purchase
  const verifyTicket = async () => {
    if (!ticketId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${VERIFICATION_API_BASE}/tickets/${ticketId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Buyer-Address': '0xBuyerAddress123' // In real app, get from wallet
        },
        body: JSON.stringify({
          ticketId,
          buyerAddress: '0xBuyerAddress123',
          sellerAddress: ticketHistory?.currentOwner
        })
      });
      
      if (!response.ok) throw new Error('Failed to verify ticket');
      
      const data = await response.json();
      setVerificationResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Create escrow for purchase
  const createEscrow = async () => {
    if (!ticketId || !ticketHistory) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${VERIFICATION_API_BASE}/escrow/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Buyer-Address': '0xBuyerAddress123'
        },
        body: JSON.stringify({
          ticketId,
          sellerAddress: ticketHistory.currentOwner,
          amount: (ticketHistory.priceAnalysis.currentPrice * 1e18).toString(), // Convert to wei
          expiresAt: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        })
      });
      
      if (!response.ok) throw new Error('Failed to create escrow');
      
      const data = await response.json();
      alert(`Escrow created! Transaction: ${data.canonTx}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      getTicketHistory();
    }
  }, [ticketId]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID': return '#10b981';
      case 'REVOKED': return '#ef4444';
      case 'USED': return '#6b7280';
      case 'EXPIRED': return '#f59e0b';
      case 'FRAUDULENT': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>🎫 Canon Ticket Verification ("Carfax for Tickets")</h1>
      
      {/* Ticket ID Input */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Ticket ID or QR Code
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Enter ticket ID or scan QR code"
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={getTicketHistory}
            disabled={loading || !ticketId}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Loading...' : 'Get History'}
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

      {/* Ticket History Display */}
      {ticketHistory && (
        <div style={{ marginBottom: '2rem' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Current Status</h3>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                color: getStatusColor(ticketHistory.currentStatus)
              }}>
                {ticketHistory.currentStatus}
              </div>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Risk Level</h3>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                color: getRiskColor(ticketHistory.riskAssessment)
              }}>
                {ticketHistory.riskAssessment}
              </div>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Current Price</h3>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                ${ticketHistory.priceAnalysis.currentPrice}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {ticketHistory.priceAnalysis.totalMarkup > 0 ? '+' : ''}{ticketHistory.priceAnalysis.totalMarkup}% markup
              </div>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Transfers</h3>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {ticketHistory.ownershipHistory.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {ticketHistory.complianceStatus.complianceRate.toFixed(1)}% compliant
              </div>
            </div>
          </div>

          {/* Event Information */}
          <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <h3>Event Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Event ID:</strong> {ticketHistory.eventInfo.eventId}
              </div>
              <div>
                <strong>Seat:</strong> {ticketHistory.eventInfo.seatLocation}
              </div>
              <div>
                <strong>Original Price:</strong> ${ticketHistory.eventInfo.originalPrice}
              </div>
              <div>
                <strong>Valid Until:</strong> {new Date(ticketHistory.eventInfo.validUntil).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Transfer Rules */}
          <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <h3>Transfer Rules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Max Resale Markup:</strong> {ticketHistory.transferRules.maxResaleMarkup}%
              </div>
              <div>
                <strong>Authorized Exchanges:</strong> {ticketHistory.transferRules.authorizedExchanges.join(', ')}
              </div>
            </div>
          </div>

          {/* Ownership History */}
          <div style={{ marginBottom: '2rem' }}>
            <h3>Ownership History (Chain of Custody)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Transfer #</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>From</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>To</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Price</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Markup</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Compliance</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Exchange</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e5e7eb' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketHistory.ownershipHistory.map((entry, index) => (
                    <tr key={index}>
                      <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{entry.transferNumber}</td>
                      <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb', fontFamily: 'monospace' }}>
                        {entry.from.slice(0, 6)}...{entry.from.slice(-4)}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb', fontFamily: 'monospace' }}>
                        {entry.to.slice(0, 6)}...{entry.to.slice(-4)}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>${entry.price}</td>
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #e5e7eb',
                        color: entry.markup > 0 ? '#10b981' : entry.markup < 0 ? '#ef4444' : '#6b7280'
                      }}>
                        {entry.markup > 0 ? '+' : ''}{entry.markup}%
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #e5e7eb',
                        color: entry.compliance === 'COMPLIANT' ? '#10b981' : '#ef4444'
                      }}>
                        {entry.compliance}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>{entry.exchange}</td>
                      <td style={{ padding: '0.75rem', border: '1px solid #e5e7eb' }}>
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Tabs */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: activeTab === 'history' ? '#3b82f6' : '#f3f4f6',
                  color: activeTab === 'history' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('verify')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: activeTab === 'verify' ? '#3b82f6' : '#f3f4f6',
                  color: activeTab === 'verify' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Verify
              </button>
              <button
                onClick={() => setActiveTab('escrow')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: activeTab === 'escrow' ? '#3b82f6' : '#f3f4f6',
                  color: activeTab === 'escrow' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Buy with Escrow
              </button>
            </div>

            {/* Verification Tab */}
            {activeTab === 'verify' && (
              <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h3>Pre-Purchase Verification</h3>
                <button
                  onClick={verifyTicket}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    marginBottom: '1rem'
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify Ticket'}
                </button>

                {verificationResult && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: verificationResult.isValid ? '#f0f9ff' : '#fef2f2',
                      border: `1px solid ${verificationResult.isValid ? '#bae6fd' : '#fecaca'}`,
                      borderRadius: '8px'
                    }}>
                      <h4>Verification Result</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <strong>Valid:</strong> {verificationResult.isValid ? '✅ Yes' : '❌ No'}
                        </div>
                        <div>
                          <strong>Risk Level:</strong> 
                          <span style={{ color: getRiskColor(verificationResult.riskLevel), marginLeft: '0.5rem' }}>
                            {verificationResult.riskLevel}
                          </span>
                        </div>
                        <div>
                          <strong>Seller Verified:</strong> {verificationResult.sellerVerified ? '✅ Yes' : '❌ No'}
                        </div>
                        <div>
                          <strong>Price Compliant:</strong> {verificationResult.priceCompliant ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>

                      {verificationResult.warnings.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <h5>⚠️ Warnings:</h5>
                          <ul>
                            {verificationResult.warnings.map((warning, index) => (
                              <li key={index} style={{ color: '#f59e0b' }}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {verificationResult.recommendations.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <h5>💡 Recommendations:</h5>
                          <ul>
                            {verificationResult.recommendations.map((rec, index) => (
                              <li key={index} style={{ color: '#3b82f6' }}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Escrow Tab */}
            {activeTab === 'escrow' && (
              <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <h3>Secure Purchase with Escrow</h3>
                <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                  Create an escrow to securely purchase this ticket. Funds will be held until verification passes.
                </p>
                
                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  <div><strong>Ticket ID:</strong> {ticketHistory.ticketId}</div>
                  <div><strong>Current Owner:</strong> {ticketHistory.currentOwner.slice(0, 6)}...{ticketHistory.currentOwner.slice(-4)}</div>
                  <div><strong>Purchase Price:</strong> ${ticketHistory.priceAnalysis.currentPrice}</div>
                  <div><strong>Escrow Duration:</strong> 24 hours</div>
                </div>

                <button
                  onClick={createEscrow}
                  disabled={loading || ticketHistory.currentStatus !== 'VALID'}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: ticketHistory.currentStatus === 'VALID' ? '#10b981' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    cursor: ticketHistory.currentStatus === 'VALID' ? 'pointer' : 'not-allowed',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Creating Escrow...' : 'Create Escrow'}
                </button>

                {ticketHistory.currentStatus !== 'VALID' && (
                  <p style={{ marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
                    Cannot create escrow for {ticketHistory.currentStatus} ticket
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Report Footer */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <p><strong>Report Generated:</strong> {new Date(ticketHistory.generatedAt).toLocaleString()}</p>
            <p><strong>Data Source:</strong> Canon Ticket Verification System</p>
            <p><strong>Disclaimer:</strong> This report is generated from blockchain data and may not reflect real-time status. Always verify with the venue before purchasing.</p>
          </div>
        </div>
      )}
    </div>
  );
}
