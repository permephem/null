// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdentityProtectionPool
 * @dev Protection pool for identity theft protection with resolution guarantees
 * @notice This contract manages protection plans, resolution guarantees, and automatic refunds
 */
contract IdentityProtectionPool is ReentrancyGuard, Ownable {
    
    struct ProtectionPlan {
        bytes32 identityCommit;     // Identity commitment
        uint256 monthlyFee;         // Monthly protection fee in wei
        uint256 protectionLevel;    // Protection level (1-10)
        bool active;                // Whether plan is active
        uint256 startDate;          // Plan start date
        uint256 lastPayment;        // Last payment date
        uint256 fraudCases;         // Number of fraud cases
        uint256 resolvedCases;      // Number of resolved cases
        uint256 totalPaid;          // Total amount paid
        uint256 totalRefunded;      // Total amount refunded
    }
    
    struct ResolutionGuarantee {
        bytes32 caseId;             // Fraud case identifier
        bytes32 identityCommit;     // Identity commitment
        uint256 guaranteeAmount;    // Guarantee amount in wei
        uint256 resolutionDeadline; // Resolution deadline timestamp
        bool resolved;              // Whether case is resolved
        bool refunded;              // Whether guarantee was refunded
        string fraudType;           // Type of fraud
        string description;         // Fraud description
    }
    
    struct FraudCase {
        bytes32 caseId;             // Case identifier
        bytes32 identityCommit;     // Identity commitment
        string fraudType;           // Type of fraud
        string description;         // Fraud description
        uint256 reportedAt;         // Report timestamp
        uint256 resolvedAt;         // Resolution timestamp
        bool resolved;              // Whether case is resolved
        string resolutionEvidence;  // IPFS URI to resolution evidence
    }
    
    // State variables
    mapping(bytes32 => ProtectionPlan) public protectionPlans;
    mapping(bytes32 => ResolutionGuarantee) public resolutionGuarantees;
    mapping(bytes32 => FraudCase) public fraudCases;
    mapping(address => bool) public isResolver;      // Authorized resolvers
    mapping(bytes32 => bool) public refundedCases;   // Prevent double refunds
    
    // Pool management
    uint256 public totalPoolBalance;     // Total pool balance
    uint256 public totalGuarantees;     // Total guarantees issued
    uint256 public totalResolutions;    // Total resolutions completed
    uint256 public totalProtectionPlans; // Total active protection plans
    
    // Events
    event ProtectionPlanCreated(
        bytes32 indexed identityCommit,
        uint256 monthlyFee,
        uint256 protectionLevel,
        uint256 startDate
    );
    
    event PaymentReceived(
        bytes32 indexed identityCommit,
        uint256 amount,
        uint256 timestamp
    );
    
    event FraudCaseReported(
        bytes32 indexed caseId,
        bytes32 indexed identityCommit,
        string fraudType,
        string description,
        uint256 reportedAt
    );
    
    event ResolutionGuaranteeIssued(
        bytes32 indexed caseId,
        bytes32 indexed identityCommit,
        uint256 guaranteeAmount,
        uint256 resolutionDeadline
    );
    
    event FraudCaseResolved(
        bytes32 indexed caseId,
        bytes32 indexed identityCommit,
        string resolutionEvidence,
        uint256 resolvedAt
    );
    
    event FraudResolvedWithGuarantee(
        bytes32 indexed caseId,
        bytes32 indexed identityCommit,
        uint256 guaranteeAmount,
        bool refunded
    );
    
    event ResolverSet(address indexed resolver, bool allowed);
    
    event PoolToppedUp(address indexed from, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a protection plan
     * @param identityCommit Identity commitment
     * @param monthlyFee Monthly protection fee in wei
     * @param protectionLevel Protection level (1-10)
     */
    function createProtectionPlan(
        bytes32 identityCommit,
        uint256 monthlyFee,
        uint256 protectionLevel
    ) external onlyOwner {
        require(identityCommit != bytes32(0), "Invalid identity commit");
        require(monthlyFee > 0, "Monthly fee must be greater than 0");
        require(protectionLevel >= 1 && protectionLevel <= 10, "Invalid protection level");
        require(!protectionPlans[identityCommit].active, "Protection plan already exists");
        
        protectionPlans[identityCommit] = ProtectionPlan({
            identityCommit: identityCommit,
            monthlyFee: monthlyFee,
            protectionLevel: protectionLevel,
            active: true,
            startDate: block.timestamp,
            lastPayment: block.timestamp,
            fraudCases: 0,
            resolvedCases: 0,
            totalPaid: 0,
            totalRefunded: 0
        });
        
        totalProtectionPlans++;
        
        emit ProtectionPlanCreated(identityCommit, monthlyFee, protectionLevel, block.timestamp);
    }
    
    /**
     * @dev Process monthly protection payment
     * @param identityCommit Identity commitment
     */
    function processPayment(bytes32 identityCommit) external payable nonReentrant {
        ProtectionPlan storage plan = protectionPlans[identityCommit];
        require(plan.active, "No active protection plan");
        require(msg.value == plan.monthlyFee, "Incorrect payment amount");
        
        // Update plan
        plan.lastPayment = block.timestamp;
        plan.totalPaid += msg.value;
        
        // Add to pool balance
        totalPoolBalance += msg.value;
        
        emit PaymentReceived(identityCommit, msg.value, block.timestamp);
    }
    
    /**
     * @dev Report a fraud case
     * @param identityCommit Identity commitment
     * @param fraudType Type of fraud
     * @param description Fraud description
     * @return caseId Unique case identifier
     */
    function reportFraudCase(
        bytes32 identityCommit,
        string calldata fraudType,
        string calldata description
    ) external returns (bytes32) {
        require(protectionPlans[identityCommit].active, "No active protection plan");
        require(bytes(fraudType).length > 0, "Fraud type required");
        require(bytes(description).length > 0, "Description required");
        
        // Generate unique case ID
        bytes32 caseId = keccak256(abi.encodePacked(
            identityCommit,
            fraudType,
            description,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure case doesn't already exist
        require(fraudCases[caseId].caseId == bytes32(0), "Case already exists");
        
        // Create fraud case
        FraudCase memory fraudCase = FraudCase({
            caseId: caseId,
            identityCommit: identityCommit,
            fraudType: fraudType,
            description: description,
            reportedAt: block.timestamp,
            resolvedAt: 0,
            resolved: false,
            resolutionEvidence: ""
        });
        
        fraudCases[caseId] = fraudCase;
        
        // Update protection plan
        ProtectionPlan storage plan = protectionPlans[identityCommit];
        plan.fraudCases++;
        
        emit FraudCaseReported(caseId, identityCommit, fraudType, description, block.timestamp);
        
        return caseId;
    }
    
    /**
     * @dev Issue a resolution guarantee
     * @param caseId Fraud case identifier
     * @param identityCommit Identity commitment
     * @param guaranteeAmount Guarantee amount in wei
     * @param resolutionDeadline Resolution deadline timestamp
     */
    function issueResolutionGuarantee(
        bytes32 caseId,
        bytes32 identityCommit,
        uint256 guaranteeAmount,
        uint256 resolutionDeadline
    ) external onlyOwner {
        require(caseId != bytes32(0), "Invalid case ID");
        require(identityCommit != bytes32(0), "Invalid identity commit");
        require(guaranteeAmount > 0, "Guarantee amount must be greater than 0");
        require(resolutionDeadline > block.timestamp, "Invalid deadline");
        require(fraudCases[caseId].caseId != bytes32(0), "Fraud case not found");
        require(!fraudCases[caseId].resolved, "Case already resolved");
        
        // Get fraud case details
        FraudCase memory fraudCase = fraudCases[caseId];
        
        // Create resolution guarantee
        ResolutionGuarantee memory guarantee = ResolutionGuarantee({
            caseId: caseId,
            identityCommit: identityCommit,
            guaranteeAmount: guaranteeAmount,
            resolutionDeadline: resolutionDeadline,
            resolved: false,
            refunded: false,
            fraudType: fraudCase.fraudType,
            description: fraudCase.description
        });
        
        resolutionGuarantees[caseId] = guarantee;
        totalGuarantees += guaranteeAmount;
        
        emit ResolutionGuaranteeIssued(caseId, identityCommit, guaranteeAmount, resolutionDeadline);
    }
    
    /**
     * @dev Resolve a fraud case
     * @param caseId Fraud case identifier
     * @param resolutionEvidence IPFS URI to resolution evidence
     */
    function resolveFraudCase(
        bytes32 caseId,
        string calldata resolutionEvidence
    ) external {
        require(isResolver[msg.sender], "Not authorized resolver");
        require(fraudCases[caseId].caseId != bytes32(0), "Fraud case not found");
        require(!fraudCases[caseId].resolved, "Case already resolved");
        require(bytes(resolutionEvidence).length > 0, "Resolution evidence required");
        
        FraudCase storage fraudCase = fraudCases[caseId];
        fraudCase.resolved = true;
        fraudCase.resolvedAt = block.timestamp;
        fraudCase.resolutionEvidence = resolutionEvidence;
        
        // Update protection plan
        ProtectionPlan storage plan = protectionPlans[fraudCase.identityCommit];
        plan.resolvedCases++;
        
        totalResolutions++;
        
        emit FraudCaseResolved(caseId, fraudCase.identityCommit, resolutionEvidence, block.timestamp);
    }
    
    /**
     * @dev Resolve fraud with guarantee
     * @param caseId Fraud case identifier
     * @param successful Whether resolution was successful
     */
    function resolveFraudWithGuarantee(
        bytes32 caseId,
        bool successful
    ) external nonReentrant {
        require(isResolver[msg.sender], "Not authorized resolver");
        
        ResolutionGuarantee storage guarantee = resolutionGuarantees[caseId];
        require(guarantee.caseId != bytes32(0), "Guarantee not found");
        require(!guarantee.resolved, "Already resolved");
        
        guarantee.resolved = true;
        
        if (successful) {
            // Fraud successfully resolved, no refund needed
            guarantee.refunded = false;
        } else {
            // Fraud not resolved within deadline, issue refund
            require(!refundedCases[caseId], "Already refunded");
            require(totalPoolBalance >= guarantee.guaranteeAmount, "Insufficient pool balance");
            
            guarantee.refunded = true;
            refundedCases[caseId] = true;
            totalPoolBalance -= guarantee.guaranteeAmount;
            
            // Transfer refund to identity owner
            (bool success, ) = payable(address(uint160(uint256(guarantee.identityCommit)))).call{
                value: guarantee.guaranteeAmount
            }("");
            require(success, "Refund transfer failed");
        }
        
        emit FraudResolvedWithGuarantee(
            caseId,
            guarantee.identityCommit,
            guarantee.guaranteeAmount,
            guarantee.refunded
        );
    }
    
    /**
     * @dev Cancel protection plan and refund unused portion
     * @param identityCommit Identity commitment
     */
    function cancelProtectionPlan(bytes32 identityCommit) external nonReentrant {
        ProtectionPlan storage plan = protectionPlans[identityCommit];
        require(plan.active, "No active protection plan");
        
        // Calculate refund for unused portion of current month
        uint256 timeSinceLastPayment = block.timestamp - plan.lastPayment;
        uint256 daysInMonth = 30 days;
        
        if (timeSinceLastPayment < daysInMonth) {
            uint256 unusedDays = daysInMonth - timeSinceLastPayment;
            uint256 refundAmount = (plan.monthlyFee * unusedDays) / daysInMonth;
            
            if (refundAmount > 0 && totalPoolBalance >= refundAmount) {
                plan.totalRefunded += refundAmount;
                totalPoolBalance -= refundAmount;
                
                (bool success, ) = payable(address(uint160(uint256(identityCommit)))).call{value: refundAmount}("");
                require(success, "Refund transfer failed");
            }
        }
        
        // Deactivate plan
        plan.active = false;
        totalProtectionPlans--;
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
     * @dev Get protection plan information
     * @param identityCommit Identity commitment
     * @return plan Protection plan information
     */
    function getProtectionPlan(bytes32 identityCommit) external view returns (ProtectionPlan memory plan) {
        return protectionPlans[identityCommit];
    }
    
    /**
     * @dev Get fraud case information
     * @param caseId Case identifier
     * @return fraudCase Fraud case information
     */
    function getFraudCase(bytes32 caseId) external view returns (FraudCase memory fraudCase) {
        return fraudCases[caseId];
    }
    
    /**
     * @dev Get resolution guarantee information
     * @param caseId Case identifier
     * @return guarantee Resolution guarantee information
     */
    function getResolutionGuarantee(bytes32 caseId) external view returns (ResolutionGuarantee memory guarantee) {
        return resolutionGuarantees[caseId];
    }
    
    /**
     * @dev Get pool statistics
     * @return balance Total pool balance
     * @return guarantees Total guarantees issued
     * @return resolutions Total resolutions completed
     * @return plans Total active protection plans
     */
    function getPoolStats() external view returns (uint256 balance, uint256 guarantees, uint256 resolutions, uint256 plans) {
        return (totalPoolBalance, totalGuarantees, totalResolutions, totalProtectionPlans);
    }
    
    /**
     * @dev Calculate refund amount for a protection plan
     * @param identityCommit Identity commitment
     * @return refundAmount Calculated refund amount
     */
    function calculateRefund(bytes32 identityCommit) external view returns (uint256 refundAmount) {
        ProtectionPlan memory plan = protectionPlans[identityCommit];
        if (!plan.active) return 0;
        
        // Calculate refund based on unresolved fraud cases
        uint256 unresolvedCases = plan.fraudCases - plan.resolvedCases;
        if (unresolvedCases == 0) return 0;
        
        // Refund amount = monthly fee * number of months with unresolved cases
        uint256 monthsWithUnresolved = (block.timestamp - plan.startDate) / 30 days;
        refundAmount = plan.monthlyFee * monthsWithUnresolved;
        
        // Cap refund at total amount paid
        if (refundAmount > plan.totalPaid) {
            refundAmount = plan.totalPaid;
        }
        
        return refundAmount;
    }
}
