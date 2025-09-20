// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CanonHealth
 * @dev HIPAA-compliant healthcare data management contract
 * @notice This contract manages healthcare data commitments without storing PHI
 */
contract CanonHealth is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant HEALTHCARE_PROVIDER_ROLE = keccak256("HEALTHCARE_PROVIDER_ROLE");
    bytes32 public constant RESEARCHER_ROLE = keccak256("RESEARCHER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    
    // Healthcare operation types
    enum OperationType {
        CONSENT_GRANT,      // 0: Patient grants consent
        CONSENT_REVOKE,     // 1: Patient revokes consent
        RECORD_ANCHOR,      // 2: Medical record anchored
        RECORD_UPDATE,      // 3: Medical record updated
        TRIAL_CONSENT,      // 4: Clinical trial consent
        TRIAL_DATA,         // 5: Clinical trial data
        ACCESS_LOG,         // 6: Data access logged
        BREACH_REPORT       // 7: Security breach reported
    }
    
    // Assurance levels for healthcare data
    enum AssuranceLevel {
        NONE,               // 0: No assurance
        BASIC,              // 1: Basic verification
        VERIFIED,           // 2: Verified by provider
        ATTESTED,           // 3: Attested by multiple parties
        CERTIFIED           // 4: Certified by regulatory body
    }
    
    struct HealthcareEvent {
        bytes32 patientCommit;      // Commitment to patient identifier (no PHI)
        bytes32 recordCommit;       // Commitment to medical record
        bytes32 consentCommit;      // Commitment to consent data
        bytes32 providerCommit;     // Commitment to healthcare provider
        OperationType operation;    // Type of healthcare operation
        AssuranceLevel assurance;   // Assurance level
        uint256 timestamp;          // Block timestamp
        string evidenceUri;         // IPFS URI to evidence
        address indexedBy;          // Address that indexed this event
    }
    
    // Events
    event HealthcareEventAnchored(
        bytes32 indexed patientCommit,
        bytes32 indexed recordCommit,
        bytes32 indexed consentCommit,
        bytes32 providerCommit,
        OperationType operation,
        AssuranceLevel assurance,
        uint256 timestamp,
        string evidenceUri,
        address indexedBy
    );
    
    event ConsentGranted(
        bytes32 indexed patientCommit,
        bytes32 indexed consentCommit,
        address indexed provider,
        uint256 timestamp
    );
    
    event ConsentRevoked(
        bytes32 indexed patientCommit,
        bytes32 indexed consentCommit,
        address indexed provider,
        uint256 timestamp
    );
    
    event BreachReported(
        bytes32 indexed patientCommit,
        bytes32 indexed recordCommit,
        address indexed reporter,
        uint256 timestamp,
        string evidenceUri
    );
    
    // State variables
    mapping(bytes32 => bool) public consentStatus;  // patientCommit => hasConsent
    mapping(bytes32 => uint256) public lastAccess;  // recordCommit => last access time
    mapping(address => uint256) public providerActivity; // provider => activity count
    
    uint256 public totalEvents;
    uint256 public totalConsents;
    uint256 public totalBreaches;
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(HEALTHCARE_PROVIDER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Anchor a healthcare event to the blockchain
     * @param patientCommit Commitment to patient identifier
     * @param recordCommit Commitment to medical record
     * @param consentCommit Commitment to consent data
     * @param providerCommit Commitment to healthcare provider
     * @param operation Type of healthcare operation
     * @param assurance Assurance level
     * @param evidenceUri IPFS URI to evidence
     */
    function anchorHealthcareEvent(
        bytes32 patientCommit,
        bytes32 recordCommit,
        bytes32 consentCommit,
        bytes32 providerCommit,
        OperationType operation,
        AssuranceLevel assurance,
        string calldata evidenceUri
    ) external onlyRole(HEALTHCARE_PROVIDER_ROLE) whenNotPaused nonReentrant {
        require(patientCommit != bytes32(0), "Invalid patient commit");
        require(evidenceUri.length > 0, "Evidence URI required");
        
        // Update consent status based on operation
        if (operation == OperationType.CONSENT_GRANT) {
            consentStatus[patientCommit] = true;
            totalConsents++;
            emit ConsentGranted(patientCommit, consentCommit, msg.sender, block.timestamp);
        } else if (operation == OperationType.CONSENT_REVOKE) {
            consentStatus[patientCommit] = false;
            emit ConsentRevoked(patientCommit, consentCommit, msg.sender, block.timestamp);
        }
        
        // Track breach reports
        if (operation == OperationType.BREACH_REPORT) {
            totalBreaches++;
            emit BreachReported(patientCommit, recordCommit, msg.sender, block.timestamp, evidenceUri);
        }
        
        // Update access tracking
        if (operation == OperationType.ACCESS_LOG) {
            lastAccess[recordCommit] = block.timestamp;
        }
        
        // Update provider activity
        providerActivity[msg.sender]++;
        totalEvents++;
        
        emit HealthcareEventAnchored(
            patientCommit,
            recordCommit,
            consentCommit,
            providerCommit,
            operation,
            assurance,
            block.timestamp,
            evidenceUri,
            msg.sender
        );
    }
    
    /**
     * @dev Check if patient has given consent
     * @param patientCommit Commitment to patient identifier
     * @return hasConsent True if patient has given consent
     */
    function hasPatientConsent(bytes32 patientCommit) external view returns (bool hasConsent) {
        return consentStatus[patientCommit];
    }
    
    /**
     * @dev Get last access time for a record
     * @param recordCommit Commitment to medical record
     * @return lastAccessTime Timestamp of last access
     */
    function getLastAccessTime(bytes32 recordCommit) external view returns (uint256 lastAccessTime) {
        return lastAccess[recordCommit];
    }
    
    /**
     * @dev Get provider activity count
     * @param provider Provider address
     * @return activityCount Number of events indexed by provider
     */
    function getProviderActivity(address provider) external view returns (uint256 activityCount) {
        return providerActivity[provider];
    }
    
    /**
     * @dev Get contract statistics
     * @return events Total number of events
     * @return consents Total number of consents granted
     * @return breaches Total number of breaches reported
     */
    function getStats() external view returns (uint256 events, uint256 consents, uint256 breaches) {
        return (totalEvents, totalConsents, totalBreaches);
    }
    
    /**
     * @dev Pause contract in case of emergency
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Grant healthcare provider role
     * @param provider Provider address
     */
    function grantProviderRole(address provider) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(HEALTHCARE_PROVIDER_ROLE, provider);
    }
    
    /**
     * @dev Revoke healthcare provider role
     * @param provider Provider address
     */
    function revokeProviderRole(address provider) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(HEALTHCARE_PROVIDER_ROLE, provider);
    }
}
