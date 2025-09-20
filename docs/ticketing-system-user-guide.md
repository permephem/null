# Canon Ticketing System User Guide

## 🎫 Overview

The Canon Ticketing System provides a "Carfax for Tickets" experience, offering complete transparency, trust, and consumer protection in the ticket resale market. This guide covers how to use the system for all user types: buyers, sellers, venues, and marketplaces.

## 🚀 Quick Start

### For Buyers
1. **Verify Before You Buy**: Always check ticket history before purchasing
2. **Use Escrow**: Create escrow for secure transactions
3. **Check Compliance**: Ensure transfers followed venue rules

### For Sellers
1. **List Legitimately**: Only sell tickets you legitimately own
2. **Follow Rules**: Respect venue transferability rules
3. **Use Authorized Exchanges**: Sell on approved platforms

### For Venues
1. **Set Rules**: Configure transferability and markup limits
2. **Monitor Compliance**: Track resale compliance
3. **Revoke When Needed**: Remove fraudulent tickets

## 📱 Buyer Guide

### Step 1: Verify a Ticket

Before purchasing any ticket, verify its authenticity and history:

```bash
# Get complete ticket history (Carfax-like report)
curl -X GET "https://verification.null.xyz/tickets/123/history" \
  -H "Content-Type: application/json"
```

**Response includes:**
- Complete ownership history
- Price analysis and markup tracking
- Transfer compliance status
- Risk assessment
- Current validity status

### Step 2: Check Current Status

Get quick status information:

```bash
# Get current ticket status
curl -X GET "https://verification.null.xyz/tickets/123/status" \
  -H "Content-Type: application/json"
```

**Response includes:**
- Current status (VALID, REVOKED, USED, EXPIRED, FRAUDULENT)
- Current owner
- Event information
- Transfer count
- Validity period

### Step 3: Pre-Purchase Verification

Verify ticket before completing purchase:

```bash
# Verify ticket before purchase
curl -X POST "https://verification.null.xyz/tickets/123/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "123",
    "buyerAddress": "0xBuyerAddress123",
    "sellerAddress": "0xSellerAddress456"
  }'
```

**Response includes:**
- Validity confirmation
- Seller verification
- Price compliance check
- Exchange compliance
- Risk level assessment
- Warnings and recommendations

### Step 4: Create Secure Escrow

For maximum protection, use escrow:

```bash
# Create escrow for secure purchase
curl -X POST "https://verification.null.xyz/escrow/create" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "123",
    "sellerAddress": "0xSellerAddress456",
    "amount": "165000000000000000000",
    "expiresAt": 1705334400
  }'
```

**Escrow Benefits:**
- Funds held until verification passes
- Automatic refund if verification fails
- Protection against fraud
- Secure transfer process

### Step 5: Complete Purchase

Once verification passes, complete the escrow:

```bash
# Complete escrow after verification
curl -X POST "https://verification.null.xyz/escrow/456/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "escrowId": "456",
    "verificationUri": "ipfs://QmVerificationEvidence123"
  }'
```

## 🏪 Seller Guide

### Step 1: Verify Your Ticket

Before listing, verify your ticket is legitimate:

```bash
# Check your ticket status
curl -X GET "https://verification.null.xyz/tickets/123/status"
```

### Step 2: Check Transfer Rules

Ensure you can legally resell:

```bash
# Get transfer rules for your ticket
curl -X GET "https://verification.null.xyz/tickets/123/history"
```

**Check for:**
- Maximum markup allowed
- Authorized exchanges
- Transfer restrictions
- Compliance requirements

### Step 3: List on Authorized Exchanges

Only sell on approved platforms:
- StubHub
- Ticketmaster
- Vivid Seats
- Other authorized exchanges

### Step 4: Set Fair Prices

Respect venue markup limits:
- Check original price
- Calculate allowed markup
- Set competitive but compliant price

### Step 5: Use Escrow for Sales

Encourage buyers to use escrow:
- Provides buyer confidence
- Protects both parties
- Ensures secure transactions

## 🏛️ Venue Guide

### Step 1: Configure Transfer Rules

Set up your venue's transferability rules:

```solidity
// Example: Set 10% markup limit
ticketContract.setTransferRules(
    eventId,
    110, // 110% = 10% markup
    ["StubHub", "Ticketmaster", "Vivid Seats"] // Authorized exchanges
);
```

### Step 2: Monitor Compliance

Track resale compliance:

```bash
# Get venue compliance statistics
curl -X GET "https://verification.null.xyz/venues/venue123/compliance" \
  -H "x-api-key: your-venue-api-key"
```

### Step 3: Revoke Problematic Tickets

Revoke tickets for fraud or policy violations:

```bash
# Revoke fraudulent ticket
curl -X POST "https://verification.null.xyz/tickets/123/revoke" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-venue-api-key" \
  -d '{
    "ticketId": "123",
    "reason": "Fraudulent activity detected"
  }'
```

### Step 4: Mark Tickets as Used

When tickets are scanned at venue:

```bash
# Mark ticket as used
curl -X POST "https://verification.null.xyz/tickets/123/scan" \
  -H "x-api-key: your-venue-api-key"
```

## 🛒 Marketplace Integration

### API Integration

Integrate the verification API into your marketplace:

