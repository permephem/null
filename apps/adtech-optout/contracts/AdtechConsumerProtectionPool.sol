// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdtechConsumerProtectionPool
 * @dev Pool for consumer compensation and ad network penalties
 * @notice This contract manages consumer claims, network penalties, and compensation payouts
 */
contract AdtechConsumerProtectionPool is ReentrancyGuard, Ownable {
    
    struct ConsumerClaim {
        bytes32 claimId;        // Claim identifier
        bytes32 consumerId;     // Consumer identifier
        string violationType;   // Type of violation
        uint256 claimAmount;    // Claim amount
        string evidenceUri;     // IPFS URI to evidence
        uint256 claimedAt;      // Claim timestamp
        bool approved;          // Whether claim is approved
        bool paid;              // Whether claim is paid
        address approvedBy;     // Address that approved claim
        string reason;          // Reason for approval/rejection
    }
    
    struct NetworkPenalty {
        string adNetwork;       // Ad network name
        uint256 penaltyAmount;  // Penalty amount
        string reason;          // Reason for penalty
        uint256 imposedAt;      // Imposition timestamp
        bool paid;              // Whether penalty is paid
        address imposedBy;      // Address that imposed penalty
        string evidenceUri;     // IPFS URI to penalty evidence
    }
    
    struct CompensationPolicy {
        string violationType;   // Type of violation
        uint256 baseAmount;     // Base compensation amount
        uint256 multiplier;     // Multiplier for severity (basis points)
        bool active;            // Whether policy is active
        uint256 createdAt;      // Creation timestamp
    }
    
    struct NetworkDeposit {
        string adNetwork;       // Ad network name
        uint256 depositAmount;  // Deposit amount
        uint256 depositedAt;    // Deposit timestamp
        bool active;            // Whether deposit is active
        uint256 usedAmount;     // Amount used for penalties
    }
    
    // State variables
    mapping(bytes32 => ConsumerClaim) public consumerClaims;
    mapping(string => NetworkPenalty[]) public networkPenalties;
    mapping(string => CompensationPolicy) public compensationPolicies;
    mapping(string => NetworkDeposit) public networkDeposits;
    mapping(address => bool) public isResolver;
    mapping(bytes32 => bool) public paidClaims;
    
    // Pool management
    uint256 public totalPoolBalance;     // Total pool balance
    uint256 public totalClaims;          // Total claims submitted
    uint256 public totalPenalties;       // Total penalties imposed
    uint256 public totalPayouts;         // Total payouts made
    uint256 public totalDeposits;        // Total network deposits
    
    // Fee structure
    uint256 public claimProcessingFee = 0.01 ether;    // Fee for processing claims
    uint256 public penaltyProcessingFee = 0.005 ether; // Fee for processing penalties
    
    // Events
    event ClaimSubmitted(
        bytes32 indexed claimId,
        bytes32 indexed consumerId,
        string violationType,
        uint256 claimAmount,
        string evidenceUri
    );
    
    event ClaimApproved(
        bytes32 indexed claimId,
        bytes32 indexed consumerId,
        uint256 claimAmount,
        address approvedBy,
        string reason
    );
    
    event ClaimRejected(
        bytes32 indexed claimId,
        bytes32 indexed consumerId,
        string reason,
        address rejectedBy
    );
    
    event ClaimPaid(
        bytes32 indexed claimId,
        bytes32 indexed consumerId,
        uint256 claimAmount,
        uint256 paidAt
    );
    
    event PenaltyImposed(
        string indexed adNetwork,
        uint256 penaltyAmount,
        string reason,
        uint256 imposedAt,
        address imposedBy
    );
    
    event PenaltyPaid(
        string indexed adNetwork,
        uint256 penaltyAmount,
        uint256 paidAt
    );
    
    event CompensationPolicyCreated(
        string indexed violationType,
        uint256 baseAmount,
        uint256 multiplier,
        bool active
    );
    
    event NetworkDepositMade(
        string indexed adNetwork,
        uint256 depositAmount,
        uint256 depositedAt
    );
    
    event PoolToppedUp(address indexed from, uint256 amount);
    event ResolverSet(address indexed resolver, bool allowed);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Submit a consumer claim
     * @param consumerId Consumer identifier
     * @param violationType Type of violation
     * @param claimAmount Claim amount
     * @param evidenceUri IPFS URI to evidence
     * @return claimId Unique claim identifier
     */
    function submitClaim(
        bytes32 consumerId,
        string calldata violationType,
        uint256 claimAmount,
        string calldata evidenceUri
    ) external payable returns (bytes32) {
        require(consumerId != bytes32(0), "Invalid consumer ID");
        require(bytes(violationType).length > 0, "Violation type required");
        require(claimAmount > 0, "Claim amount must be greater than 0");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        require(msg.value >= claimProcessingFee, "Insufficient processing fee");
        
        // Generate unique claim ID
        bytes32 claimId = keccak256(abi.encodePacked(
            consumerId,
            violationType,
            claimAmount,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure claim doesn't already exist
        require(consumerClaims[claimId].claimId == bytes32(0), "Claim already exists");
        
        // Create consumer claim
        ConsumerClaim memory claim = ConsumerClaim({
            claimId: claimId,
            consumerId: consumerId,
            violationType: violationType,
            claimAmount: claimAmount,
            evidenceUri: evidenceUri,
            claimedAt: block.timestamp,
            approved: false,
            paid: false,
            approvedBy: address(0),
            reason: ""
        });
        
        consumerClaims[claimId] = claim;
        totalClaims++;
        
        // Add processing fee to pool
        totalPoolBalance += msg.value;
        
        emit ClaimSubmitted(claimId, consumerId, violationType, claimAmount, evidenceUri);
        
        return claimId;
    }
    
    /**
     * @dev Approve a consumer claim
     * @param claimId Claim identifier
     * @param reason Reason for approval
     */
    function approveClaim(
        bytes32 claimId,
        string calldata reason
    ) external nonReentrant {
        require(isResolver[msg.sender], "Not authorized resolver");
        require(consumerClaims[claimId].claimId != bytes32(0), "Claim not found");
        require(!consumerClaims[claimId].approved, "Claim already approved");
        require(!consumerClaims[claimId].paid, "Claim already paid");
        require(bytes(reason).length > 0, "Reason required");
        
        ConsumerClaim storage claim = consumerClaims[claimId];
        claim.approved = true;
        claim.approvedBy = msg.sender;
        claim.reason = reason;
        
        emit ClaimApproved(claimId, claim.consumerId, claim.claimAmount, msg.sender, reason);
    }
    
    /**
     * @dev Reject a consumer claim
     * @param claimId Claim identifier
     * @param reason Reason for rejection
     */
    function rejectClaim(
        bytes32 claimId,
        string calldata reason
    ) external {
        require(isResolver[msg.sender], "Not authorized resolver");
        require(consumerClaims[claimId].claimId != bytes32(0), "Claim not found");
        require(!consumerClaims[claimId].approved, "Claim already approved");
        require(bytes(reason).length > 0, "Reason required");
        
        ConsumerClaim storage claim = consumerClaims[claimId];
        claim.reason = reason;
        
        emit ClaimRejected(claimId, claim.consumerId, reason, msg.sender);
    }
    
    /**
     * @dev Pay an approved claim
     * @param claimId Claim identifier
     */
    function payClaim(bytes32 claimId) external nonReentrant {
        require(isResolver[msg.sender], "Not authorized resolver");
        require(consumerClaims[claimId].claimId != bytes32(0), "Claim not found");
        require(consumerClaims[claimId].approved, "Claim not approved");
        require(!consumerClaims[claimId].paid, "Claim already paid");
        require(!paidClaims[claimId], "Claim already paid");
        require(totalPoolBalance >= consumerClaims[claimId].claimAmount, "Insufficient pool balance");
        
        ConsumerClaim storage claim = consumerClaims[claimId];
        claim.paid = true;
        paidClaims[claimId] = true;
        
        totalPoolBalance -= claim.claimAmount;
        totalPayouts += claim.claimAmount;
        
        // Transfer compensation to consumer
        (bool success, ) = payable(address(uint160(uint256(claim.consumerId)))).call{
            value: claim.claimAmount
        }("");
        require(success, "Transfer failed");
        
        emit ClaimPaid(claimId, claim.consumerId, claim.claimAmount, block.timestamp);
    }
    
    /**
     * @dev Impose a penalty on an ad network
     * @param adNetwork Ad network name
     * @param penaltyAmount Penalty amount
     * @param reason Reason for penalty
     * @param evidenceUri IPFS URI to penalty evidence
     */
    function imposePenalty(
        string calldata adNetwork,
        uint256 penaltyAmount,
        string calldata reason,
        string calldata evidenceUri
    ) external payable {
        require(isResolver[msg.sender], "Not authorized resolver");
        require(bytes(adNetwork).length > 0, "Ad network required");
        require(penaltyAmount > 0, "Penalty amount must be greater than 0");
        require(bytes(reason).length > 0, "Reason required");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        require(msg.value >= penaltyProcessingFee, "Insufficient processing fee");
        
        // Create network penalty
        NetworkPenalty memory penalty = NetworkPenalty({
            adNetwork: adNetwork,
            penaltyAmount: penaltyAmount,
            reason: reason,
            imposedAt: block.timestamp,
            paid: false,
            imposedBy: msg.sender,
            evidenceUri: evidenceUri
        });
        
        networkPenalties[adNetwork].push(penalty);
        totalPenalties += penaltyAmount;
        
        // Add processing fee to pool
        totalPoolBalance += msg.value;
        
        emit PenaltyImposed(adNetwork, penaltyAmount, reason, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Pay a network penalty
     * @param adNetwork Ad network name
     * @param penaltyIndex Index of penalty in network's penalties
     */
    function payPenalty(
        string calldata adNetwork,
        uint256 penaltyIndex
    ) external payable nonReentrant {
        require(penaltyIndex < networkPenalties[adNetwork].length, "Invalid penalty index");
        require(!networkPenalties[adNetwork][penaltyIndex].paid, "Penalty already paid");
        
        NetworkPenalty storage penalty = networkPenalties[adNetwork][penaltyIndex];
        require(msg.value >= penalty.penaltyAmount, "Insufficient payment");
        
        penalty.paid = true;
        totalPoolBalance += msg.value;
        
        emit PenaltyPaid(adNetwork, penalty.penaltyAmount, block.timestamp);
    }
    
    /**
     * @dev Create a compensation policy
     * @param violationType Type of violation
     * @param baseAmount Base compensation amount
     * @param multiplier Multiplier for severity (basis points)
     */
    function createCompensationPolicy(
        string calldata violationType,
        uint256 baseAmount,
        uint256 multiplier
    ) external onlyOwner {
        require(bytes(violationType).length > 0, "Violation type required");
        require(baseAmount > 0, "Base amount must be greater than 0");
        require(multiplier > 0, "Multiplier must be greater than 0");
        require(compensationPolicies[violationType].createdAt == 0, "Policy already exists");
        
        compensationPolicies[violationType] = CompensationPolicy({
            violationType: violationType,
            baseAmount: baseAmount,
            multiplier: multiplier,
            active: true,
            createdAt: block.timestamp
        });
        
        emit CompensationPolicyCreated(violationType, baseAmount, multiplier, true);
    }
    
    /**
     * @dev Make a network deposit
     * @param adNetwork Ad network name
     */
    function makeNetworkDeposit(string calldata adNetwork) external payable {
        require(bytes(adNetwork).length > 0, "Ad network required");
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        NetworkDeposit storage deposit = networkDeposits[adNetwork];
        if (deposit.adNetwork == "") {
            deposit.adNetwork = adNetwork;
            deposit.depositedAt = block.timestamp;
            deposit.active = true;
            deposit.usedAmount = 0;
        }
        
        deposit.depositAmount += msg.value;
        totalDeposits += msg.value;
        totalPoolBalance += msg.value;
        
        emit NetworkDepositMade(adNetwork, msg.value, block.timestamp);
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
     * @param _claimProcessingFee New claim processing fee
     * @param _penaltyProcessingFee New penalty processing fee
     */
    function updateFees(
        uint256 _claimProcessingFee,
        uint256 _penaltyProcessingFee
    ) external onlyOwner {
        claimProcessingFee = _claimProcessingFee;
        penaltyProcessingFee = _penaltyProcessingFee;
    }
    
    /**
     * @dev Top up the protection pool
     */
    receive() external payable {
        totalPoolBalance += msg.value;
        emit PoolToppedUp(msg.sender, msg.value);
    }
    
    /**
     * @dev Get consumer claim
     * @param claimId Claim identifier
     * @return claim Consumer claim information
     */
    function getConsumerClaim(bytes32 claimId) external view returns (ConsumerClaim memory claim) {
        return consumerClaims[claimId];
    }
    
    /**
     * @dev Get network penalties
     * @param adNetwork Ad network name
     * @return penalties Array of network penalties
     */
    function getNetworkPenalties(string calldata adNetwork) external view returns (NetworkPenalty[] memory penalties) {
        return networkPenalties[adNetwork];
    }
    
    /**
     * @dev Get compensation policy
     * @param violationType Violation type
     * @return policy Compensation policy information
     */
    function getCompensationPolicy(string calldata violationType) external view returns (CompensationPolicy memory policy) {
        return compensationPolicies[violationType];
    }
    
    /**
     * @dev Get network deposit
     * @param adNetwork Ad network name
     * @return deposit Network deposit information
     */
    function getNetworkDeposit(string calldata adNetwork) external view returns (NetworkDeposit memory deposit) {
        return networkDeposits[adNetwork];
    }
    
    /**
     * @dev Get pool statistics
     * @return balance Total pool balance
     * @return claims Total claims
     * @return penalties Total penalties
     * @return payouts Total payouts
     * @return deposits Total deposits
     */
    function getPoolStats() external view returns (uint256 balance, uint256 claims, uint256 penalties, uint256 payouts, uint256 deposits) {
        return (totalPoolBalance, totalClaims, totalPenalties, totalPayouts, totalDeposits);
    }
    
    /**
     * @dev Calculate compensation amount
     * @param violationType Type of violation
     * @param severity Severity level (1-10)
     * @return amount Calculated compensation amount
     */
    function calculateCompensation(string calldata violationType, uint256 severity) external view returns (uint256 amount) {
        CompensationPolicy memory policy = compensationPolicies[violationType];
        if (policy.createdAt == 0 || !policy.active) {
            return 0;
        }
        
        uint256 multiplier = (severity * policy.multiplier) / 10; // Scale severity to multiplier
        return (policy.baseAmount * multiplier) / 10000; // Apply multiplier in basis points
    }
}
