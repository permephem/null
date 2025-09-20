# Canon Ticketing System Quick Reference

## 🚀 Essential Commands

### Ticket Verification
```bash
# Get ticket history (Carfax-like report)
curl -X GET "https://verification.null.xyz/tickets/123/history"

# Get current status
curl -X GET "https://verification.null.xyz/tickets/123/status"

# Verify before purchase
curl -X POST "https://verification.null.xyz/tickets/123/verify" \
  -H "Content-Type: application/json" \
  -d '{"ticketId":"123","buyerAddress":"0xBuyer","sellerAddress":"0xSeller"}'
```

### Escrow Operations
```bash
# Create escrow
curl -X POST "https://verification.null.xyz/escrow/create" \
  -H "Content-Type: application/json" \
  -d '{"ticketId":"123","sellerAddress":"0xSeller","amount":"165000000000000000000","expiresAt":1705334400}'

# Complete escrow
curl -X POST "https://verification.null.xyz/escrow/456/complete" \
  -H "Content-Type: application/json" \
  -d '{"escrowId":"456","verificationUri":"ipfs://QmX..."}'

# Cancel escrow
curl -X POST "https://verification.null.xyz/escrow/456/cancel"
```

### Venue Operations
```bash
# Revoke ticket (requires API key)
curl -X POST "https://verification.null.xyz/tickets/123/revoke" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-venue-api-key" \
  -d '{"ticketId":"123","reason":"Fraudulent activity"}'

# Mark ticket as used
curl -X POST "https://verification.null.xyz/tickets/123/scan" \
  -H "x-api-key: your-venue-api-key"
```

## 📊 Status Reference

### Ticket Statuses
| Status | Description | Action |
|--------|-------------|---------|
| `VALID` | ✅ Safe to buy | Proceed with purchase |
| `REVOKED` | ❌ Do not buy | Avoid at all costs |
| `USED` | ⚠️ Already used | Cannot be used again |
| `EXPIRED` | ⏰ Past event date | Check event date |
| `FRAUDULENT` | 🚨 Avoid | Report to venue |

### Compliance Statuses
| Status | Description | Impact |
|--------|-------------|---------|
| `COMPLIANT` | ✅ Follows all rules | Safe transaction |
| `MARKUP_VIOLATION` | ⚠️ Price too high | Check markup limits |
| `UNAUTHORIZED_EXCHANGE` | ❌ Wrong platform | Use authorized exchange |
| `BLACKLISTED_SELLER` | 🚨 Bad seller | Avoid seller |
| `RULE_VIOLATION` | ❌ Other violation | Review rules |

### Risk Levels
| Level | Color | Action |
|-------|-------|---------|
| `LOW` | 🟢 | Proceed with confidence |
| `MEDIUM` | 🟡 | Proceed with caution |
| `HIGH` | 🔴 | Avoid purchase |

## 🔧 JavaScript SDK

### Basic Usage
```javascript
import { TicketVerificationAPI } from '@null/ticketing-sdk';

const api = new TicketVerificationAPI({
  baseUrl: 'https://verification.null.xyz',
  apiKey: 'your-api-key' // Optional, for venue operations
});

// Get ticket history
const history = await api.getTicketHistory('123');

// Verify ticket
const verification = await api.verifyTicket('123', '0xBuyer', '0xSeller');

// Create escrow
const escrow = await api.createEscrow({
  ticketId: '123',
  sellerAddress: '0xSeller',
  amount: '165000000000000000000',
  expiresAt: Math.floor(Date.now() / 1000) + 86400
});
```

### React Hook
```javascript
import { useTicketVerification } from '@null/ticketing-sdk/react';

function TicketComponent({ ticketId }) {
  const { data, loading, error } = useTicketVerification(ticketId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h3>Ticket Status: {data.status}</h3>
      <p>Risk Level: {data.riskAssessment}</p>
    </div>
  );
}
```

## 🎯 Common Patterns

### Pre-Purchase Verification Flow
```javascript
async function verifyBeforePurchase(ticketId, buyerAddress, sellerAddress) {
  try {
    // 1. Get ticket history
    const history = await api.getTicketHistory(ticketId);
    
    // 2. Check current status
    if (history.currentStatus !== 'VALID') {
      throw new Error(`Ticket is ${history.currentStatus}`);
    }
    
    // 3. Verify ticket
    const verification = await api.verifyTicket(ticketId, buyerAddress, sellerAddress);
    
    // 4. Check risk level
    if (verification.riskLevel === 'HIGH') {
      throw new Error('High risk ticket - avoid purchase');
    }
    
    // 5. Check compliance
    if (!verification.priceCompliant || !verification.exchangeCompliant) {
      console.warn('Compliance issues detected:', verification.warnings);
    }
    
    return { safe: true, verification, history };
  } catch (error) {
    return { safe: false, error: error.message };
  }
}
```