```javascript
// Example: Verify ticket before listing
async function verifyTicketForListing(ticketId) {
  const response = await fetch(`https://verification.null.xyz/tickets/${ticketId}/status`);
  const ticket = await response.json();
  
  if (ticket.status === 'VALID') {
    // Allow listing
    return { canList: true, ticket };
  } else {
    // Block listing
    return { canList: false, reason: ticket.status };
  }
}

// Example: Create escrow for purchase
async function createEscrowForPurchase(ticketId, sellerAddress, amount) {
  const response = await fetch('https://verification.null.xyz/escrow/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticketId,
      sellerAddress,
      amount,
      expiresAt: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    })
  });
  
  return await response.json();
}
```

### Widget Integration

Embed verification widgets in your marketplace:

```html
<!-- Ticket verification widget -->
<div id="ticket-verification-widget" 
     data-ticket-id="123" 
     data-api-endpoint="https://verification.null.xyz">
</div>

<script src="https://verification.null.xyz/widget.js"></script>
```

## 🔒 Security Best Practices

### For Buyers
1. **Always Verify**: Never buy without checking ticket history
2. **Use Escrow**: Always use escrow for high-value tickets
3. **Check Seller**: Verify seller reputation and history
4. **Read Warnings**: Pay attention to risk assessments
5. **Use Authorized Exchanges**: Only buy from approved platforms

### For Sellers
1. **Legitimate Ownership**: Only sell tickets you own
2. **Follow Rules**: Respect venue transferability rules
3. **Fair Pricing**: Don't exceed markup limits
4. **Authorized Platforms**: Only sell on approved exchanges
5. **Transparent History**: Maintain clean transfer history

### For Venues
1. **Set Clear Rules**: Establish clear transferability policies
2. **Monitor Compliance**: Regularly check resale compliance
3. **Quick Response**: Revoke fraudulent tickets promptly
4. **API Security**: Secure your venue API keys
5. **Regular Audits**: Periodically audit ticket status

## 📊 Understanding the Data

### Ticket Statuses
- **VALID**: Ticket is valid and transferable
- **REVOKED**: Ticket has been revoked by venue
- **USED**: Ticket has been used at venue
- **EXPIRED**: Ticket has expired
- **FRAUDULENT**: Ticket marked as fraudulent

### Compliance Statuses
- **COMPLIANT**: Transfer follows all rules
- **MARKUP_VIOLATION**: Resale price exceeds allowed markup
- **UNAUTHORIZED_EXCHANGE**: Sold on unauthorized platform
- **BLACKLISTED_SELLER**: Seller is blacklisted
- **RULE_VIOLATION**: Other rule violation

### Risk Levels
- **LOW**: Safe to purchase
- **MEDIUM**: Proceed with caution
- **HIGH**: High risk, avoid purchase

## 🚨 Troubleshooting

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

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify API key |
| 404 | Not Found | Check ticket ID |
| 500 | Server Error | Contact support |

## 📞 Support

### Getting Help
- **Documentation**: Check this guide and API docs
- **Community**: Join our Discord community
- **Support**: Contact support@null.xyz
- **Status**: Check system status at status.null.xyz

### Reporting Issues
- **Bugs**: Report via GitHub issues
- **Security**: Email security@null.xyz
- **Feature Requests**: Submit via community forum

## 🔄 System Status

### Real-time Monitoring
- **API Status**: https://status.null.xyz
- **Uptime**: 99.9% SLA
- **Response Times**: < 200ms average
- **Availability**: 24/7 monitoring

### Maintenance Windows
- **Scheduled**: First Sunday of each month, 2-4 AM UTC
- **Emergency**: As needed with 1-hour notice
- **Updates**: Deployed continuously with zero downtime

## 📈 Analytics & Reporting

### System Statistics
```bash
# Get system-wide statistics
curl -X GET "https://verification.null.xyz/stats"
```

**Includes:**
- Total tickets issued
- Total transfers
- Total escrows created
- Total revocations
- Compliance rates
- Average response times

### Custom Reports
- **Venue Reports**: Compliance and revenue tracking
- **Marketplace Reports**: Transaction and verification metrics
- **Buyer Reports**: Purchase history and protection claims
- **Seller Reports**: Sales history and compliance status

---

## 🎯 Quick Reference

### Essential Endpoints
- `GET /tickets/{id}/history` - Complete ticket history
- `GET /tickets/{id}/status` - Current ticket status
- `POST /tickets/{id}/verify` - Pre-purchase verification
- `POST /escrow/create` - Create secure escrow
- `POST /escrow/{id}/complete` - Complete escrow

### Key Statuses
- **VALID** ✅ - Safe to buy
- **REVOKED** ❌ - Do not buy
- **USED** ⚠️ - Already used
- **EXPIRED** ⏰ - Past event date
- **FRAUDULENT** 🚨 - Avoid at all costs

### Risk Levels
- **LOW** 🟢 - Proceed with confidence
- **MEDIUM** 🟡 - Proceed with caution
- **HIGH** 🔴 - Avoid purchase

---

*This guide covers the essential usage patterns for the Canon Ticketing System. For advanced features and detailed API documentation, see the [API Reference](api-reference.md) and [Developer Guide](developer-guide.md).*
