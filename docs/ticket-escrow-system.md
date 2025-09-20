# Ticket Escrow System

The Ticket Escrow System is a comprehensive smart contract solution that handles secure escrow for both primary and secondary ticket sales, integrating with the Canon registry, Null Warrant system, and Consumer Protection Pool.

## Overview

The Ticket Escrow System provides:
- **Secure Escrow**: Funds held until Canon inscription is confirmed
- **Automatic Fee Distribution**: Foundation fees and Consumer Protection Pool funding
- **Fraud Protection**: Integration with Null Warrant system for revocation
- **Consumer Protection**: Automatic refunds from Consumer Protection Pool
- **Transparent Settlement**: All transactions recorded on-chain

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TicketEscrow  │    │  CanonRegistry  │    │  NullWarrant    │
│   (Main)        │───▶│  (Verification) │    │  (Revocation)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ConsumerProtection│    │   Foundation    │    │   Sellers/      │
│     Pool        │    │   Treasury      │    │   Buyers        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Order Structure

```solidity
struct Order {
    bytes32 saleId;        // Deterministic sale identifier
    bytes32 ticketCommit;  // Commitment to ticket ID
    address payable seller; // Venue or rightful owner
    address payable buyer;  // Buyer address
    uint96  price;         // Price in wei (up to ~79 ETH)
    uint32  expiry;        // Unix timestamp expiry
    uint32  maxPctCap;     // Price cap (e.g., 11000 = 110%)
}
```

## Key Features

### 1. Secure Escrow Flow

#### Primary Sale Flow
1. **Order Creation**: Venue creates order with ticket details
2. **Buyer Funding**: Buyer sends funds to escrow
3. **Canon Inscription**: Relayer inscribes ticket to Canon
4. **Settlement**: Funds distributed after confirmation
5. **Fee Distribution**: Foundation and protection pool fees

#### Secondary Sale Flow
1. **Order Creation**: Seller creates resale order
2. **Buyer Funding**: Buyer funds escrow
3. **Verification**: System verifies seller ownership
4. **Canon Update**: Transfer inscribed to Canon
5. **Settlement**: Funds distributed with fees

### 2. Fee Structure

```solidity
// Default fee structure (configurable)
uint16 obolBps = 769;        // 7.69% to foundation
uint16 protectBps = 50;      // 0.50% to Consumer Protection Pool
// Net to seller: 91.81%
```

### 3. Consumer Protection

#### Automatic Refunds
- **Fraud Detection**: Revoked tickets trigger automatic refunds
- **Consumer Protection Pool**: Funded by transaction fees
- **No Manual Intervention**: Smart contract automation

#### Revocation System
- **Null Warrant**: Venues can revoke fraudulent tickets
- **Immediate Effect**: Revoked tickets cannot be settled
- **Audit Trail**: All revocations recorded on-chain

## Contract Interface

### Core Functions

```solidity
// Buyer functions
function fund(Order calldata o) external payable nonReentrant
function cancel(Order calldata o) external nonReentrant

// Confirmer functions (relayers, venues)
function confirmAndSettle(Order calldata o, string calldata canonUri) external nonReentrant
function refundFromPool(Order calldata o, string calldata reason) external nonReentrant

// Admin functions
function setConfirmer(address who, bool allowed) external onlyOwner
function setFees(uint16 _obolBps, uint16 _protectBps, address payable _foundation) external onlyOwner

// Utility functions
function computeSaleId(Order calldata o) external pure returns (bytes32)
```

### Events

```solidity
event Funded(bytes32 indexed saleId, address indexed buyer, uint256 amount);
event Settled(bytes32 indexed saleId, address indexed seller, uint256 netProceeds, string canonUri);
event Refunded(bytes32 indexed saleId, address indexed buyer, uint256 amount, string reason);
event Cancelled(bytes32 indexed saleId, address indexed buyer);
event ConfirmerSet(address indexed who, bool allowed);
event FeesUpdated(uint16 obolBps, uint16 protectBps, address foundation);
```

## Usage Examples

### Creating and Funding an Order

```solidity
// Create order
TicketEscrow.Order memory order = TicketEscrow.Order({
    saleId: keccak256(abi.encode(ticketCommit, seller, buyer, price, expiry, maxCap)),
    ticketCommit: ticketCommit,
    seller: payable(seller),
    buyer: payable(buyer),
    price: 1 ether,
    expiry: uint32(block.timestamp + 3600),
    maxPctCap: 11000 // 110%
});

// Buyer funds escrow
vm.prank(buyer);
escrow.fund{value: order.price}(order);
```

### Confirming and Settling

```solidity
// Relayer confirms Canon inscription and settles
vm.prank(confirmer);
escrow.confirmAndSettle(order, "ipfs://evidence-hash");
```

### Handling Fraud Cases

```solidity
// Issue warrant for fraudulent ticket
warrant.issueWarrant(ticketCommit, "fraudulent_sale");

// Refund buyer from protection pool
vm.prank(confirmer);
escrow.refundFromPool(order, "fraud");
```