### Secure Purchase with Escrow
```javascript
async function securePurchase(ticketId, sellerAddress, amount) {
  try {
    // 1. Verify ticket first
    const verification = await verifyBeforePurchase(ticketId, buyerAddress, sellerAddress);
    if (!verification.safe) {
      throw new Error(`Verification failed: ${verification.error}`);
    }
    
    // 2. Create escrow
    const escrow = await api.createEscrow({
      ticketId,
      sellerAddress,
      amount,
      expiresAt: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    });
    
    // 3. Fund escrow (this would be done by the buyer's wallet)
    // await escrowContract.fund(escrow.order, { value: amount });
    
    // 4. Complete escrow after verification
    const completion = await api.completeEscrow(escrow.escrowId, 'ipfs://verification-evidence');
    
    return { success: true, escrow, completion };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Venue Ticket Management
```javascript
async function manageVenueTickets(venueApiKey) {
  const venueApi = new TicketVerificationAPI({
    baseUrl: 'https://verification.null.xyz',
    apiKey: venueApiKey
  });
  
  // Revoke fraudulent ticket
  await venueApi.revokeTicket('123', 'Fraudulent activity detected');
  
  // Mark ticket as used
  await venueApi.markTicketAsUsed('456');
  
  // Get venue compliance stats
  const stats = await venueApi.getVenueCompliance('venue123');
}
```

## 🚨 Error Handling

### Common Error Codes
| Code | Description | Solution |
|------|-------------|----------|
| `400` | Bad Request | Check request format |
| `401` | Unauthorized | Verify API key |
| `404` | Not Found | Check ticket ID |
| `429` | Rate Limited | Wait and retry |
| `500` | Server Error | Contact support |

### Error Handling Pattern
```javascript
async function handleApiCall(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.status === 404) {
      throw new Error('Ticket not found');
    } else if (error.status === 401) {
      throw new Error('Invalid API key');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded - please wait');
    } else {
      throw new Error(`API error: ${error.message}`);
    }
  }
}
```

## 📱 Mobile Integration

### React Native
```javascript
import { TicketVerificationAPI } from '@null/ticketing-sdk/react-native';

const api = new TicketVerificationAPI({
  baseUrl: 'https://verification.null.xyz'
});

// Verify ticket
const verification = await api.verifyTicket('123', '0xBuyer', '0xSeller');

// Create escrow
const escrow = await api.createEscrow({
  ticketId: '123',
  sellerAddress: '0xSeller',
  amount: '165000000000000000000'
});
```

### Flutter
```dart
import 'package:null_ticketing_sdk/null_ticketing_sdk.dart';

final api = TicketVerificationAPI(
  baseUrl: 'https://verification.null.xyz',
);

// Verify ticket
final verification = await api.verifyTicket('123', '0xBuyer', '0xSeller');

// Create escrow
final escrow = await api.createEscrow(
  ticketId: '123',
  sellerAddress: '0xSeller',
  amount: '165000000000000000000',
);
```

## 🔍 Debugging

### Enable Debug Logging
```javascript
import { TicketVerificationAPI } from '@null/ticketing-sdk';

const api = new TicketVerificationAPI({
  baseUrl: 'https://verification.null.xyz',
  debug: true // Enable debug logging
});
```

### Common Issues

#### "Ticket Not Found"
- Verify ticket ID is correct
- Check if ticket exists in system
- Ensure ticket hasn't been deleted

#### "Verification Failed"
- Check ticket status
- Verify seller ownership
- Review compliance issues

#### "Escrow Creation Failed"
- Verify ticket is valid
- Check amount is correct
- Ensure sufficient gas

#### "Revocation Failed"
- Verify venue permissions
- Check ticket status
- Ensure proper API key

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

*This quick reference provides essential commands and patterns for using the Canon Ticketing System. For detailed documentation, see the [User Guide](ticketing-system-user-guide.md) and [Developer Guide](ticketing-system-developer-guide.md).*
