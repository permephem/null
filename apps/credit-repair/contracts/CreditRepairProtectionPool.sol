// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreditRepairProtectionPool
 * @dev Protection pool for credit repair consumers with automatic refunds
 * @notice This contract manages subscription refunds and consumer protection for credit repair services
 */
contract CreditRepairProtectionPool is ReentrancyGuard, Ownable {
    
    struct Subscription {
        bytes32 consumerCommit;      // Consumer commitment
        uint256 monthlyFee;          // Monthly subscription fee in wei
        uint256 startDate;           // Subscription start date
        uint256 lastPayment;         // Last payment date
        bool active;                 // Whether subscription is active
        uint256 disputesSubmitted;   // Number of disputes submitted
        uint256 disputesResolved;    // Number of disputes resolved
        uint256 totalPaid;           // Total amount paid by consumer
        uint256 totalRefunded;       // Total amount refunded to consumer
    }
    
    struct RefundRequest {
        bytes32 consumerCommit;      // Consumer commitment
        bytes32 disputeId;           // Dispute identifier
        uint256 refundAmount;        // Amount to refund
        string reason;               // Reason for refund
        uint256 requestedAt;         // Timestamp of refund request
        bool processed;              // Whether refund has been processed
    }
    
    // State variables
    mapping(bytes32 => Subscription) public subscriptions;
    mapping(bytes32 => RefundRequest) public refundRequests;
    mapping(address => bool) public isResolver;      // Authorized resolvers
    mapping(bytes32 => bool) public refundedDisputes; // Prevent double refunds
    
    // Pool management
    uint256 public totalPoolBalance;     // Total pool balance
    uint256 public totalRefundsPaid;     // Total refunds paid out
    uint256 public totalSubscriptions;   // Total active subscriptions
    
    // Events
    event SubscriptionCreated(
        bytes32 indexed consumerCommit,
        uint256 monthlyFee,
        uint256 startDate
    );
    
    event PaymentReceived(
        bytes32 indexed consumerCommit,
        uint256 amount,
        uint256 timestamp
    );
    
    event RefundRequested(
        bytes32 indexed consumerCommit,
        bytes32 indexed disputeId,
        uint256 refundAmount,
        string reason
    );
    
    event RefundProcessed(
        bytes32 indexed consumerCommit,
        bytes32 indexed disputeId,
        uint256 refundAmount,
        string reason
    );
    
    event ResolverSet(address indexed resolver, bool allowed);
    
    event PoolToppedUp(address indexed from, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new subscription
     * @param consumerCommit Consumer commitment
     * @param monthlyFee Monthly subscription fee in wei
     */
    function createSubscription(
        bytes32 consumerCommit,
        uint256 monthlyFee
    ) external onlyOwner {
        require(consumerCommit != bytes32(0), "Invalid consumer commit");
        require(monthlyFee > 0, "Monthly fee must be greater than 0");
        require(!subscriptions[consumerCommit].active, "Subscription already exists");
        
        subscriptions[consumerCommit] = Subscription({
            consumerCommit: consumerCommit,
            monthlyFee: monthlyFee,
            startDate: block.timestamp,
            lastPayment: block.timestamp,
            active: true,
            disputesSubmitted: 0,
            disputesResolved: 0,
            totalPaid: 0,
            totalRefunded: 0
        });
        
        totalSubscriptions++;
        
        emit SubscriptionCreated(consumerCommit, monthlyFee, block.timestamp);
    }
    
    /**
     * @dev Process monthly subscription payment
     * @param consumerCommit Consumer commitment
     */
    function processPayment(bytes32 consumerCommit) external payable nonReentrant {
        Subscription storage sub = subscriptions[consumerCommit];
        require(sub.active, "No active subscription");
        require(msg.value == sub.monthlyFee, "Incorrect payment amount");
        
        // Update subscription
        sub.lastPayment = block.timestamp;
        sub.totalPaid += msg.value;
        
        // Add to pool balance
        totalPoolBalance += msg.value;
        
        emit PaymentReceived(consumerCommit, msg.value, block.timestamp);
    }
    
    /**
     * @dev Submit a dispute (increment counter)
     * @param consumerCommit Consumer commitment
     * @param disputeId Dispute identifier
     */
    function submitDispute(bytes32 consumerCommit, bytes32 disputeId) external {
        require(subscriptions[consumerCommit].active, "No active subscription");
        
        subscriptions[consumerCommit].disputesSubmitted++;
    }
    
    /**
     * @dev Resolve a dispute (increment counter)
     * @param consumerCommit Consumer commitment
     * @param disputeId Dispute identifier
     */
    function resolveDispute(bytes32 consumerCommit, bytes32 disputeId) external {
        require(subscriptions[consumerCommit].active, "No active subscription");
        
        subscriptions[consumerCommit].disputesResolved++;
    }
    
    /**
     * @dev Request a refund for unresolved disputes
     * @param consumerCommit Consumer commitment
     * @param disputeId Dispute identifier
     * @param reason Reason for refund
     */
    function requestRefund(
        bytes32 consumerCommit,
        bytes32 disputeId,
        string calldata reason
    ) external {
        require(subscriptions[consumerCommit].active, "No active subscription");
        require(!refundedDisputes[disputeId], "Dispute already refunded");
        
        Subscription storage sub = subscriptions[consumerCommit];
        
        // Calculate refund amount based on unresolved disputes
        uint256 unresolvedDisputes = sub.disputesSubmitted - sub.disputesResolved;
        require(unresolvedDisputes > 0, "No unresolved disputes");
        
        // Refund amount = monthly fee * number of months with unresolved disputes
        uint256 monthsWithUnresolved = (block.timestamp - sub.startDate) / 30 days;
        uint256 refundAmount = sub.monthlyFee * monthsWithUnresolved;
        
        // Cap refund at total amount paid
        if (refundAmount > sub.totalPaid) {
            refundAmount = sub.totalPaid;
        }
        
        // Create refund request
        RefundRequest memory request = RefundRequest({
            consumerCommit: consumerCommit,
            disputeId: disputeId,
            refundAmount: refundAmount,
            reason: reason,
            requestedAt: block.timestamp,
            processed: false
        });
        
        refundRequests[disputeId] = request;
        
        emit RefundRequested(consumerCommit, disputeId, refundAmount, reason);
    }
    
    /**
     * @dev Process a refund request
     * @param disputeId Dispute identifier
     */
    function processRefund(bytes32 disputeId) external nonReentrant {
        require(isResolver[msg.sender], "Not authorized resolver");
        
        RefundRequest storage request = refundRequests[disputeId];
        require(request.consumerCommit != bytes32(0), "Refund request not found");
        require(!request.processed, "Refund already processed");
        require(!refundedDisputes[disputeId], "Dispute already refunded");
        
        Subscription storage sub = subscriptions[request.consumerCommit];
        require(sub.active, "No active subscription");
        
        // Check if we have sufficient pool balance
        require(totalPoolBalance >= request.refundAmount, "Insufficient pool balance");
        
        // Process refund
        request.processed = true;
        refundedDisputes[disputeId] = true;
        
        // Update subscription
        sub.totalRefunded += request.refundAmount;
        
        // Update pool balance
        totalPoolBalance -= request.refundAmount;
        totalRefundsPaid += request.refundAmount;
        
        // Transfer refund to consumer
        (bool success, ) = payable(address(uint160(uint256(request.consumerCommit)))).call{value: request.refundAmount}("");
        require(success, "Refund transfer failed");
        
        emit RefundProcessed(
            request.consumerCommit,
            disputeId,
            request.refundAmount,
            request.reason
        );
    }
    
    /**
     * @dev Cancel subscription and refund remaining balance
     * @param consumerCommit Consumer commitment
     */
    function cancelSubscription(bytes32 consumerCommit) external nonReentrant {
        Subscription storage sub = subscriptions[consumerCommit];
        require(sub.active, "No active subscription");
        
        // Calculate refund for unused portion of current month
        uint256 timeSinceLastPayment = block.timestamp - sub.lastPayment;
        uint256 daysInMonth = 30 days;
        
        if (timeSinceLastPayment < daysInMonth) {
            uint256 unusedDays = daysInMonth - timeSinceLastPayment;
            uint256 refundAmount = (sub.monthlyFee * unusedDays) / daysInMonth;
            
            if (refundAmount > 0 && totalPoolBalance >= refundAmount) {
                sub.totalRefunded += refundAmount;
                totalPoolBalance -= refundAmount;
                totalRefundsPaid += refundAmount;
                
                (bool success, ) = payable(address(uint160(uint256(consumerCommit)))).call{value: refundAmount}("");
                require(success, "Refund transfer failed");
            }
        }
        
        // Deactivate subscription
        sub.active = false;
        totalSubscriptions--;
    }
    
    /**
     * @dev Set resolver authorization
     * @param resolver Resolver address
     * @param allowed Whether resolver is allowed
     */
    function setResolver(address resolver, bool allowed) external onlyOwner {
        isResolver[resolver] = allowed;
        emit ResolverSet(resolver, allowed);
    }
    
    /**
     * @dev Top up the protection pool
     */
    receive() external payable {
        totalPoolBalance += msg.value;
        emit PoolToppedUp(msg.sender, msg.value);
    }
    
    /**
     * @dev Get subscription information
     * @param consumerCommit Consumer commitment
     * @return subscription Subscription information
     */
    function getSubscription(bytes32 consumerCommit) external view returns (Subscription memory subscription) {
        return subscriptions[consumerCommit];
    }
    
    /**
     * @dev Get refund request information
     * @param disputeId Dispute identifier
     * @return request Refund request information
     */
    function getRefundRequest(bytes32 disputeId) external view returns (RefundRequest memory request) {
        return refundRequests[disputeId];
    }
    
    /**
     * @dev Get pool statistics
     * @return balance Total pool balance
     * @return refundsPaid Total refunds paid
     * @return activeSubscriptions Total active subscriptions
     */
    function getPoolStats() external view returns (uint256 balance, uint256 refundsPaid, uint256 activeSubscriptions) {
        return (totalPoolBalance, totalRefundsPaid, totalSubscriptions);
    }
    
    /**
     * @dev Calculate refund amount for a consumer
     * @param consumerCommit Consumer commitment
     * @return refundAmount Calculated refund amount
     */
    function calculateRefund(bytes32 consumerCommit) external view returns (uint256 refundAmount) {
        Subscription memory sub = subscriptions[consumerCommit];
        if (!sub.active) return 0;
        
        uint256 unresolvedDisputes = sub.disputesSubmitted - sub.disputesResolved;
        if (unresolvedDisputes == 0) return 0;
        
        uint256 monthsWithUnresolved = (block.timestamp - sub.startDate) / 30 days;
        refundAmount = sub.monthlyFee * monthsWithUnresolved;
        
        // Cap refund at total amount paid
        if (refundAmount > sub.totalPaid) {
            refundAmount = sub.totalPaid;
        }
        
        return refundAmount;
    }
}
