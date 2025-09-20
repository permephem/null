# Canon Ticketing System Developer Guide

## 🛠️ Overview

This guide provides comprehensive technical documentation for developers integrating with the Canon Ticketing System. It covers API integration, smart contract interaction, security considerations, and best practices.

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend Apps  │    │ Verification API │    │ Smart Contracts │
│  (React/RN)     │───▶│  (Fastify)      │───▶│  (Solidity)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ PostgreSQL DB   │    │ Canon Registry  │
                       │ (Event Store)   │    │ (Ethereum)      │
                       └─────────────────┘    └─────────────────┘
```

### Key Contracts

- **CanonTicketVerification**: Main ticket management contract
- **TicketEscrow**: Escrow functionality for secure transactions
- **NullWarrant**: Ticket revocation system
- **ConsumerProtectionPool**: Consumer protection and refunds

## 🔌 API Integration

### Authentication

```javascript
// API Key authentication for venue operations
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': 'your-venue-api-key'
};

// JWT authentication for user operations
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer your-jwt-token'
};
```

### Base Configuration

```javascript
const API_BASE_URL = 'https://verification.null.xyz';
const CONTRACT_ADDRESS = '0xYourCanonTicketVerificationContract';
const ESCROW_ADDRESS = '0xYourTicketEscrowContract';
```

## 📋 Core API Endpoints

### Ticket Verification

#### Get Ticket History
```javascript
async function getTicketHistory(ticketId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/history`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Usage
const history = await getTicketHistory('123');
console.log('Ticket history:', history);
```

#### Get Ticket Status
```javascript
async function getTicketStatus(ticketId) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`);
  return await response.json();
}

// Usage
const status = await getTicketStatus('123');
if (status.status === 'VALID') {
  console.log('Ticket is valid for purchase');
}
```

#### Verify Ticket Before Purchase
```javascript
async function verifyTicket(ticketId, buyerAddress, sellerAddress) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticketId,
      buyerAddress,
      sellerAddress
    })
  });
  
  return await response.json();
}

// Usage
const verification = await verifyTicket('123', '0xBuyer', '0xSeller');
if (verification.isValid && verification.riskLevel === 'LOW') {
  console.log('Safe to proceed with purchase');
}
```

### Escrow Management

#### Create Escrow
```javascript
async function createEscrow(ticketId, sellerAddress, amount, expiresAt) {
  const response = await fetch(`${API_BASE_URL}/escrow/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticketId,
      sellerAddress,
      amount,
      expiresAt
    })
  });
  
  return await response.json();
}

// Usage
const escrow = await createEscrow(
  '123',
  '0xSeller',
  '165000000000000000000', // 165 ETH in wei
  Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
);
```

#### Complete Escrow
```javascript
async function completeEscrow(escrowId, verificationUri) {
  const response = await fetch(`${API_BASE_URL}/escrow/${escrowId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      escrowId,
      verificationUri
    })
  });
  
  return await response.json();
}
```

#### Cancel Escrow
```javascript
async function cancelEscrow(escrowId) {
  const response = await fetch(`${API_BASE_URL}/escrow/${escrowId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  return await response.json();
}
```

### Venue Management

#### Revoke Ticket
```javascript
async function revokeTicket(ticketId, reason, apiKey) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      ticketId,
      reason
    })
  });
  
  return await response.json();
}

// Usage
await revokeTicket('123', 'Fraudulent activity detected', 'venue-api-key');
```

#### Mark Ticket as Used
```javascript
async function markTicketAsUsed(ticketId, apiKey) {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/scan`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey }
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
const ticketContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CanonTicketVerificationABI,
  wallet
);

const escrowContract = new ethers.Contract(
  ESCROW_ADDRESS,
  TicketEscrowABI,
  wallet
);
```

### Ticket Operations

#### Issue Ticket
```javascript
async function issueTicket(eventId, seatLocation, originalPrice, maxMarkup) {
  const tx = await ticketContract.issueTicket(
    eventId,
    seatLocation,
    ethers.utils.parseEther(originalPrice.toString()),
    maxMarkup, // e.g., 110 for 10% markup
    { gasLimit: 500000 }
  );
  
  const receipt = await tx.wait();
  return receipt;
}
```

#### Transfer Ticket
```javascript
async function transferTicket(ticketId, toAddress) {
  const tx = await ticketContract.transferFrom(
    wallet.address,
    toAddress,
    ticketId,
    { gasLimit: 200000 }
  );
  
  const receipt = await tx.wait();
  return receipt;
}
```

#### Set Transfer Rules
```javascript
async function setTransferRules(eventId, maxMarkup, authorizedExchanges) {
  const tx = await ticketContract.setTransferRules(
    eventId,
    maxMarkup,
    authorizedExchanges,
    { gasLimit: 300000 }
  );
  
  const receipt = await tx.wait();
  return receipt;
}
```

### Escrow Operations

#### Fund Escrow
```javascript
async function fundEscrow(order, amount) {
  const tx = await escrowContract.fund(order, {
    value: amount,
    gasLimit: 300000
  });
  
  const receipt = await tx.wait();
  return receipt;
}
```

#### Confirm and Settle
```javascript
async function confirmAndSettle(order, canonUri) {
  const tx = await escrowContract.confirmAndSettle(
    order,
    canonUri,
    { gasLimit: 400000 }
  );
  
  const receipt = await tx.wait();
  return receipt;
}
```

## 🎨 Frontend Integration

### React Components

#### Ticket Verification Widget
```jsx
import React, { useState, useEffect } from 'react';

