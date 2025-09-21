// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ComplianceMonitoring
 * @dev Smart contract for monitoring adtech compliance and detecting violations
 * @notice This contract manages monitoring rules, sessions, and compliance scoring
 */
contract ComplianceMonitoring is Ownable, ReentrancyGuard {
    
    enum MonitoringStatus {
        ACTIVE,                 // 0: Monitoring is active
        PAUSED,                 // 1: Monitoring is paused
        VIOLATION_DETECTED,     // 2: Violation detected
        INVESTIGATING,          // 3: Under investigation
        RESOLVED                // 4: Violation resolved
    }
    
    struct MonitoringRule {
        bytes32 ruleId;         // Rule identifier
        string ruleName;        // Human-readable rule name
        string description;     // Rule description
        bool active;            // Whether rule is active
        uint256 penalty;        // Penalty for violation
        uint256 createdAt;      // Creation timestamp
        address createdBy;      // Address that created the rule
    }
    
    struct MonitoringSession {
        bytes32 sessionId;      // Session identifier
        bytes32 consumerId;     // Consumer identifier
        string adNetwork;       // Ad network being monitored
        MonitoringStatus status; // Current status
        uint256 startedAt;      // Start timestamp
        uint256 endedAt;        // End timestamp
        string evidenceUri;     // IPFS URI to monitoring evidence
        bool violationDetected; // Whether violation was detected
        string violationType;   // Type of violation detected
    }
    
    struct ComplianceScore {
        string adNetwork;       // Ad network name
        uint256 score;          // Compliance score (0-100)
        uint256 totalChecks;    // Total compliance checks
        uint256 violations;     // Number of violations
        uint256 lastCheck;      // Last check timestamp
        bool certified;         // Whether network is certified compliant
        uint256 certificationExpiry; // Certification expiry timestamp
    }
    
    struct ViolationDetection {
        bytes32 detectionId;    // Detection identifier
        bytes32 sessionId;      // Associated session ID
        string violationType;   // Type of violation
        string description;     // Violation description
        string evidenceUri;     // IPFS URI to evidence
        uint256 detectedAt;     // Detection timestamp
        bool verified;          // Whether detection is verified
        uint256 severity;       // Severity level (1-10)
    }
    
    // State variables
    mapping(bytes32 => MonitoringRule) public monitoringRules;
    mapping(bytes32 => MonitoringSession) public monitoringSessions;
    mapping(string => ComplianceScore) public complianceScores;
    mapping(bytes32 => ViolationDetection) public violationDetections;
    mapping(address => bool) public authorizedMonitors;
    mapping(address => bool) public authorizedInvestigators;
    
    // Statistics
    uint256 public totalRules;
    uint256 public totalSessions;
    uint256 public totalViolations;
    uint256 public totalDetections;
    
    // Events
    event MonitoringRuleCreated(
        bytes32 indexed ruleId,
        string ruleName,
        string description,
        uint256 penalty,
        address indexed createdBy
    );
    
    event MonitoringSessionStarted(
        bytes32 indexed sessionId,
        bytes32 indexed consumerId,
        string adNetwork,
        uint256 startedAt
    );
    
    event MonitoringSessionEnded(
        bytes32 indexed sessionId,
        bytes32 indexed consumerId,
        string adNetwork,
        bool violationDetected,
        uint256 endedAt
    );
    
    event ViolationDetected(
        bytes32 indexed detectionId,
        bytes32 indexed sessionId,
        bytes32 indexed consumerId,
        string adNetwork,
        string violationType,
        string evidenceUri
    );
    
    event ViolationVerified(
        bytes32 indexed detectionId,
        bytes32 indexed sessionId,
        string adNetwork,
        uint256 severity,
        bool verified
    );
    
    event ComplianceScoreUpdated(
        string indexed adNetwork,
        uint256 score,
        uint256 violations,
        bool certified,
        uint256 lastCheck
    );
    
    event NetworkCertified(
        string indexed adNetwork,
        uint256 certificationExpiry,
        uint256 certifiedAt
    );
    
    event MonitorAuthorized(address indexed monitor, bool authorized);
    event InvestigatorAuthorized(address indexed investigator, bool authorized);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a monitoring rule
     * @param ruleName Human-readable rule name
     * @param description Rule description
     * @param penalty Penalty for violation
     * @return ruleId Unique rule identifier
     */
    function createMonitoringRule(
        string calldata ruleName,
        string calldata description,
        uint256 penalty
    ) external returns (bytes32) {
        require(bytes(ruleName).length > 0, "Rule name required");
        require(bytes(description).length > 0, "Rule description required");
        require(penalty > 0, "Penalty must be greater than 0");
        
        // Generate unique rule ID
        bytes32 ruleId = keccak256(abi.encodePacked(
            ruleName,
            description,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure rule doesn't already exist
        require(monitoringRules[ruleId].ruleId == bytes32(0), "Rule already exists");
        
        // Create monitoring rule
        MonitoringRule memory rule = MonitoringRule({
            ruleId: ruleId,
            ruleName: ruleName,
            description: description,
            active: true,
            penalty: penalty,
            createdAt: block.timestamp,
            createdBy: msg.sender
        });
        
        monitoringRules[ruleId] = rule;
        totalRules++;
        
        emit MonitoringRuleCreated(ruleId, ruleName, description, penalty, msg.sender);
        
        return ruleId;
    }
    
    /**
     * @dev Start a monitoring session
     * @param consumerId Consumer identifier
     * @param adNetwork Ad network to monitor
     * @return sessionId Unique session identifier
     */
    function startMonitoringSession(
        bytes32 consumerId,
        string calldata adNetwork
    ) external returns (bytes32) {
        require(authorizedMonitors[msg.sender], "Not authorized monitor");
        require(consumerId != bytes32(0), "Invalid consumer ID");
        require(bytes(adNetwork).length > 0, "Ad network required");
        
        // Generate unique session ID
        bytes32 sessionId = keccak256(abi.encodePacked(
            consumerId,
            adNetwork,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure session doesn't already exist
        require(monitoringSessions[sessionId].sessionId == bytes32(0), "Session already exists");
        
        // Create monitoring session
        MonitoringSession memory session = MonitoringSession({
            sessionId: sessionId,
            consumerId: consumerId,
            adNetwork: adNetwork,
            status: MonitoringStatus.ACTIVE,
            startedAt: block.timestamp,
            endedAt: 0,
            evidenceUri: "",
            violationDetected: false,
            violationType: ""
        });
        
        monitoringSessions[sessionId] = session;
        totalSessions++;
        
        emit MonitoringSessionStarted(sessionId, consumerId, adNetwork, block.timestamp);
        
        return sessionId;
    }
    
    /**
     * @dev End a monitoring session
     * @param sessionId Session identifier
     * @param violationDetected Whether violation was detected
     * @param violationType Type of violation (if any)
     * @param evidenceUri IPFS URI to monitoring evidence
     */
    function endMonitoringSession(
        bytes32 sessionId,
        bool violationDetected,
        string calldata violationType,
        string calldata evidenceUri
    ) external {
        require(authorizedMonitors[msg.sender], "Not authorized monitor");
        require(monitoringSessions[sessionId].sessionId != bytes32(0), "Session not found");
        require(monitoringSessions[sessionId].status == MonitoringStatus.ACTIVE, "Session not active");
        
        MonitoringSession storage session = monitoringSessions[sessionId];
        session.status = violationDetected ? MonitoringStatus.VIOLATION_DETECTED : MonitoringStatus.RESOLVED;
        session.endedAt = block.timestamp;
        session.violationDetected = violationDetected;
        session.violationType = violationType;
        session.evidenceUri = evidenceUri;
        
        if (violationDetected) {
            totalViolations++;
        }
        
        emit MonitoringSessionEnded(sessionId, session.consumerId, session.adNetwork, violationDetected, block.timestamp);
    }
    
    /**
     * @dev Detect a violation during monitoring
     * @param sessionId Session identifier
     * @param violationType Type of violation
     * @param description Violation description
     * @param evidenceUri IPFS URI to violation evidence
     * @param severity Severity level (1-10)
     * @return detectionId Unique detection identifier
     */
    function detectViolation(
        bytes32 sessionId,
        string calldata violationType,
        string calldata description,
        string calldata evidenceUri,
        uint256 severity
    ) external returns (bytes32) {
        require(authorizedMonitors[msg.sender], "Not authorized monitor");
        require(monitoringSessions[sessionId].sessionId != bytes32(0), "Session not found");
        require(bytes(violationType).length > 0, "Violation type required");
        require(bytes(description).length > 0, "Violation description required");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        require(severity >= 1 && severity <= 10, "Invalid severity level");
        
        // Generate unique detection ID
        bytes32 detectionId = keccak256(abi.encodePacked(
            sessionId,
            violationType,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure detection doesn't already exist
        require(violationDetections[detectionId].detectionId == bytes32(0), "Detection already exists");
        
        // Create violation detection
        ViolationDetection memory detection = ViolationDetection({
            detectionId: detectionId,
            sessionId: sessionId,
            violationType: violationType,
            description: description,
            evidenceUri: evidenceUri,
            detectedAt: block.timestamp,
            verified: false,
            severity: severity
        });
        
        violationDetections[detectionId] = detection;
        totalDetections++;
        
        // Update session status
        monitoringSessions[sessionId].status = MonitoringStatus.VIOLATION_DETECTED;
        monitoringSessions[sessionId].violationDetected = true;
        monitoringSessions[sessionId].violationType = violationType;
        
        emit ViolationDetected(
            detectionId,
            sessionId,
            monitoringSessions[sessionId].consumerId,
            monitoringSessions[sessionId].adNetwork,
            violationType,
            evidenceUri
        );
        
        return detectionId;
    }
    
    /**
     * @dev Verify a violation detection
     * @param detectionId Detection identifier
     * @param verified Whether detection is verified
     */
    function verifyViolationDetection(
        bytes32 detectionId,
        bool verified
    ) external {
        require(authorizedInvestigators[msg.sender], "Not authorized investigator");
        require(violationDetections[detectionId].detectionId != bytes32(0), "Detection not found");
        
        ViolationDetection storage detection = violationDetections[detectionId];
        detection.verified = verified;
        
        if (verified) {
            // Update compliance score
            MonitoringSession memory session = monitoringSessions[detection.sessionId];
            ComplianceScore storage score = complianceScores[session.adNetwork];
            
            if (score.adNetwork == "") {
                // Initialize compliance score
                score.adNetwork = session.adNetwork;
                score.score = 100;
                score.totalChecks = 0;
                score.violations = 0;
                score.lastCheck = block.timestamp;
                score.certified = false;
                score.certificationExpiry = 0;
            }
            
            score.totalChecks++;
            score.violations++;
            score.lastCheck = block.timestamp;
            
            // Calculate new score (penalty for violations)
            uint256 penalty = (detection.severity * 10); // 10-100 point penalty
            if (score.score > penalty) {
                score.score -= penalty;
            } else {
                score.score = 0;
            }
            
            // Revoke certification if score drops below threshold
            if (score.score < 70) {
                score.certified = false;
                score.certificationExpiry = 0;
            }
            
            emit ComplianceScoreUpdated(
                session.adNetwork,
                score.score,
                score.violations,
                score.certified,
                block.timestamp
            );
        }
        
        emit ViolationVerified(detectionId, detection.sessionId, monitoringSessions[detection.sessionId].adNetwork, detection.severity, verified);
    }
    
    /**
     * @dev Update compliance score manually
     * @param adNetwork Ad network name
     * @param score New compliance score
     * @param violations Number of violations
     * @param certified Whether network is certified
     */
    function updateComplianceScore(
        string calldata adNetwork,
        uint256 score,
        uint256 violations,
        bool certified
    ) external {
        require(authorizedInvestigators[msg.sender], "Not authorized investigator");
        require(bytes(adNetwork).length > 0, "Ad network required");
        require(score <= 100, "Score cannot exceed 100");
        
        ComplianceScore storage complianceScore = complianceScores[adNetwork];
        complianceScore.adNetwork = adNetwork;
        complianceScore.score = score;
        complianceScore.violations = violations;
        complianceScore.lastCheck = block.timestamp;
        complianceScore.certified = certified;
        
        if (certified) {
            complianceScore.certificationExpiry = block.timestamp + 365 days; // 1 year certification
        } else {
            complianceScore.certificationExpiry = 0;
        }
        
        emit ComplianceScoreUpdated(adNetwork, score, violations, certified, block.timestamp);
        
        if (certified) {
            emit NetworkCertified(adNetwork, complianceScore.certificationExpiry, block.timestamp);
        }
    }
    
    /**
     * @dev Authorize a monitor
     * @param monitor Monitor address
     * @param authorized Whether to authorize or revoke
     */
    function setMonitorAuthorization(address monitor, bool authorized) external onlyOwner {
        authorizedMonitors[monitor] = authorized;
        emit MonitorAuthorized(monitor, authorized);
    }
    
    /**
     * @dev Authorize an investigator
     * @param investigator Investigator address
     * @param authorized Whether to authorize or revoke
     */
    function setInvestigatorAuthorization(address investigator, bool authorized) external onlyOwner {
        authorizedInvestigators[investigator] = authorized;
        emit InvestigatorAuthorized(investigator, authorized);
    }
    
    /**
     * @dev Get monitoring rule
     * @param ruleId Rule identifier
     * @return rule Monitoring rule information
     */
    function getMonitoringRule(bytes32 ruleId) external view returns (MonitoringRule memory rule) {
        return monitoringRules[ruleId];
    }
    
    /**
     * @dev Get monitoring session
     * @param sessionId Session identifier
     * @return session Monitoring session information
     */
    function getMonitoringSession(bytes32 sessionId) external view returns (MonitoringSession memory session) {
        return monitoringSessions[sessionId];
    }
    
    /**
     * @dev Get compliance score
     * @param adNetwork Ad network name
     * @return score Compliance score information
     */
    function getComplianceScore(string calldata adNetwork) external view returns (ComplianceScore memory score) {
        return complianceScores[adNetwork];
    }
    
    /**
     * @dev Get violation detection
     * @param detectionId Detection identifier
     * @return detection Violation detection information
     */
    function getViolationDetection(bytes32 detectionId) external view returns (ViolationDetection memory detection) {
        return violationDetections[detectionId];
    }
    
    /**
     * @dev Get contract statistics
     * @return rules Total number of rules
     * @return sessions Total number of sessions
     * @return violations Total number of violations
     * @return detections Total number of detections
     */
    function getStats() external view returns (uint256 rules, uint256 sessions, uint256 violations, uint256 detections) {
        return (totalRules, totalSessions, totalViolations, totalDetections);
    }
    
    /**
     * @dev Convert MonitoringStatus enum to string
     * @param status Monitoring status enum
     * @return String representation of status
     */
    function monitoringStatusToString(MonitoringStatus status) external pure returns (string memory) {
        if (status == MonitoringStatus.ACTIVE) return "active";
        if (status == MonitoringStatus.PAUSED) return "paused";
        if (status == MonitoringStatus.VIOLATION_DETECTED) return "violation_detected";
        if (status == MonitoringStatus.INVESTIGATING) return "investigating";
        if (status == MonitoringStatus.RESOLVED) return "resolved";
        return "unknown";
    }
}
