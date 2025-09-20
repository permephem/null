// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreditDisputeWarrant
 * @dev Smart contract for managing credit dispute warrants with permanent deletion capabilities
 * @notice This contract handles credit dispute submissions, resolution, and permanent deletion attestations
 */
contract CreditDisputeWarrant is Ownable, ReentrancyGuard {
    
    enum DisputeType {
        INACCURATE_INFO,      // 0: Factually incorrect information
        IDENTITY_THEFT,       // 1: Fraudulent account
        OUTDATED_INFO,        // 2: Information past reporting period
        DUPLICATE_ENTRY,      // 3: Duplicate account reporting
        PAID_DEBT,           // 4: Debt already satisfied
        BANKRUPTCY_DISCHARGE, // 5: Discharged in bankruptcy
        STATUTE_LIMITATION    // 6: Past statute of limitations
    }
    
    enum DisputeStatus {
        PENDING,             // 0: Dispute submitted
        INVESTIGATING,       // 1: Under investigation
        RESOLVED,           // 2: Resolved in favor of consumer
        DENIED,             // 3: Dispute denied
        PERMANENTLY_DELETED  // 4: Permanently removed from credit
    }
    
    struct DisputeWarrant {
        bytes32 disputeId;           // Unique dispute identifier
        bytes32 consumerCommit;      // Privacy-preserving consumer ID
        bytes32 accountCommit;       // Account identifier commitment
        DisputeType disputeType;     // Type of dispute
        string evidenceUri;          // IPFS URI to supporting evidence
        uint256 submittedAt;         // Timestamp of submission
        uint256 resolvedAt;          // Timestamp of resolution
        DisputeStatus status;        // Current dispute status
        address creditBureau;        // Credit bureau address
        string resolutionReason;     // Reason for resolution
    }
    
    struct DeletionAttestation {
        bytes32 disputeId;           // Original dispute ID
        bytes32 consumerCommit;      // Consumer commitment
        bytes32 accountCommit;       // Account commitment
        string deletionReason;       // Reason for deletion
        uint256 deletedAt;           // Deletion timestamp
        address attestedBy;          // Credit bureau that attested
        string evidenceUri;          // IPFS URI to deletion proof
        bool permanent;              // Whether deletion is permanent
    }
    
    // State variables
    mapping(bytes32 => DisputeWarrant) public disputes;
    mapping(bytes32 => DeletionAttestation) public deletionAttestations;
    mapping(address => bool) public authorizedCreditBureaus;
    mapping(bytes32 => bool) public permanentDeletions; // disputeId => isPermanentlyDeleted
    
    // Statistics
    uint256 public totalDisputes;
    uint256 public totalResolved;
    uint256 public totalPermanentlyDeleted;
    
    // Events
    event DisputeSubmitted(
        bytes32 indexed disputeId,
        bytes32 indexed consumerCommit,
        bytes32 indexed accountCommit,
        DisputeType disputeType,
        string evidenceUri,
        uint256 submittedAt
    );
    
    event DisputeResolved(
        bytes32 indexed disputeId,
        DisputeStatus status,
        string resolutionReason,
        uint256 resolvedAt
    );
    
    event CreditItemDeleted(
        bytes32 indexed disputeId,
        bytes32 indexed consumerCommit,
        bytes32 indexed accountCommit,
        string deletionReason,
        uint256 deletedAt,
        address attestedBy
    );
    
    event CreditBureauAuthorized(address indexed creditBureau, bool authorized);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Submit a credit dispute warrant
     * @param consumerCommit Privacy-preserving consumer identifier
     * @param accountCommit Account identifier commitment
     * @param disputeType Type of dispute
     * @param evidenceUri IPFS URI to supporting evidence
     * @return disputeId Unique dispute identifier
     */
    function submitDisputeWarrant(
        bytes32 consumerCommit,
        bytes32 accountCommit,
        DisputeType disputeType,
        string calldata evidenceUri
    ) external nonReentrant returns (bytes32) {
        require(consumerCommit != bytes32(0), "Invalid consumer commit");
        require(accountCommit != bytes32(0), "Invalid account commit");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        
        // Generate unique dispute ID
        bytes32 disputeId = keccak256(abi.encodePacked(
            consumerCommit,
            accountCommit,
            disputeType,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure dispute doesn't already exist
        require(disputes[disputeId].disputeId == bytes32(0), "Dispute already exists");
        
        // Create dispute warrant
        DisputeWarrant memory warrant = DisputeWarrant({
            disputeId: disputeId,
            consumerCommit: consumerCommit,
            accountCommit: accountCommit,
            disputeType: disputeType,
            evidenceUri: evidenceUri,
            submittedAt: block.timestamp,
            resolvedAt: 0,
            status: DisputeStatus.PENDING,
            creditBureau: address(0),
            resolutionReason: ""
        });
        
        // Store dispute
        disputes[disputeId] = warrant;
        totalDisputes++;
        
        emit DisputeSubmitted(
            disputeId,
            consumerCommit,
            accountCommit,
            disputeType,
            evidenceUri,
            block.timestamp
        );
        
        return disputeId;
    }
    
    /**
     * @dev Resolve a credit dispute
     * @param disputeId Dispute identifier
     * @param status Resolution status
     * @param resolutionReason Reason for resolution
     */
    function resolveDispute(
        bytes32 disputeId,
        DisputeStatus status,
        string calldata resolutionReason
    ) external {
        require(authorizedCreditBureaus[msg.sender], "Not authorized credit bureau");
        
        DisputeWarrant storage dispute = disputes[disputeId];
        require(dispute.disputeId != bytes32(0), "Dispute not found");
        require(dispute.status == DisputeStatus.PENDING || dispute.status == DisputeStatus.INVESTIGATING, "Dispute already resolved");
        
        // Update dispute status
        dispute.status = status;
        dispute.resolvedAt = block.timestamp;
        dispute.creditBureau = msg.sender;
        dispute.resolutionReason = resolutionReason;
        
        // Update statistics
        if (status == DisputeStatus.RESOLVED || status == DisputeStatus.PERMANENTLY_DELETED) {
            totalResolved++;
        }
        
        if (status == DisputeStatus.PERMANENTLY_DELETED) {
            permanentDeletions[disputeId] = true;
            totalPermanentlyDeleted++;
        }
        
        emit DisputeResolved(disputeId, status, resolutionReason, block.timestamp);
    }
    
    /**
     * @dev Attest permanent deletion of a credit item
     * @param disputeId Original dispute identifier
     * @param consumerCommit Consumer commitment
     * @param accountCommit Account commitment
     * @param deletionReason Reason for deletion
     * @param evidenceUri IPFS URI to deletion proof
     */
    function attestPermanentDeletion(
        bytes32 disputeId,
        bytes32 consumerCommit,
        bytes32 accountCommit,
        string calldata deletionReason,
        string calldata evidenceUri
    ) external {
        require(authorizedCreditBureaus[msg.sender], "Not authorized credit bureau");
        require(disputes[disputeId].disputeId != bytes32(0), "Dispute not found");
        require(!permanentDeletions[disputeId], "Already permanently deleted");
        
        // Create deletion attestation
        DeletionAttestation memory attestation = DeletionAttestation({
            disputeId: disputeId,
            consumerCommit: consumerCommit,
            accountCommit: accountCommit,
            deletionReason: deletionReason,
            deletedAt: block.timestamp,
            attestedBy: msg.sender,
            evidenceUri: evidenceUri,
            permanent: true
        });
        
        // Store attestation
        deletionAttestations[disputeId] = attestation;
        permanentDeletions[disputeId] = true;
        
        // Update dispute status
        disputes[disputeId].status = DisputeStatus.PERMANENTLY_DELETED;
        disputes[disputeId].resolvedAt = block.timestamp;
        disputes[disputeId].creditBureau = msg.sender;
        disputes[disputeId].resolutionReason = deletionReason;
        
        // Update statistics
        totalPermanentlyDeleted++;
        
        emit CreditItemDeleted(
            disputeId,
            consumerCommit,
            accountCommit,
            deletionReason,
            block.timestamp,
            msg.sender
        );
    }
    
    /**
     * @dev Authorize a credit bureau
     * @param creditBureau Credit bureau address
     * @param authorized Whether to authorize or revoke
     */
    function setCreditBureauAuthorization(address creditBureau, bool authorized) external onlyOwner {
        authorizedCreditBureaus[creditBureau] = authorized;
        emit CreditBureauAuthorized(creditBureau, authorized);
    }
    
    /**
     * @dev Get dispute information
     * @param disputeId Dispute identifier
     * @return warrant Dispute warrant information
     */
    function getDispute(bytes32 disputeId) external view returns (DisputeWarrant memory warrant) {
        return disputes[disputeId];
    }
    
    /**
     * @dev Get deletion attestation
     * @param disputeId Dispute identifier
     * @return attestation Deletion attestation information
     */
    function getDeletionAttestation(bytes32 disputeId) external view returns (DeletionAttestation memory attestation) {
        return deletionAttestations[disputeId];
    }
    
    /**
     * @dev Check if a dispute is permanently deleted
     * @param disputeId Dispute identifier
     * @return isPermanentlyDeleted Whether the dispute is permanently deleted
     */
    function isPermanentlyDeleted(bytes32 disputeId) external view returns (bool isPermanentlyDeleted) {
        return permanentDeletions[disputeId];
    }
    
    /**
     * @dev Get contract statistics
     * @return disputes Total number of disputes
     * @return resolved Total number of resolved disputes
     * @return permanentlyDeleted Total number of permanently deleted disputes
     */
    function getStats() external view returns (uint256 disputes, uint256 resolved, uint256 permanentlyDeleted) {
        return (totalDisputes, totalResolved, totalPermanentlyDeleted);
    }
    
    /**
     * @dev Convert DisputeType enum to string
     * @param disputeType Dispute type enum
     * @return String representation of dispute type
     */
    function disputeTypeToString(DisputeType disputeType) external pure returns (string memory) {
        if (disputeType == DisputeType.INACCURATE_INFO) return "inaccurate_info";
        if (disputeType == DisputeType.IDENTITY_THEFT) return "identity_theft";
        if (disputeType == DisputeType.OUTDATED_INFO) return "outdated_info";
        if (disputeType == DisputeType.DUPLICATE_ENTRY) return "duplicate_entry";
        if (disputeType == DisputeType.PAID_DEBT) return "paid_debt";
        if (disputeType == DisputeType.BANKRUPTCY_DISCHARGE) return "bankruptcy_discharge";
        if (disputeType == DisputeType.STATUTE_LIMITATION) return "statute_limitation";
        return "unknown";
    }
    
    /**
     * @dev Convert DisputeStatus enum to string
     * @param status Dispute status enum
     * @return String representation of dispute status
     */
    function disputeStatusToString(DisputeStatus status) external pure returns (string memory) {
        if (status == DisputeStatus.PENDING) return "pending";
        if (status == DisputeStatus.INVESTIGATING) return "investigating";
        if (status == DisputeStatus.RESOLVED) return "resolved";
        if (status == DisputeStatus.DENIED) return "denied";
        if (status == DisputeStatus.PERMANENTLY_DELETED) return "permanently_deleted";
        return "unknown";
    }
}