function TicketVerificationWidget({ ticketId }) {
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTicketData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/tickets/${ticketId}/history`);
        const data = await response.json();
        setTicketData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTicketData();
  }, [ticketId]);

  if (loading) return <div>Loading ticket information...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!ticketData) return <div>Ticket not found</div>;

  return (
    <div className="ticket-verification">
      <h3>Ticket Verification Report</h3>
      
      <div className="status-section">
        <h4>Current Status</h4>
        <span className={`status ${ticketData.currentStatus.toLowerCase()}`}>
          {ticketData.currentStatus}
        </span>
      </div>

      <div className="event-info">
        <h4>Event Information</h4>
        <p><strong>Event:</strong> {ticketData.eventInfo.eventId}</p>
        <p><strong>Seat:</strong> {ticketData.eventInfo.seatLocation}</p>
        <p><strong>Original Price:</strong> ${ticketData.eventInfo.originalPrice}</p>
      </div>

      <div className="ownership-history">
        <h4>Ownership History</h4>
        {ticketData.ownershipHistory.map((transfer, index) => (
          <div key={index} className="transfer-entry">
            <p>Transfer #{transfer.transferNumber}</p>
            <p>From: {transfer.from}</p>
            <p>To: {transfer.to}</p>
            <p>Price: ${transfer.price}</p>
            <p>Compliance: {transfer.compliance}</p>
          </div>
        ))}
      </div>

      <div className="risk-assessment">
        <h4>Risk Assessment</h4>
        <span className={`risk ${ticketData.riskAssessment.toLowerCase()}`}>
          {ticketData.riskAssessment}
        </span>
      </div>
    </div>
  );
}

export default TicketVerificationWidget;
```

#### Escrow Creation Component
```jsx
import React, { useState } from 'react';

function EscrowCreationForm({ ticketId, sellerAddress, onEscrowCreated }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const escrow = await createEscrow(
        ticketId,
        sellerAddress,
        ethers.utils.parseEther(amount).toString(),
        Math.floor(Date.now() / 1000) + 86400
      );
      
      onEscrowCreated(escrow);
    } catch (error) {
      console.error('Failed to create escrow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="escrow-form">
      <h3>Create Secure Escrow</h3>
      
      <div className="form-group">
        <label htmlFor="amount">Amount (ETH)</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.001"
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating Escrow...' : 'Create Escrow'}
      </button>
    </form>
  );
}

export default EscrowCreationForm;
```

### Mobile Integration (React Native)

```javascript
import { Alert } from 'react-native';

class TicketVerificationService {
  static async verifyTicket(ticketId) {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`);
      const ticket = await response.json();
      
      if (ticket.status === 'VALID') {
        return { isValid: true, ticket };
      } else {
        Alert.alert('Invalid Ticket', `Ticket status: ${ticket.status}`);
        return { isValid: false, reason: ticket.status };
      }
    } catch (error) {
      Alert.alert('Verification Error', error.message);
      return { isValid: false, error: error.message };
    }
  }

  static async createEscrow(ticketId, sellerAddress, amount) {
    try {
      const response = await fetch(`${API_BASE_URL}/escrow/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          sellerAddress,
          amount,
          expiresAt: Math.floor(Date.now() / 1000) + 86400
        })
      });
      
      return await response.json();
    } catch (error) {
      throw new Error(`Escrow creation failed: ${error.message}`);
    }
  }
}

export default TicketVerificationService;
```

## 🔒 Security Best Practices

### API Security

```javascript
// Rate limiting
const rateLimiter = {
  requests: new Map(),
  
  checkLimit(ip, limit = 100, window = 60000) {
    const now = Date.now();
    const requests = this.requests.get(ip) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      throw new Error('Rate limit exceeded');
    }
    
    validRequests.push(now);
    this.requests.set(ip, validRequests);
  }
};

// Input validation
const validateTicketId = (ticketId) => {
  if (!ticketId || typeof ticketId !== 'string') {
    throw new Error('Invalid ticket ID');
  }
  
  if (!/^[a-zA-Z0-9-_]+$/.test(ticketId)) {
    throw new Error('Ticket ID contains invalid characters');
  }
  
  return true;
};

// API key validation
const validateApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API key required');
  }
  
  if (!/^[a-f0-9]{64}$/.test(apiKey)) {
    throw new Error('Invalid API key format');
  }
  
  return true;
};
```

### Smart Contract Security

```javascript
// Gas estimation
const estimateGas = async (contract, method, params) => {
  try {
    const gasEstimate = await contract.estimateGas[method](...params);
    return gasEstimate.mul(120).div(100); // Add 20% buffer
  } catch (error) {
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
};

// Transaction confirmation
const waitForConfirmation = async (tx, confirmations = 1) => {
  try {
    const receipt = await tx.wait(confirmations);
    return receipt;
  } catch (error) {
    throw new Error(`Transaction failed: ${error.message}`);
  }
};

// Reentrancy protection
const withReentrancyGuard = (fn) => {
  let isExecuting = false;
  
  return async (...args) => {
    if (isExecuting) {
      throw new Error('Reentrancy detected');
    }
    
    isExecuting = true;
    try {
      return await fn(...args);
    } finally {
      isExecuting = false;
    }
  };
};
```

## 📊 Error Handling

### API Error Handling

```javascript
class TicketVerificationError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.name = 'TicketVerificationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const handleApiError = (response) => {
  switch (response.status) {
    case 400:
      throw new TicketVerificationError('Bad Request', 'BAD_REQUEST', 400);
    case 401:
      throw new TicketVerificationError('Unauthorized', 'UNAUTHORIZED', 401);
    case 404:
      throw new TicketVerificationError('Ticket Not Found', 'NOT_FOUND', 404);
    case 429:
      throw new TicketVerificationError('Rate Limit Exceeded', 'RATE_LIMIT', 429);
    case 500:
      throw new TicketVerificationError('Internal Server Error', 'SERVER_ERROR', 500);
    default:
      throw new TicketVerificationError('Unknown Error', 'UNKNOWN', response.status);
  }
};

// Usage
try {
  const response = await fetch(`${API_BASE_URL}/tickets/123/status`);
  if (!response.ok) {
    handleApiError(response);
  }
  const data = await response.json();
} catch (error) {
  if (error instanceof TicketVerificationError) {
    console.error(`API Error [${error.code}]: ${error.message}`);
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
  const tx = await ticketContract.transferFrom(from, to, tokenId);
  await tx.wait();
} catch (error) {
  handleContractError(error);
}
```

## 🧪 Testing

### Unit Tests

```javascript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('TicketVerificationService', () => {
  let service;
  
  beforeEach(() => {
    service = new TicketVerificationService();
  });

  it('should verify valid ticket', async () => {
    const mockResponse = {
      status: 'VALID',
      owner: '0x1234...',
      eventId: 'CONCERT-2024'
    };
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    const result = await service.verifyTicket('123');
    expect(result.isValid).toBe(true);
    expect(result.ticket.status).toBe('VALID');
  });

  it('should handle invalid ticket', async () => {
    const mockResponse = {
      status: 'REVOKED',
      reason: 'Fraudulent activity'
    };
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    const result = await service.verifyTicket('123');
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('REVOKED');
  });
});
```

### Integration Tests

```javascript
describe('Escrow Integration', () => {
  it('should create and complete escrow', async () => {
    // Create escrow
    const escrow = await createEscrow('123', '0xSeller', '1000000000000000000');
    expect(escrow.escrowId).toBeDefined();
    
    // Complete escrow
    const completion = await completeEscrow(escrow.escrowId, 'ipfs://evidence');
    expect(completion.status).toBe('completed');
  });
});
```

## 📈 Performance Optimization

### Caching

```javascript
class TicketCache {
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

const ticketCache = new TicketCache();

// Usage
async function getCachedTicketStatus(ticketId) {
  const cached = ticketCache.get(ticketId);
  if (cached) return cached;
  
  const status = await getTicketStatus(ticketId);
  ticketCache.set(ticketId, status);
  return status;
}
```

### Batch Operations

```javascript
async function batchVerifyTickets(ticketIds) {
  const promises = ticketIds.map(id => getTicketStatus(id));
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => ({
    ticketId: ticketIds[index],
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
export API_BASE_URL=https://verification.null.xyz
export CONTRACT_ADDRESS=0xYourProductionContract
export RPC_URL=https://mainnet.infura.io/v3/your-project-id
export API_KEY_SECRET=your-production-secret

# Staging environment
export NODE_ENV=staging
export API_BASE_URL=https://staging-verification.null.xyz
export CONTRACT_ADDRESS=0xYourStagingContract
export RPC_URL=https://goerli.infura.io/v3/your-project-id
export API_KEY_SECRET=your-staging-secret
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

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
    await ticketContract.totalSupply();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
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
- [Security Guidelines](security-guidelines.md)
- [Testing Guide](testing-guide.md)
- [Deployment Guide](deployment-guide.md)

*This developer guide provides comprehensive technical documentation for integrating with the Canon Ticketing System. For additional support, contact the development team at dev@null.xyz.*
