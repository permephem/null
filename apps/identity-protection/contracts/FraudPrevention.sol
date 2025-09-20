// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FraudPrevention
 * @dev Smart contract for proactive fraud prevention and detection
 * @notice This contract manages prevention rules and tracks fraud attempts
 */
contract FraudPrevention is Ownable, ReentrancyGuard {
    
    enum FraudType {
        ACCOUNT_OPENING,    // 0: Fraudulent account opening
        CREDIT_APPLICATION, // 1: Fraudulent credit application
        LOAN_APPLICATION,   // 2: Fraudulent loan application
        TAX_FRAUD,         // 3: Tax fraud
        MEDICAL_IDENTITY,   // 4: Medical identity theft
        SYNTHETIC_IDENTITY, // 5: Synthetic identity creation
        ACCOUNT_TAKEOVER    // 6: Account takeover
    }
    
    enum PreventionAction {
        BLOCK,              // 0: Block the transaction
        FLAG,               // 1: Flag for manual review
        REQUIRE_VERIFICATION, // 2: Require additional verification
        ALLOW               // 3: Allow the transaction
    }
    
    struct PreventionRule {
        bytes32 ruleId;             // Rule identifier
        FraudType fraudType;        // Type of fraud to prevent
        string condition;           // Prevention condition
        PreventionAction action;    // Action to take
        bool active;                // Whether rule is active
        uint256 createdAt;          // Rule creation timestamp
        address createdBy;          // Rule creator
    }
    
    struct FraudAttempt {
        bytes32 attemptId;          // Attempt identifier
        bytes32 identityCommit;     // Identity commitment
        FraudType fraudType;        // Type of fraud attempt
        string institution;         // Institution where attempt occurred
        uint256 attemptedAt;        // Attempt timestamp
        bool blocked;               // Whether attempt was blocked
        string blockReason;         // Reason for blocking
        bytes32 appliedRule;        // Rule that was applied
    }
    
    struct VerificationRequest {
        bytes32 requestId;          // Request identifier
        bytes32 identityCommit;     // Identity commitment
        string verificationType;    // Type of verification required
        uint256 requestedAt;        // Request timestamp
        uint256 expiresAt;          // Expiration timestamp
        bool completed;             // Whether verification is completed
        string evidenceUri;         // IPFS URI to verification evidence
    }
    
    // State variables
    mapping(FraudType => PreventionRule[]) public preventionRules;
    mapping(bytes32 => FraudAttempt) public fraudAttempts;
    mapping(bytes32 => VerificationRequest) public verificationRequests;
    mapping(address => bool) public authorizedInstitutions;
    mapping(address => bool) public authorizedVerifiers;
    
    // Statistics
    uint256 public totalRules;
    uint256 public totalAttempts;
    uint256 public totalBlockedAttempts;
    uint256 public totalVerificationRequests;
    
    // Events
    event PreventionRuleCreated(
        bytes32 indexed ruleId,
        FraudType fraudType,
        string condition,
        PreventionAction action,
        address indexed createdBy
    );
    
    event FraudAttemptDetected(
        bytes32 indexed attemptId,
        bytes32 indexed identityCommit,
        FraudType fraudType,
        string institution,
        uint256 attemptedAt
    );
    
    event FraudAttemptBlocked(
        bytes32 indexed attemptId,
        bytes32 indexed identityCommit,
        FraudType fraudType,
        string institution,
        string blockReason,
        bytes32 indexed appliedRule
    );
    
    event VerificationRequested(
        bytes32 indexed requestId,
        bytes32 indexed identityCommit,
        string verificationType,
        uint256 expiresAt
    );
    
    event VerificationCompleted(
        bytes32 indexed requestId,
        bytes32 indexed identityCommit,
        string evidenceUri,
        uint256 completedAt
    );
    
    event InstitutionAuthorized(address indexed institution, bool authorized);
    event VerifierAuthorized(address indexed verifier, bool authorized);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a prevention rule
     * @param fraudType Type of fraud to prevent
     * @param condition Prevention condition
     * @param action Action to take
     * @return ruleId Unique rule identifier
     */
    function createPreventionRule(
        FraudType fraudType,
        string calldata condition,
        PreventionAction action
    ) external onlyOwner returns (bytes32) {
        require(bytes(condition).length > 0, "Condition required");
        
        // Generate unique rule ID
        bytes32 ruleId = keccak256(abi.encodePacked(
            fraudType,
            condition,
            action,
            block.timestamp,
            msg.sender
        ));
        
        // Create prevention rule
        PreventionRule memory rule = PreventionRule({
            ruleId: ruleId,
            fraudType: fraudType,
            condition: condition,
            action: action,
            active: true,
            createdAt: block.timestamp,
            createdBy: msg.sender
        });
        
        preventionRules[fraudType].push(rule);
        totalRules++;
        
        emit PreventionRuleCreated(ruleId, fraudType, condition, action, msg.sender);
        
        return ruleId;
    }
    
    /**
     * @dev Detect and process a fraud attempt
     * @param identityCommit Identity commitment
     * @param fraudType Type of fraud attempt
     * @param institution Institution where attempt occurred
     * @return attemptId Unique attempt identifier
     * @return blocked Whether attempt was blocked
     * @return action Action taken
     */
    function detectFraudAttempt(
        bytes32 identityCommit,
        FraudType fraudType,
        string calldata institution
    ) external returns (bytes32 attemptId, bool blocked, PreventionAction action) {
        require(authorizedInstitutions[msg.sender], "Not authorized institution");
        require(identityCommit != bytes32(0), "Invalid identity commit");
        require(bytes(institution).length > 0, "Institution required");
        
        // Generate unique attempt ID
        attemptId = keccak256(abi.encodePacked(
            identityCommit,
            fraudType,
            institution,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure attempt doesn't already exist
        require(fraudAttempts[attemptId].attemptId == bytes32(0), "Attempt already exists");
        
        // Check prevention rules
        PreventionRule[] storage rules = preventionRules[fraudType];
        PreventionAction finalAction = PreventionAction.ALLOW;
        bytes32 appliedRule = bytes32(0);
        string memory blockReason = "";
        
        for (uint256 i = 0; i < rules.length; i++) {
            if (rules[i].active) {
                // In a real implementation, you would evaluate the condition here
                // For now, we'll use a simple example
                if (rules[i].action == PreventionAction.BLOCK) {
                    finalAction = PreventionAction.BLOCK;
                    appliedRule = rules[i].ruleId;
                    blockReason = "Blocked by prevention rule";
                    break;
                } else if (rules[i].action == PreventionAction.FLAG && finalAction == PreventionAction.ALLOW) {
                    finalAction = PreventionAction.FLAG;
                    appliedRule = rules[i].ruleId;
                } else if (rules[i].action == PreventionAction.REQUIRE_VERIFICATION && finalAction == PreventionAction.ALLOW) {
                    finalAction = PreventionAction.REQUIRE_VERIFICATION;
                    appliedRule = rules[i].ruleId;
                }
            }
        }
        
        blocked = (finalAction == PreventionAction.BLOCK);
        
        // Create fraud attempt record
        FraudAttempt memory attempt = FraudAttempt({
            attemptId: attemptId,
            identityCommit: identityCommit,
            fraudType: fraudType,
            institution: institution,
            attemptedAt: block.timestamp,
            blocked: blocked,
            blockReason: blockReason,
            appliedRule: appliedRule
        });
        
        fraudAttempts[attemptId] = attempt;
        totalAttempts++;
        
        if (blocked) {
            totalBlockedAttempts++;
            emit FraudAttemptBlocked(attemptId, identityCommit, fraudType, institution, blockReason, appliedRule);
        } else {
            emit FraudAttemptDetected(attemptId, identityCommit, fraudType, institution, block.timestamp);
        }
        
        // If verification is required, create verification request
        if (finalAction == PreventionAction.REQUIRE_VERIFICATION) {
            _createVerificationRequest(identityCommit, "fraud_prevention");
        }
        
        return (attemptId, blocked, finalAction);
    }
    
    /**
     * @dev Create a verification request
     * @param identityCommit Identity commitment
     * @param verificationType Type of verification required
     * @return requestId Unique request identifier
     */
    function _createVerificationRequest(
        bytes32 identityCommit,
        string memory verificationType
    ) internal returns (bytes32 requestId) {
        requestId = keccak256(abi.encodePacked(
            identityCommit,
            verificationType,
            block.timestamp,
            msg.sender
        ));
        
        VerificationRequest memory request = VerificationRequest({
            requestId: requestId,
            identityCommit: identityCommit,
            verificationType: verificationType,
            requestedAt: block.timestamp,
            expiresAt: block.timestamp + 24 hours, // 24 hour expiration
            completed: false,
            evidenceUri: ""
        });
        
        verificationRequests[requestId] = request;
        totalVerificationRequests++;
        
        emit VerificationRequested(requestId, identityCommit, verificationType, request.expiresAt);
        
        return requestId;
    }
    
    /**
     * @dev Complete a verification request
     * @param requestId Request identifier
     * @param evidenceUri IPFS URI to verification evidence
     */
    function completeVerification(
        bytes32 requestId,
        string calldata evidenceUri
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(verificationRequests[requestId].requestId != bytes32(0), "Request not found");
        require(!verificationRequests[requestId].completed, "Already completed");
        require(verificationRequests[requestId].expiresAt > block.timestamp, "Request expired");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        
        VerificationRequest storage request = verificationRequests[requestId];
        request.completed = true;
        request.evidenceUri = evidenceUri;
        
        emit VerificationCompleted(requestId, request.identityCommit, evidenceUri, block.timestamp);
    }
    
    /**
     * @dev Toggle prevention rule active status
     * @param fraudType Fraud type
     * @param ruleIndex Rule index in the array
     * @param active Whether rule should be active
     */
    function togglePreventionRule(
        FraudType fraudType,
        uint256 ruleIndex,
        bool active
    ) external onlyOwner {
        require(ruleIndex < preventionRules[fraudType].length, "Invalid rule index");
        
        preventionRules[fraudType][ruleIndex].active = active;
    }
    
    /**
     * @dev Authorize an institution
     * @param institution Institution address
     * @param authorized Whether to authorize or revoke
     */
    function setInstitutionAuthorization(address institution, bool authorized) external onlyOwner {
        authorizedInstitutions[institution] = authorized;
        emit InstitutionAuthorized(institution, authorized);
    }
    
    /**
     * @dev Authorize a verifier
     * @param verifier Verifier address
     * @param authorized Whether to authorize or revoke
     */
    function setVerifierAuthorization(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }
    
    /**
     * @dev Get prevention rules for a fraud type
     * @param fraudType Fraud type
     * @return rules Array of prevention rules
     */
    function getPreventionRules(FraudType fraudType) external view returns (PreventionRule[] memory rules) {
        return preventionRules[fraudType];
    }
    
    /**
     * @dev Get fraud attempt
     * @param attemptId Attempt identifier
     * @return attempt Fraud attempt information
     */
    function getFraudAttempt(bytes32 attemptId) external view returns (FraudAttempt memory attempt) {
        return fraudAttempts[attemptId];
    }
    
    /**
     * @dev Get verification request
     * @param requestId Request identifier
     * @return request Verification request information
     */
    function getVerificationRequest(bytes32 requestId) external view returns (VerificationRequest memory request) {
        return verificationRequests[requestId];
    }
    
    /**
     * @dev Get contract statistics
     * @return rules Total number of rules
     * @return attempts Total number of attempts
     * @return blocked Total number of blocked attempts
     * @return verifications Total number of verification requests
     */
    function getStats() external view returns (uint256 rules, uint256 attempts, uint256 blocked, uint256 verifications) {
        return (totalRules, totalAttempts, totalBlockedAttempts, totalVerificationRequests);
    }
    
    /**
     * @dev Convert FraudType enum to string
     * @param fraudType Fraud type enum
     * @return String representation of fraud type
     */
    function fraudTypeToString(FraudType fraudType) external pure returns (string memory) {
        if (fraudType == FraudType.ACCOUNT_OPENING) return "account_opening";
        if (fraudType == FraudType.CREDIT_APPLICATION) return "credit_application";
        if (fraudType == FraudType.LOAN_APPLICATION) return "loan_application";
        if (fraudType == FraudType.TAX_FRAUD) return "tax_fraud";
        if (fraudType == FraudType.MEDICAL_IDENTITY) return "medical_identity";
        if (fraudType == FraudType.SYNTHETIC_IDENTITY) return "synthetic_identity";
        if (fraudType == FraudType.ACCOUNT_TAKEOVER) return "account_takeover";
        return "unknown";
    }
    
    /**
     * @dev Convert PreventionAction enum to string
     * @param action Prevention action enum
     * @return String representation of action
     */
    function preventionActionToString(PreventionAction action) external pure returns (string memory) {
        if (action == PreventionAction.BLOCK) return "block";
        if (action == PreventionAction.FLAG) return "flag";
        if (action == PreventionAction.REQUIRE_VERIFICATION) return "require_verification";
        if (action == PreventionAction.ALLOW) return "allow";
        return "unknown";
    }
}