## Security Features

### Access Control
- **Owner**: Can set confirmers and adjust fees
- **Confirmers**: Can settle orders and process refunds
- **Buyers**: Can fund and cancel their own orders

### Reentrancy Protection
- **ReentrancyGuard**: All external calls protected
- **State Changes First**: State updated before external calls
- **Safe External Calls**: Proper error handling

### Fraud Prevention
- **Null Warrant Integration**: Immediate revocation capability
- **Consumer Protection Pool**: Automatic refund system
- **Deterministic Sale IDs**: Prevent order manipulation

## Integration Points

### With Canon Registry
```solidity
// Check if ticket is anchored
bool isAnchored = canon.isAnchored(ticketCommit);

// Get ticket information
(bytes32 eventCommit, bytes32 holderCommit, bytes32 policyCommit, uint8 assurance, string memory uri) = 
    canon.getTicket(ticketCommit);
```

### With Null Warrant System
```solidity
// Check if ticket is revoked
bool isRevoked = warrant.isRevoked(ticketCommit);

// Issue warrant for fraud
bytes32 warrantId = warrant.issueWarrant(ticketCommit, "fraud");
```

### With Consumer Protection Pool
```solidity
// Process refund from pool
cpp.refundBuyer(saleId, buyer, amount, "fraud");
```

## Economic Model

### Fee Distribution
- **Foundation Fee**: 7.69% (configurable)
- **Protection Pool**: 0.50% (configurable)
- **Seller Net**: 91.81% (remaining after fees)

### Consumer Protection
- **Pool Funding**: Automatic from transaction fees
- **Refund Guarantee**: Full refund for fraud cases
- **No Opt-in Required**: Protection built into every transaction

### Sustainability
- **Self-Funding**: Fees fund the protection system
- **Scalable**: Fee structure can be adjusted
- **Transparent**: All fees and distributions on-chain

## Deployment

### Prerequisites
- Solidity ^0.8.24
- OpenZeppelin contracts
- Canon Registry deployed
- Consumer Protection Pool deployed
- Null Warrant system deployed

### Deployment Script
```bash
# Deploy complete system
forge script script/DeployTicketEscrow.s.sol --rpc-url $RPC_URL --broadcast

# Set environment variables
export PRIVATE_KEY="your-private-key"
export CANON_REGISTRY="0x..."
export CONSUMER_POOL="0x..."
export FOUNDATION_TREASURY="0x..."
export INITIAL_CONFIRMERS="0x123...,0x456..."
```

### Post-Deployment Setup
1. Set initial confirmers (relayers, venues)
2. Configure fee structure
3. Set up monitoring and alerting
4. Test integration with Canon system

## Testing

### Unit Tests
```bash
# Run all tests
forge test --match-contract TicketEscrowTest

# Run specific test
forge test --match-test testCompleteFlow

# Run with gas reporting
forge test --gas-report
```

### Test Coverage
- Order creation and funding
- Settlement and fee distribution
- Cancellation and refunds
- Fraud detection and protection
- Access control and security
- Integration with other contracts

## Monitoring & Analytics

### Key Metrics
- **Escrow Volume**: Total value in escrow
- **Settlement Rate**: Percentage of successful settlements
- **Refund Rate**: Percentage of refunds processed
- **Fee Collection**: Foundation and protection pool fees

### Alerting
- **High Refund Rate**: Unusual refund patterns
- **Failed Settlements**: Settlement failures
- **Low Pool Balance**: Consumer Protection Pool depletion
- **Unauthorized Access**: Access control violations

## Best Practices

### Order Management
```solidity
// Use deterministic sale IDs
bytes32 saleId = keccak256(abi.encode(
    ticketCommit, seller, buyer, price, expiry, maxCap
));

// Set appropriate expiry times
uint32 expiry = uint32(block.timestamp + 3600); // 1 hour
```

### Security Considerations
- Use multisig wallets for confirmers
- Regularly audit confirmer permissions
- Monitor for unusual settlement patterns
- Implement time-locked fee changes

### Integration Guidelines
- Verify Canon inscription before settlement
- Check Null Warrant status before processing
- Ensure Consumer Protection Pool is funded
- Maintain proper access controls

## Emergency Procedures

### System Pause
- Owner can revoke confirmer permissions
- Emergency settlement procedures
- Fund recovery mechanisms

### Fraud Response
1. Issue Null Warrant for fraudulent ticket
2. Process automatic refund from protection pool
3. Blacklist bad actors off-chain
4. Update monitoring systems

### Recovery Procedures
- Owner can sweep funds in emergency
- Deploy new contracts if needed
- Transfer permissions and configurations
- Update integration contracts

---

*The Ticket Escrow System provides a secure, transparent, and consumer-friendly platform for ticket sales while maintaining venue control and preventing fraud through smart contract automation.*
