// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IdentityProtection
 * @dev Smart contract for identity verification and protection with fraud prevention
 * @notice This contract manages identity profiles, fraud alerts, and protection policies
 */
contract IdentityProtection is Ownable, ReentrancyGuard {
    
    enum IdentityStatus {
        VERIFIED,           // 0: Identity verified and protected
        COMPROMISED,        // 1: Identity compromised
        UNDER_INVESTIGATION, // 2: Under investigation
        RESTORED,          // 3: Identity restored
        PERMANENTLY_PROTECTED // 4: Permanently protected
    }
    
    enum FraudType {
        ACCOUNT_OPENING,    // 0: Fraudulent account opening
        CREDIT_APPLICATION, // 1: Fraudulent credit application
        LOAN_APPLICATION,   // 2: Fraudulent loan application
        TAX_FRAUD,         // 3: Tax fraud
        MEDICAL_IDENTITY,   // 4: Medical identity theft
        SYNTHETIC_IDENTITY, // 5: Synthetic identity creation
        ACCOUNT_TAKEOVER    // 6: Account takeover
    }
    
    struct IdentityProfile {
        bytes32 identityCommit;     // Privacy-preserving identity hash
        bytes32 biometricCommit;    // Biometric data commitment
        IdentityStatus status;      // Current identity status
        uint256 verifiedAt;         // Verification timestamp
        uint256 lastActivity;       // Last activity timestamp
        address verifiedBy;         // Verification authority
        string evidenceUri;         // IPFS URI to verification evidence
    }
    
    struct FraudAlert {
        bytes32 alertId;            // Unique alert identifier
        bytes32 identityCommit;     // Identity commitment
        FraudType fraudType;        // Type of fraud detected
        string description;         // Fraud description
        uint256 detectedAt;         // Detection timestamp
        uint256 resolvedAt;         // Resolution timestamp
        bool resolved;              // Whether fraud is resolved
        string resolutionEvidence;  // IPFS URI to resolution evidence
    }
    
    struct ProtectionPolicy {
        bytes32 identityCommit;     // Identity commitment
        bool creditFreeze;          // Credit freeze status
        bool accountMonitoring;     // Account monitoring status
        bool biometricVerification; // Biometric verification required
        uint256 protectionLevel;    // Protection level (1-10)
        uint256 expiresAt;          // Protection expiration
    }
    
    // State variables
    mapping(bytes32 => IdentityProfile) public identityProfiles;
    mapping(bytes32 => FraudAlert) public fraudAlerts;
    mapping(bytes32 => ProtectionPolicy) public protectionPolicies;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => bool) public authorizedInstitutions;
    
    // Statistics
    uint256 public totalIdentities;
    uint256 public totalFraudAlerts;
    uint256 public totalResolvedAlerts;
    uint256 public totalProtectionPolicies;
    
    // Events
    event IdentityVerified(
        bytes32 indexed identityCommit,
        bytes32 indexed biometricCommit,
        IdentityStatus status,
        address indexed verifiedBy,
        uint256 verifiedAt
    );
    
    event FraudAlertCreated(
        bytes32 indexed alertId,
        bytes32 indexed identityCommit,
        FraudType fraudType,
        string description,
        uint256 detectedAt
    );
    
    event FraudAlertResolved(
        bytes32 indexed alertId,
        bytes32 indexed identityCommit,
        string resolutionEvidence,
        uint256 resolvedAt
    );
    
    event ProtectionPolicyCreated(
        bytes32 indexed identityCommit,
        bool creditFreeze,
        bool accountMonitoring,
        bool biometricVerification,
        uint256 protectionLevel,
        uint256 expiresAt
    );
    
    event IdentityStatusUpdated(
        bytes32 indexed identityCommit,
        IdentityStatus oldStatus,
        IdentityStatus newStatus,
        uint256 updatedAt
    );
    
    event VerifierAuthorized(address indexed verifier, bool authorized);
    event InstitutionAuthorized(address indexed institution, bool authorized);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Verify an identity and create identity profile
     * @param identityCommit Privacy-preserving identity hash
     * @param biometricCommit Biometric data commitment
     * @param evidenceUri IPFS URI to verification evidence
     */
    function verifyIdentity(
        bytes32 identityCommit,
        bytes32 biometricCommit,
        string calldata evidenceUri
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(identityCommit != bytes32(0), "Invalid identity commit");
        require(biometricCommit != bytes32(0), "Invalid biometric commit");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        require(identityProfiles[identityCommit].identityCommit == bytes32(0), "Identity already verified");
        
        // Create identity profile
        IdentityProfile memory profile = IdentityProfile({
            identityCommit: identityCommit,
            biometricCommit: biometricCommit,
            status: IdentityStatus.VERIFIED,
            verifiedAt: block.timestamp,
            lastActivity: block.timestamp,
            verifiedBy: msg.sender,
            evidenceUri: evidenceUri
        });
        
        identityProfiles[identityCommit] = profile;
        totalIdentities++;
        
        emit IdentityVerified(
            identityCommit,
            biometricCommit,
            IdentityStatus.VERIFIED,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Create a fraud alert
     * @param identityCommit Identity commitment
     * @param fraudType Type of fraud detected
     * @param description Fraud description
     * @return alertId Unique alert identifier
     */
    function createFraudAlert(
        bytes32 identityCommit,
        FraudType fraudType,
        string calldata description
    ) external returns (bytes32) {
        require(authorizedInstitutions[msg.sender], "Not authorized institution");
        require(identityCommit != bytes32(0), "Invalid identity commit");
        require(bytes(description).length > 0, "Description required");
        require(identityProfiles[identityCommit].identityCommit != bytes32(0), "Identity not verified");
        
        // Generate unique alert ID
        bytes32 alertId = keccak256(abi.encodePacked(
            identityCommit,
            fraudType,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure alert doesn't already exist
        require(fraudAlerts[alertId].alertId == bytes32(0), "Alert already exists");
        
        // Create fraud alert
        FraudAlert memory alert = FraudAlert({
            alertId: alertId,
            identityCommit: identityCommit,
            fraudType: fraudType,
            description: description,
            detectedAt: block.timestamp,
            resolvedAt: 0,
            resolved: false,
            resolutionEvidence: ""
        });
        
        fraudAlerts[alertId] = alert;
        totalFraudAlerts++;
        
        // Update identity status to compromised
        IdentityProfile storage profile = identityProfiles[identityCommit];
        IdentityStatus oldStatus = profile.status;
        profile.status = IdentityStatus.COMPROMISED;
        profile.lastActivity = block.timestamp;
        
        emit FraudAlertCreated(alertId, identityCommit, fraudType, description, block.timestamp);
        emit IdentityStatusUpdated(identityCommit, oldStatus, IdentityStatus.COMPROMISED, block.timestamp);
        
        return alertId;
    }
    
    /**
     * @dev Resolve a fraud alert
     * @param alertId Alert identifier
     * @param resolutionEvidence IPFS URI to resolution evidence
     */
    function resolveFraudAlert(
        bytes32 alertId,
        string calldata resolutionEvidence
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(fraudAlerts[alertId].alertId != bytes32(0), "Alert not found");
        require(!fraudAlerts[alertId].resolved, "Alert already resolved");
        require(bytes(resolutionEvidence).length > 0, "Resolution evidence required");
        
        FraudAlert storage alert = fraudAlerts[alertId];
        alert.resolved = true;
        alert.resolvedAt = block.timestamp;
        alert.resolutionEvidence = resolutionEvidence;
        
        totalResolvedAlerts++;
        
        // Update identity status to restored
        IdentityProfile storage profile = identityProfiles[alert.identityCommit];
        IdentityStatus oldStatus = profile.status;
        profile.status = IdentityStatus.RESTORED;
        profile.lastActivity = block.timestamp;
        
        emit FraudAlertResolved(alertId, alert.identityCommit, resolutionEvidence, block.timestamp);
        emit IdentityStatusUpdated(alert.identityCommit, oldStatus, IdentityStatus.RESTORED, block.timestamp);
    }
    
    /**
     * @dev Create a protection policy
     * @param identityCommit Identity commitment
     * @param creditFreeze Whether credit freeze is enabled
     * @param accountMonitoring Whether account monitoring is enabled
     * @param biometricVerification Whether biometric verification is required
     * @param protectionLevel Protection level (1-10)
     * @param expiresAt Protection expiration timestamp
     */
    function createProtectionPolicy(
        bytes32 identityCommit,
        bool creditFreeze,
        bool accountMonitoring,
        bool biometricVerification,
        uint256 protectionLevel,
        uint256 expiresAt
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(identityCommit != bytes32(0), "Invalid identity commit");
        require(protectionLevel >= 1 && protectionLevel <= 10, "Invalid protection level");
        require(expiresAt > block.timestamp, "Invalid expiration time");
        require(identityProfiles[identityCommit].identityCommit != bytes32(0), "Identity not verified");
        
        ProtectionPolicy memory policy = ProtectionPolicy({
            identityCommit: identityCommit,
            creditFreeze: creditFreeze,
            accountMonitoring: accountMonitoring,
            biometricVerification: biometricVerification,
            protectionLevel: protectionLevel,
            expiresAt: expiresAt
        });
        
        protectionPolicies[identityCommit] = policy;
        totalProtectionPolicies++;
        
        emit ProtectionPolicyCreated(
            identityCommit,
            creditFreeze,
            accountMonitoring,
            biometricVerification,
            protectionLevel,
            expiresAt
        );
    }
    
    /**
     * @dev Update identity status
     * @param identityCommit Identity commitment
     * @param newStatus New identity status
     */
    function updateIdentityStatus(
        bytes32 identityCommit,
        IdentityStatus newStatus
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(identityCommit != bytes32(0), "Invalid identity commit");
        require(identityProfiles[identityCommit].identityCommit != bytes32(0), "Identity not verified");
        
        IdentityProfile storage profile = identityProfiles[identityCommit];
        IdentityStatus oldStatus = profile.status;
        profile.status = newStatus;
        profile.lastActivity = block.timestamp;
        
        emit IdentityStatusUpdated(identityCommit, oldStatus, newStatus, block.timestamp);
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
     * @dev Authorize an institution
     * @param institution Institution address
     * @param authorized Whether to authorize or revoke
     */
    function setInstitutionAuthorization(address institution, bool authorized) external onlyOwner {
        authorizedInstitutions[institution] = authorized;
        emit InstitutionAuthorized(institution, authorized);
    }
    
    /**
     * @dev Get identity profile
     * @param identityCommit Identity commitment
     * @return profile Identity profile information
     */
    function getIdentityProfile(bytes32 identityCommit) external view returns (IdentityProfile memory profile) {
        return identityProfiles[identityCommit];
    }
    
    /**
     * @dev Get fraud alert
     * @param alertId Alert identifier
     * @return alert Fraud alert information
     */
    function getFraudAlert(bytes32 alertId) external view returns (FraudAlert memory alert) {
        return fraudAlerts[alertId];
    }
    
    /**
     * @dev Get protection policy
     * @param identityCommit Identity commitment
     * @return policy Protection policy information
     */
    function getProtectionPolicy(bytes32 identityCommit) external view returns (ProtectionPolicy memory policy) {
        return protectionPolicies[identityCommit];
    }
    
    /**
     * @dev Check if identity is protected
     * @param identityCommit Identity commitment
     * @return isProtected Whether identity is protected
     */
    function isIdentityProtected(bytes32 identityCommit) external view returns (bool isProtected) {
        ProtectionPolicy memory policy = protectionPolicies[identityCommit];
        return policy.identityCommit != bytes32(0) && policy.expiresAt > block.timestamp;
    }
    
    /**
     * @dev Get contract statistics
     * @return identities Total number of identities
     * @return alerts Total number of fraud alerts
     * @return resolved Total number of resolved alerts
     * @return policies Total number of protection policies
     */
    function getStats() external view returns (uint256 identities, uint256 alerts, uint256 resolved, uint256 policies) {
        return (totalIdentities, totalFraudAlerts, totalResolvedAlerts, totalProtectionPolicies);
    }
    
    /**
     * @dev Convert IdentityStatus enum to string
     * @param status Identity status enum
     * @return String representation of status
     */
    function identityStatusToString(IdentityStatus status) external pure returns (string memory) {
        if (status == IdentityStatus.VERIFIED) return "verified";
        if (status == IdentityStatus.COMPROMISED) return "compromised";
        if (status == IdentityStatus.UNDER_INVESTIGATION) return "under_investigation";
        if (status == IdentityStatus.RESTORED) return "restored";
        if (status == IdentityStatus.PERMANENTLY_PROTECTED) return "permanently_protected";
        return "unknown";
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
}
