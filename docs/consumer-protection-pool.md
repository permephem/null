# Consumer Protection Pool

The Consumer Protection Pool is a smart contract that provides automatic refunds to buyers who are harmed by fraud, revocation, or other issues in the Canon ticketing system.

## Overview

The Consumer Protection Pool serves as an insurance mechanism for ticket buyers, ensuring they never lose money due to:
- Ticket revocations
- Fraudulent sales
- Invalid transfers
- System failures

## Key Features

### Automatic Refunds
- Trusted resolvers can process refunds for verified fraud cases
- Prevents double-refunding through sale ID tracking
- Reentrancy protection for secure fund transfers

### Pool Funding
- Funded by small fees collected during ticket sales/transfers
- Accepts direct donations via `receive()` function
- Owner can sweep surplus funds for rebalancing

### Access Control
- Owner can set/revoke resolver permissions
- Only authorized resolvers can process refunds
- Owner retains emergency fund management capabilities

## Contract Interface

### Core Functions

```solidity
// Set or revoke resolver permissions
function setResolver(address who, bool allowed) external onlyOwner

// Process refund for fraud/revocation case
function refundBuyer(
    bytes32 saleId,
    address payable to,
    uint256 amount,
    string calldata reason
) external nonReentrant

// Owner can withdraw surplus funds
function sweep(address payable to, uint256 amount) external onlyOwner
```

### Events

```solidity
event ToppedUp(address indexed from, uint256 amount);
event Refunded(bytes32 indexed saleId, address indexed to, uint256 amount, string reason);
event ResolverSet(address indexed resolver, bool allowed);
```

## Usage Examples

### Setting Up Resolvers

```solidity
// Set a trusted relayer as resolver
consumerPool.setResolver(relayerAddress, true);

// Set a venue operations multisig as resolver
consumerPool.setResolver(venueMultisig, true);

// Revoke resolver permissions
consumerPool.setResolver(oldResolver, false);
```

### Processing Refunds

```solidity
// Generate deterministic sale ID
bytes32 saleId = keccak256(abi.encodePacked(
    ticketId,
    buyerAddress,
    salePrice,
    block.timestamp
));

// Process refund for revoked ticket
consumerPool.refundBuyer(
    saleId,
    payable(buyerAddress),
    refundAmount,
    "revoked"
);
```

### Funding the Pool

```solidity
// Direct funding
(bool success,) = address(consumerPool).call{value: fundingAmount}("");
require(success, "Funding failed");

// Owner can sweep surplus funds
consumerPool.sweep(payable(owner), surplusAmount);
```

## Security Considerations

### Access Control
- Only owner can set resolvers
- Only resolvers can process refunds
- Owner can sweep funds for emergency management

### Reentrancy Protection
- All external calls protected by ReentrancyGuard
- State changes before external calls
- Prevents reentrancy attacks

### Double-Refund Prevention
- Sale ID tracking prevents duplicate refunds
- Immutable refund state once processed
- Deterministic sale ID generation recommended

## Integration with Canon System

### Fee Collection
```solidity
// Example: Collect 0.5% fee for pool funding
uint256 poolFee = (salePrice * 50) / 10000; // 0.5%
(bool success,) = address(consumerPool).call{value: poolFee}("");
```

### Refund Triggers
- Ticket revocation via Null Warrant
- Fraud detection by monitoring systems
- Invalid transfer detection
- System failure recovery

### Resolver Management
- Relayers can be set as resolvers for automated refunds
- Venue multisigs can be resolvers for manual review
- Emergency resolvers for system recovery

## Economic Model

### Funding Sources
- **Transaction Fees**: 0.5% of ticket sales/transfers
- **Direct Donations**: Voluntary contributions
- **Surplus Management**: Owner can rebalance funds

### Refund Processing
- **Automatic**: Trusted resolvers process verified cases
- **Manual**: Owner can process emergency refunds
- **Audit Trail**: All refunds logged with reasons

### Pool Health Monitoring
- **Balance Tracking**: Monitor pool balance levels
- **Refund Rate**: Track refund frequency and amounts
- **Fee Collection**: Monitor funding rate vs. refund rate

## Deployment

### Prerequisites
- Solidity ^0.8.24
- OpenZeppelin contracts (ReentrancyGuard, Ownable)
- Foundry for testing and deployment

### Deployment Script
```bash
# Deploy with initial funding
forge script script/DeployConsumerProtectionPool.s.sol --rpc-url $RPC_URL --broadcast

# Set environment variables
export PRIVATE_KEY="your-private-key"
export INITIAL_RESOLVERS="0x123...,0x456..." # comma-separated
export FUND_AMOUNT="1000000000000000000" # 1 ETH in wei
```

### Post-Deployment Setup
1. Set initial resolvers (relayers, venue multisigs)
2. Fund the pool with initial capital
3. Configure fee collection in ticket contracts
4. Set up monitoring and alerting

## Testing

### Unit Tests
```bash
# Run all tests
forge test --match-contract ConsumerProtectionPoolTest

# Run specific test
forge test --match-test testRefundBuyer

# Run with gas reporting
forge test --gas-report
```

### Test Coverage
- Initial state verification
- Access control testing
- Refund processing
- Double-refund prevention
- Reentrancy protection
- Edge cases and error conditions

## Monitoring & Analytics

### Key Metrics
- **Pool Balance**: Current available funds
- **Refund Rate**: Refunds per time period
- **Average Refund**: Typical refund amount
- **Resolver Activity**: Refund processing frequency

### Alerting
- **Low Balance**: Pool balance below threshold
- **High Refund Rate**: Unusual refund patterns
- **Failed Refunds**: Refund processing failures
- **Unauthorized Access**: Access control violations

## Best Practices

### Sale ID Generation
```solidity
// Use deterministic, unique sale IDs
bytes32 saleId = keccak256(abi.encodePacked(
    ticketId,
    buyerAddress,
    sellerAddress,
    salePrice,
    block.timestamp
));
```

### Resolver Management
- Use multisig wallets for resolver addresses
- Regularly audit resolver permissions
- Implement time-locked resolver changes
- Monitor resolver activity

### Fund Management
- Maintain minimum pool balance
- Monitor funding vs. refund rates
- Implement emergency funding procedures
- Regular pool health assessments

## Emergency Procedures

### Pool Depletion
1. Pause new refunds if balance too low
2. Request emergency funding from owner
3. Prioritize refunds by severity
4. Communicate with affected users

### Resolver Compromise
1. Immediately revoke compromised resolver
2. Audit recent refunds for suspicious activity
3. Implement additional verification
4. Update resolver permissions

### System Recovery
1. Owner can sweep funds for migration
2. Deploy new pool contract if needed
3. Transfer resolver permissions
4. Update integration contracts

---

*The Consumer Protection Pool is a critical component of the Canon ticketing system, ensuring buyers are protected while maintaining system integrity through proper access controls and security measures.*
