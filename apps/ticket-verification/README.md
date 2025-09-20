# Canon Ticket Verification Flow ("Carfax for Tickets")

A complete ticket verification and escrow system that provides transparency, trust, and consumer protection in the ticket resale market.

## 🎫 Overview

The Canon Ticket Verification Flow creates a "Carfax for Tickets" experience where buyers can see the complete history of any ticket before purchasing, including:

- **Complete ownership history** (who owned it, when)
- **Price history** (original price, all resale prices)
- **Transfer compliance** (did resales follow venue rules?)
- **Validity status** (is the ticket still valid or revoked?)
- **Built-in escrow** (secure purchase with automatic verification)

## 🔄 Ticket Lifecycle Flow

### 1. Ticket Issuance
```
Venue → Canon Inscription → Ticket Asset
├── Event ID
├── Seat/location details
├── Issuer signature
├── Original sale price
└── Transferability rules
```

### 2. Ticket Lifecycle Log (Canon Chain of Custody)
```
Entry 1: Original sale → wallet X
Entry 2: Transfer to wallet Y (with price)
Entry 3: Ticket scanned at venue (optional)
Entry 4: Revocation (if fraudulent)
```

### 3. Buyer Verification Before Purchase
```
Buyer Input → Canon Query → Verification Report
├── Current owner
├── Valid/invalid status
├── Original issue price
├── Resale history
└── Compliance with venue rules
```

### 4. Built-in Escrow
```
Buyer Funds → Escrow Contract → Verification → Transfer → Release
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Buyer App      │    │ Verification API │    │ Canon Verifier  │
│  (React/RN)     │───▶│  (Fastify)      │───▶│  (Ethereum)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Escrow Manager  │    │ Ticket Indexer  │
                       │   (Smart        │    │  (PostgreSQL)   │
                       │    Contract)    │    └─────────────────┘
                       └─────────────────┘
```

## 🚀 Key Features

### Complete Ticket History
- **Ownership chain**: See every owner from issuance to current
- **Price history**: Track all sale prices and markup percentages
- **Transfer compliance**: Verify resales followed venue rules
- **Validity status**: Real-time status (valid, revoked, used)

### Buyer Protection
- **Pre-purchase verification**: Check ticket status before buying
- **Escrow protection**: Funds held until verification passes
- **Automatic refunds**: Money back if verification fails
- **Fraud detection**: Identify blacklisted sellers and revoked tickets

### Venue Control
- **Transferability rules**: Set markup caps and authorized exchanges
- **Revocation power**: Revoke fraudulent or problematic tickets
- **Compliance tracking**: Monitor resale compliance
- **Revenue protection**: Prevent unauthorized resales

### Transparency
- **Public history**: All transfers visible on blockchain
- **Price transparency**: No hidden fees or surprise markups
- **Compliance visibility**: Clear indication of rule violations
- **Trust indicators**: Verified sellers and compliant transfers

## 📋 API Endpoints

### Ticket Verification
- `GET /tickets/{ticketId}/history` - Complete ticket history
- `GET /tickets/{ticketId}/status` - Current ticket status
- `POST /tickets/{ticketId}/verify` - Verify ticket before purchase
- `GET /tickets/{ticketId}/compliance` - Check transfer compliance

### Escrow Management
- `POST /escrow/create` - Create escrow for ticket purchase
- `POST /escrow/{escrowId}/fund` - Fund escrow with payment
- `POST /escrow/{escrowId}/verify` - Verify ticket and release funds
- `POST /escrow/{escrowId}/cancel` - Cancel escrow and refund

### Venue Management
- `POST /venues/{venueId}/rules` - Set transferability rules
- `POST /venues/{venueId}/revoke` - Revoke problematic tickets
- `GET /venues/{venueId}/compliance` - Check venue compliance

## 🔒 Security Features

### Smart Contract Security
- **Escrow protection**: Funds locked until verification
- **Automatic verification**: Smart contract validates transfers
- **Fraud prevention**: Blacklist known bad actors
- **Revocation system**: Venues can revoke problematic tickets

### Data Integrity
- **Immutable history**: All transfers recorded on blockchain
- **Cryptographic proofs**: Verify ticket authenticity
- **Signature validation**: Confirm legitimate transfers
- **Audit trails**: Complete history for dispute resolution

## 🎯 Use Cases

### For Buyers
- **Safe purchasing**: Verify tickets before buying
- **Price transparency**: See complete price history
- **Fraud protection**: Avoid revoked or fake tickets
- **Compliance checking**: Ensure transfers followed rules

### For Sellers
- **Legitimate sales**: Prove ticket authenticity
- **Compliance verification**: Show rule adherence
- **Escrow protection**: Secure payment processing
- **Reputation building**: Build trust through compliance

### For Venues
- **Rule enforcement**: Monitor and enforce transfer rules
- **Fraud prevention**: Revoke problematic tickets
- **Revenue protection**: Prevent unauthorized resales
- **Compliance tracking**: Monitor resale compliance

### For Marketplaces
- **Trust building**: Provide verification services
- **Fraud reduction**: Reduce chargebacks and disputes
- **Compliance monitoring**: Track rule adherence
- **Revenue sharing**: Earn fees from verified transactions

## 🛠️ Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Foundry (for smart contracts)
- PostgreSQL 16+

### Local Development
```bash
# Start all services
docker-compose up -d

# Run tests
npm test

# Start development server
npm run dev
```

## 📊 Monitoring

### Key Metrics
- **Verification success rate**: Percentage of successful verifications
- **Escrow completion rate**: Percentage of completed escrows
- **Fraud detection rate**: Percentage of fraudulent tickets caught
- **Compliance rate**: Percentage of compliant transfers

### Alerting
- **High fraud rate**: Alert on unusual fraud patterns
- **Escrow failures**: Alert on escrow verification failures
- **Compliance violations**: Alert on rule violations
- **System errors**: Alert on technical issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🎟️ Consumer Protection

- **[Canon Ticket Consumer Bill of Rights](../../docs/canon-ticket-consumer-bill-of-rights.md)** - Your rights as a ticket buyer
- **[Canon Code of Conduct for Sellers & Venues](../../docs/canon-code-of-conduct-sellers-venues.md)** - Seller and venue commitments
- **[Canon Ticketing Addendum: Escrow & Consumer Protection](../../docs/canon-ticketing-addendum-escrow-consumer-protection.md)** - Technical implementation details
- **Built-in Escrow Protection** - Funds held until verification passes
- **Automatic Refunds** - Money back if verification fails
- **Fraud Protection** - Protection against counterfeits and scams

## 🆘 Support

- **Documentation**: [docs.nullprotocol.org/tickets](https://docs.nullprotocol.org/tickets)
- **Issues**: [GitHub Issues](https://github.com/your-org/null-protocol/issues)
- **Support**: tickets@nullprotocol.org
