// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EstateExecutionPool
 * @dev Pool for estate execution with compensation and performance tracking
 * @notice This contract manages estate executions, executor profiles, and compensation claims
 */
contract EstateExecutionPool is ReentrancyGuard, Ownable {
    
    struct EstateExecution {
        bytes32 estateId;           // Estate identifier
        bytes32 executorCommit;     // Executor commitment
        uint256 totalAccounts;      // Total accounts to close
        uint256 closedAccounts;     // Accounts successfully closed
        uint256 failedAccounts;     // Accounts that failed to close
        uint256 executionFee;       // Fee for execution
        uint256 completionBonus;    // Bonus for 100% completion
        bool completed;             // Whether execution is completed
        uint256 completedAt;        // Completion timestamp
        uint256 startedAt;          // Start timestamp
    }
    
    struct ExecutorProfile {
        bytes32 executorCommit;     // Executor commitment
        uint256 totalEstates;       // Total estates executed
        uint256 successfulEstates;  // Successfully completed estates
        uint256 totalEarnings;      // Total earnings
        uint256 rating;             // Executor rating (1-5)
        bool active;                // Whether executor is active
        string credentials;         // IPFS URI to credentials
        uint256 joinedAt;           // Join timestamp
    }
    
    struct CompensationClaim {
        bytes32 claimId;            // Claim identifier
        bytes32 estateId;           // Estate identifier
        bytes32 executorCommit;     // Executor commitment
        uint256 claimAmount;        // Claim amount
        string claimReason;         // Reason for claim
        uint256 claimedAt;          // Claim timestamp
        bool approved;              // Whether claim is approved
        bool paid;                  // Whether claim is paid
        string evidenceUri;         // IPFS URI to claim evidence
    }
    
    struct PerformanceMetrics {
        bytes32 executorCommit;     // Executor commitment
        uint256 totalExecutions;    // Total executions
        uint256 successfulExecutions; // Successful executions
        uint256 totalAccountsClosed; // Total accounts closed
        uint256 averageCompletionTime; // Average completion time
        uint256 customerRating;     // Average customer rating
        uint256 lastUpdated;        // Last update timestamp
    }
    
    // State variables
    mapping(bytes32 => EstateExecution) public estateExecutions;
    mapping(bytes32 => ExecutorProfile) public executorProfiles;
    mapping(bytes32 => CompensationClaim) public compensationClaims;
    mapping(bytes32 => PerformanceMetrics) public performanceMetrics;
    mapping(address => bool) public isResolver;      // Authorized resolvers
    mapping(bytes32 => bool) public paidClaims;      // Prevent double payments
    
    // Pool management
    uint256 public totalPoolBalance;     // Total pool balance
    uint256 public totalExecutions;      // Total executions
    uint256 public totalCompensations;   // Total compensations paid
    uint256 public totalExecutors;       // Total active executors
    
    // Fee structure
    uint256 public baseExecutionFee = 0.1 ether;     // Base fee per execution
    uint256 public completionBonusRate = 1000;       // 10% bonus for 100% completion
    uint256 public performanceBonusRate = 500;       // 5% bonus for high performance
    
    // Events
    event EstateExecutionStarted(
        bytes32 indexed estateId,
        bytes32 indexed executorCommit,
        uint256 totalAccounts,
        uint256 executionFee,
        uint256 startedAt
    );
    
    event EstateExecutionCompleted(
        bytes32 indexed estateId,
        bytes32 indexed executorCommit,
        uint256 closedAccounts,
        uint256 failedAccounts,
        uint256 completionBonus,
        uint256 completedAt
    );
    
    event ExecutorRegistered(
        bytes32 indexed executorCommit,
        string credentials,
        uint256 joinedAt
    );
    
    event CompensationClaimed(
        bytes32 indexed claimId,
        bytes32 indexed estateId,
        bytes32 indexed executorCommit,
        uint256 claimAmount,
        string claimReason
    );
    
    event CompensationPaid(
        bytes32 indexed claimId,
        bytes32 indexed executorCommit,
        uint256 claimAmount,
        uint256 paidAt
    );
    
    event PerformanceUpdated(
        bytes32 indexed executorCommit,
        uint256 totalExecutions,
        uint256 successfulExecutions,
        uint256 customerRating
    );
    
    event ResolverSet(address indexed resolver, bool allowed);
    
    event PoolToppedUp(address indexed from, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Register an executor
     * @param executorCommit Executor commitment
     * @param credentials IPFS URI to credentials
     */
    function registerExecutor(
        bytes32 executorCommit,
        string calldata credentials
    ) external {
        require(executorCommit != bytes32(0), "Invalid executor commit");
        require(bytes(credentials).length > 0, "Credentials required");
        require(executorProfiles[executorCommit].executorCommit == bytes32(0), "Executor already registered");
        
        executorProfiles[executorCommit] = ExecutorProfile({
            executorCommit: executorCommit,
            totalEstates: 0,
            successfulEstates: 0,
            totalEarnings: 0,
            rating: 5, // Start with perfect rating
            active: true,
            credentials: credentials,
            joinedAt: block.timestamp
        });
        
        performanceMetrics[executorCommit] = PerformanceMetrics({
            executorCommit: executorCommit,
            totalExecutions: 0,
            successfulExecutions: 0,
            totalAccountsClosed: 0,
            averageCompletionTime: 0,
            customerRating: 5,
            lastUpdated: block.timestamp
        });
        
        totalExecutors++;
        
        emit ExecutorRegistered(executorCommit, credentials, block.timestamp);
    }
    
    /**
     * @dev Start estate execution
     * @param estateId Estate identifier
     * @param executorCommit Executor commitment
     * @param totalAccounts Total accounts to close
     * @param executionFee Fee for execution
     */
    function startEstateExecution(
        bytes32 estateId,
        bytes32 executorCommit,
        uint256 totalAccounts,
        uint256 executionFee
    ) external payable {
        require(estateId != bytes32(0), "Invalid estate ID");
        require(executorCommit != bytes32(0), "Invalid executor commit");
        require(totalAccounts > 0, "Total accounts must be greater than 0");
        require(executionFee > 0, "Execution fee must be greater than 0");
        require(executorProfiles[executorCommit].active, "Executor not active");
        require(estateExecutions[estateId].estateId == bytes32(0), "Execution already started");
        require(msg.value >= executionFee, "Insufficient payment");
        
        // Create estate execution
        estateExecutions[estateId] = EstateExecution({
            estateId: estateId,
            executorCommit: executorCommit,
            totalAccounts: totalAccounts,
            closedAccounts: 0,
            failedAccounts: 0,
            executionFee: executionFee,
            completionBonus: 0,
            completed: false,
            completedAt: 0,
            startedAt: block.timestamp
        });
        
        // Add to pool balance
        totalPoolBalance += msg.value;
        totalExecutions++;
        
        // Update executor profile
        executorProfiles[executorCommit].totalEstates++;
        
        emit EstateExecutionStarted(estateId, executorCommit, totalAccounts, executionFee, block.timestamp);
    }
    
    /**
     * @dev Update estate execution progress
     * @param estateId Estate identifier
     * @param closedAccounts Number of accounts closed
     * @param failedAccounts Number of accounts that failed
     */
    function updateExecutionProgress(
        bytes32 estateId,
        uint256 closedAccounts,
        uint256 failedAccounts
    ) external {
        require(estateExecutions[estateId].estateId != bytes32(0), "Execution not found");
        require(!estateExecutions[estateId].completed, "Execution already completed");
        
        EstateExecution storage execution = estateExecutions[estateId];
        require(closedAccounts + failedAccounts <= execution.totalAccounts, "Invalid account counts");
        
        execution.closedAccounts = closedAccounts;
        execution.failedAccounts = failedAccounts;
    }
    
    /**
     * @dev Complete estate execution
     * @param estateId Estate identifier
     * @param closedAccounts Final number of accounts closed
     * @param failedAccounts Final number of accounts that failed
     * @param customerRating Customer rating (1-5)
     */
    function completeEstateExecution(
        bytes32 estateId,
        uint256 closedAccounts,
        uint256 failedAccounts,
        uint256 customerRating
    ) external {
        require(isResolver[msg.sender], "Not authorized resolver");
        require(estateExecutions[estateId].estateId != bytes32(0), "Execution not found");
        require(!estateExecutions[estateId].completed, "Execution already completed");
        require(customerRating >= 1 && customerRating <= 5, "Invalid customer rating");
        
        EstateExecution storage execution = estateExecutions[estateId];
        require(closedAccounts + failedAccounts == execution.totalAccounts, "Invalid account counts");
        
        execution.closedAccounts = closedAccounts;
        execution.failedAccounts = failedAccounts;
        execution.completed = true;
        execution.completedAt = block.timestamp;
        
        // Calculate completion bonus
        uint256 completionRate = (closedAccounts * 10000) / execution.totalAccounts; // Basis points
        if (completionRate == 10000) { // 100% completion
            execution.completionBonus = (execution.executionFee * completionBonusRate) / 10000;
        }
        
        // Update executor profile
        ExecutorProfile storage profile = executorProfiles[execution.executorCommit];
        if (completionRate >= 9000) { // 90% or higher completion
            profile.successfulEstates++;
        }
        profile.totalEarnings += execution.executionFee + execution.completionBonus;
        
        // Update performance metrics
        PerformanceMetrics storage metrics = performanceMetrics[execution.executorCommit];
        metrics.totalExecutions++;
        if (completionRate >= 9000) {
            metrics.successfulExecutions++;
        }
        metrics.totalAccountsClosed += closedAccounts;
        metrics.customerRating = ((metrics.customerRating * (metrics.totalExecutions - 1)) + customerRating) / metrics.totalExecutions;
        metrics.lastUpdated = block.timestamp;
        
        emit EstateExecutionCompleted(
            estateId,
            execution.executorCommit,
            closedAccounts,
            failedAccounts,
            execution.completionBonus,
            block.timestamp
        );
        
        emit PerformanceUpdated(
            execution.executorCommit,
            metrics.totalExecutions,
            metrics.successfulExecutions,
            metrics.customerRating
        );
    }
    
    /**
     * @dev Claim compensation
     * @param estateId Estate identifier
     * @param executorCommit Executor commitment
     * @param claimAmount Claim amount
     * @param claimReason Reason for claim
     * @param evidenceUri IPFS URI to claim evidence
     * @return claimId Unique claim identifier
     */
    function claimCompensation(
        bytes32 estateId,
        bytes32 executorCommit,
        uint256 claimAmount,
        string calldata claimReason,
        string calldata evidenceUri
    ) external returns (bytes32) {
        require(estateId != bytes32(0), "Invalid estate ID");
        require(executorCommit != bytes32(0), "Invalid executor commit");
        require(claimAmount > 0, "Claim amount must be greater than 0");
        require(bytes(claimReason).length > 0, "Claim reason required");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        require(estateExecutions[estateId].completed, "Estate execution not completed");
        
        // Generate unique claim ID
        bytes32 claimId = keccak256(abi.encodePacked(
            estateId,
            executorCommit,
            claimAmount,
            claimReason,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure claim doesn't already exist
        require(compensationClaims[claimId].claimId == bytes32(0), "Claim already exists");
        
        // Create compensation claim
        CompensationClaim memory claim = CompensationClaim({
            claimId: claimId,
            estateId: estateId,
            executorCommit: executorCommit,
            claimAmount: claimAmount,
            claimReason: claimReason,
            claimedAt: block.timestamp,
            approved: false,
            paid: false,
            evidenceUri: evidenceUri
        });
        
        compensationClaims[claimId] = claim;
        
        emit CompensationClaimed(claimId, estateId, executorCommit, claimAmount, claimReason);
        
        return claimId;
    }
    
    /**
     * @dev Process compensation claim
     * @param claimId Claim identifier
     * @param approved Whether claim is approved
     */
    function processCompensationClaim(
        bytes32 claimId,
        bool approved
    ) external nonReentrant {
        require(isResolver[msg.sender], "Not authorized resolver");
        require(compensationClaims[claimId].claimId != bytes32(0), "Claim not found");
        require(!compensationClaims[claimId].paid, "Claim already paid");
        
        CompensationClaim storage claim = compensationClaims[claimId];
        claim.approved = approved;
        
        if (approved) {
            require(totalPoolBalance >= claim.claimAmount, "Insufficient pool balance");
            require(!paidClaims[claimId], "Already paid");
            
            claim.paid = true;
            paidClaims[claimId] = true;
            totalPoolBalance -= claim.claimAmount;
            totalCompensations += claim.claimAmount;
            
            // Transfer compensation to executor
            (bool success, ) = payable(address(uint160(uint256(claim.executorCommit)))).call{
                value: claim.claimAmount
            }("");
            require(success, "Transfer failed");
            
            emit CompensationPaid(claimId, claim.executorCommit, claim.claimAmount, block.timestamp);
        }
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
     * @dev Update fee structure
     * @param _baseExecutionFee New base execution fee
     * @param _completionBonusRate New completion bonus rate (basis points)
     * @param _performanceBonusRate New performance bonus rate (basis points)
     */
    function updateFeeStructure(
        uint256 _baseExecutionFee,
        uint256 _completionBonusRate,
        uint256 _performanceBonusRate
    ) external onlyOwner {
        require(_completionBonusRate <= 2000, "Completion bonus rate too high"); // Max 20%
        require(_performanceBonusRate <= 1000, "Performance bonus rate too high"); // Max 10%
        
        baseExecutionFee = _baseExecutionFee;
        completionBonusRate = _completionBonusRate;
        performanceBonusRate = _performanceBonusRate;
    }
    
    /**
     * @dev Top up the execution pool
     */
    receive() external payable {
        totalPoolBalance += msg.value;
        emit PoolToppedUp(msg.sender, msg.value);
    }
    
    /**
     * @dev Get estate execution information
     * @param estateId Estate identifier
     * @return execution Estate execution information
     */
    function getEstateExecution(bytes32 estateId) external view returns (EstateExecution memory execution) {
        return estateExecutions[estateId];
    }
    
    /**
     * @dev Get executor profile
     * @param executorCommit Executor commitment
     * @return profile Executor profile information
     */
    function getExecutorProfile(bytes32 executorCommit) external view returns (ExecutorProfile memory profile) {
        return executorProfiles[executorCommit];
    }
    
    /**
     * @dev Get compensation claim
     * @param claimId Claim identifier
     * @return claim Compensation claim information
     */
    function getCompensationClaim(bytes32 claimId) external view returns (CompensationClaim memory claim) {
        return compensationClaims[claimId];
    }
    
    /**
     * @dev Get performance metrics
     * @param executorCommit Executor commitment
     * @return metrics Performance metrics information
     */
    function getPerformanceMetrics(bytes32 executorCommit) external view returns (PerformanceMetrics memory metrics) {
        return performanceMetrics[executorCommit];
    }
    
    /**
     * @dev Get pool statistics
     * @return balance Total pool balance
     * @return executions Total executions
     * @return compensations Total compensations paid
     * @return executors Total active executors
     */
    function getPoolStats() external view returns (uint256 balance, uint256 executions, uint256 compensations, uint256 executors) {
        return (totalPoolBalance, totalExecutions, totalCompensations, totalExecutors);
    }
    
    /**
     * @dev Calculate executor rating
     * @param executorCommit Executor commitment
     * @return rating Calculated rating (1-5)
     */
    function calculateExecutorRating(bytes32 executorCommit) external view returns (uint256 rating) {
        PerformanceMetrics memory metrics = performanceMetrics[executorCommit];
        if (metrics.totalExecutions == 0) return 5; // Default rating for new executors
        
        uint256 successRate = (metrics.successfulExecutions * 10000) / metrics.totalExecutions;
        uint256 baseRating = (successRate * 5) / 10000; // Convert to 1-5 scale
        
        // Adjust based on customer rating
        uint256 adjustedRating = (baseRating + metrics.customerRating) / 2;
        
        return adjustedRating > 0 ? adjustedRating : 1;
    }
}
