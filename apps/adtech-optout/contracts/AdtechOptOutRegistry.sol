// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AdtechOptOutRegistry
 * @dev Smart contract for managing adtech opt-outs and violation tracking
 * @notice This contract manages consumer opt-outs, ad network compliance, and violation reporting
 */
contract AdtechOptOutRegistry is Ownable, ReentrancyGuard {
    
    enum OptOutType {
        NAI,                    // 0: Network Advertising Initiative
        DAA,                    // 1: Digital Advertising Alliance
        GPC,                    // 2: Global Privacy Control
        CCPA,                   // 3: California Consumer Privacy Act
        GDPR,                   // 4: General Data Protection Regulation
        CUSTOM                  // 5: Custom opt-out
    }
    
    enum OptOutStatus {
        ACTIVE,                 // 0: Opt-out is active
        PENDING,                // 1: Opt-out is pending verification
        VERIFIED,               // 2: Opt-out is verified and enforced
        VIOLATED,               // 3: Opt-out has been violated
        REVOKED                 // 4: Opt-out has been revoked
    }
    
    struct ConsumerOptOut {
        bytes32 consumerId;     // Privacy-preserving consumer identifier
        OptOutType optOutType;  // Type of opt-out
        OptOutStatus status;    // Current status
        uint256 createdAt;      // Creation timestamp
        uint256 verifiedAt;     // Verification timestamp
        uint256 expiresAt;      // Expiration timestamp
        string evidenceUri;     // IPFS URI to opt-out evidence
        address verifier;       // Address that verified the opt-out
    }
    
    struct AdNetwork {
        string name;            // Ad network name
        string domain;          // Primary domain
        bool compliant;         // Whether network is compliant
        uint256 violations;     // Number of violations
        uint256 lastViolation;  // Timestamp of last violation
        bool blacklisted;       // Whether network is blacklisted
        uint256 registeredAt;   // Registration timestamp
    }
    
    struct ViolationReport {
        bytes32 reportId;       // Unique report identifier
        bytes32 consumerId;     // Consumer identifier
        string adNetwork;       // Ad network that violated
        string violationType;   // Type of violation
        string evidenceUri;     // IPFS URI to violation evidence
        uint256 reportedAt;     // Report timestamp
        bool verified;          // Whether violation is verified
        uint256 penalty;        // Penalty amount
        address verifiedBy;     // Address that verified violation
    }
    
    // State variables
    mapping(bytes32 => ConsumerOptOut[]) public consumerOptOuts;
    mapping(string => AdNetwork) public adNetworks;
    mapping(bytes32 => ViolationReport) public violationReports;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => bool) public authorizedReporters;
    
    // Statistics
    uint256 public totalOptOuts;
    uint256 public totalViolations;
    uint256 public totalPenalties;
    uint256 public totalNetworks;
    
    // Events
    event OptOutRegistered(
        bytes32 indexed consumerId,
        OptOutType optOutType,
        string evidenceUri,
        uint256 createdAt
    );
    
    event OptOutVerified(
        bytes32 indexed consumerId,
        OptOutType optOutType,
        address indexed verifier,
        uint256 verifiedAt
    );
    
    event OptOutViolated(
        bytes32 indexed consumerId,
        OptOutType optOutType,
        string adNetwork,
        uint256 violatedAt
    );
    
    event ViolationReported(
        bytes32 indexed reportId,
        bytes32 indexed consumerId,
        string adNetwork,
        string violationType,
        string evidenceUri
    );
    
    event ViolationVerified(
        bytes32 indexed reportId,
        bytes32 indexed consumerId,
        string adNetwork,
        uint256 penalty,
        bool blacklisted
    );
    
    event AdNetworkRegistered(
        string indexed networkName,
        string domain,
        bool compliant,
        uint256 registeredAt
    );
    
    event AdNetworkBlacklisted(
        string indexed networkName,
        string reason,
        uint256 blacklistedAt
    );
    
    event VerifierAuthorized(address indexed verifier, bool authorized);
    event ReporterAuthorized(address indexed reporter, bool authorized);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Register a consumer opt-out
     * @param consumerId Privacy-preserving consumer identifier
     * @param optOutType Type of opt-out
     * @param evidenceUri IPFS URI to opt-out evidence
     * @param expiresAt Expiration timestamp (0 for permanent)
     * @return optOutId Unique opt-out identifier
     */
    function registerOptOut(
        bytes32 consumerId,
        OptOutType optOutType,
        string calldata evidenceUri,
        uint256 expiresAt
    ) external returns (bytes32) {
        require(consumerId != bytes32(0), "Invalid consumer ID");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        require(expiresAt == 0 || expiresAt > block.timestamp, "Invalid expiration time");
        
        // Generate unique opt-out ID
        bytes32 optOutId = keccak256(abi.encodePacked(
            consumerId,
            optOutType,
            block.timestamp,
            msg.sender
        ));
        
        // Create consumer opt-out
        ConsumerOptOut memory optOut = ConsumerOptOut({
            consumerId: consumerId,
            optOutType: optOutType,
            status: OptOutStatus.PENDING,
            createdAt: block.timestamp,
            verifiedAt: 0,
            expiresAt: expiresAt,
            evidenceUri: evidenceUri,
            verifier: address(0)
        });
        
        consumerOptOuts[consumerId].push(optOut);
        totalOptOuts++;
        
        emit OptOutRegistered(consumerId, optOutType, evidenceUri, block.timestamp);
        
        return optOutId;
    }
    
    /**
     * @dev Verify a consumer opt-out
     * @param consumerId Consumer identifier
     * @param optOutIndex Index of opt-out in consumer's opt-outs
     */
    function verifyOptOut(
        bytes32 consumerId,
        uint256 optOutIndex
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(optOutIndex < consumerOptOuts[consumerId].length, "Invalid opt-out index");
        
        ConsumerOptOut storage optOut = consumerOptOuts[consumerId][optOutIndex];
        require(optOut.status == OptOutStatus.PENDING, "Opt-out not pending");
        require(optOut.expiresAt == 0 || optOut.expiresAt > block.timestamp, "Opt-out expired");
        
        optOut.status = OptOutStatus.VERIFIED;
        optOut.verifiedAt = block.timestamp;
        optOut.verifier = msg.sender;
        
        emit OptOutVerified(consumerId, optOut.optOutType, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Report a violation of an opt-out
     * @param consumerId Consumer identifier
     * @param adNetwork Ad network that violated
     * @param violationType Type of violation
     * @param evidenceUri IPFS URI to violation evidence
     * @return reportId Unique report identifier
     */
    function reportViolation(
        bytes32 consumerId,
        string calldata adNetwork,
        string calldata violationType,
        string calldata evidenceUri
    ) external returns (bytes32) {
        require(consumerId != bytes32(0), "Invalid consumer ID");
        require(bytes(adNetwork).length > 0, "Ad network required");
        require(bytes(violationType).length > 0, "Violation type required");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        
        // Generate unique report ID
        bytes32 reportId = keccak256(abi.encodePacked(
            consumerId,
            adNetwork,
            violationType,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure report doesn't already exist
        require(violationReports[reportId].reportId == bytes32(0), "Report already exists");
        
        // Create violation report
        ViolationReport memory report = ViolationReport({
            reportId: reportId,
            consumerId: consumerId,
            adNetwork: adNetwork,
            violationType: violationType,
            evidenceUri: evidenceUri,
            reportedAt: block.timestamp,
            verified: false,
            penalty: 0,
            verifiedBy: address(0)
        });
        
        violationReports[reportId] = report;
        totalViolations++;
        
        emit ViolationReported(reportId, consumerId, adNetwork, violationType, evidenceUri);
        
        return reportId;
    }
    
    /**
     * @dev Verify a violation report
     * @param reportId Report identifier
     * @param penalty Penalty amount
     * @param blacklist Whether to blacklist the network
     */
    function verifyViolation(
        bytes32 reportId,
        uint256 penalty,
        bool blacklist
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(violationReports[reportId].reportId != bytes32(0), "Report not found");
        require(!violationReports[reportId].verified, "Report already verified");
        
        ViolationReport storage report = violationReports[reportId];
        report.verified = true;
        report.penalty = penalty;
        report.verifiedBy = msg.sender;
        
        // Update ad network violation count
        AdNetwork storage network = adNetworks[report.adNetwork];
        if (network.name == "") {
            // Register network if not exists
            network.name = report.adNetwork;
            network.domain = "";
            network.compliant = false;
            network.violations = 1;
            network.lastViolation = block.timestamp;
            network.blacklisted = blacklist;
            network.registeredAt = block.timestamp;
            totalNetworks++;
            
            emit AdNetworkRegistered(report.adNetwork, "", false, block.timestamp);
        } else {
            network.violations++;
            network.lastViolation = block.timestamp;
            network.blacklisted = blacklist;
        }
        
        totalPenalties += penalty;
        
        // Mark consumer opt-outs as violated
        ConsumerOptOut[] storage optOuts = consumerOptOuts[report.consumerId];
        for (uint256 i = 0; i < optOuts.length; i++) {
            if (optOuts[i].status == OptOutStatus.VERIFIED) {
                optOuts[i].status = OptOutStatus.VIOLATED;
                emit OptOutViolated(report.consumerId, optOuts[i].optOutType, report.adNetwork, block.timestamp);
            }
        }
        
        emit ViolationVerified(reportId, report.consumerId, report.adNetwork, penalty, blacklist);
        
        if (blacklist) {
            emit AdNetworkBlacklisted(report.adNetwork, report.violationType, block.timestamp);
        }
    }
    
    /**
     * @dev Register an ad network
     * @param networkName Network name
     * @param domain Primary domain
     * @param compliant Whether network is initially compliant
     */
    function registerAdNetwork(
        string calldata networkName,
        string calldata domain,
        bool compliant
    ) external {
        require(bytes(networkName).length > 0, "Network name required");
        require(adNetworks[networkName].name == "", "Network already registered");
        
        adNetworks[networkName] = AdNetwork({
            name: networkName,
            domain: domain,
            compliant: compliant,
            violations: 0,
            lastViolation: 0,
            blacklisted: false,
            registeredAt: block.timestamp
        });
        
        totalNetworks++;
        
        emit AdNetworkRegistered(networkName, domain, compliant, block.timestamp);
    }
    
    /**
     * @dev Update ad network compliance status
     * @param networkName Network name
     * @param compliant Whether network is compliant
     */
    function updateNetworkCompliance(
        string calldata networkName,
        bool compliant
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(adNetworks[networkName].name != "", "Network not found");
        
        adNetworks[networkName].compliant = compliant;
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
     * @dev Authorize a reporter
     * @param reporter Reporter address
     * @param authorized Whether to authorize or revoke
     */
    function setReporterAuthorization(address reporter, bool authorized) external onlyOwner {
        authorizedReporters[reporter] = authorized;
        emit ReporterAuthorized(reporter, authorized);
    }
    
    /**
     * @dev Get consumer opt-outs
     * @param consumerId Consumer identifier
     * @return optOuts Array of consumer opt-outs
     */
    function getConsumerOptOuts(bytes32 consumerId) external view returns (ConsumerOptOut[] memory optOuts) {
        return consumerOptOuts[consumerId];
    }
    
    /**
     * @dev Get violation report
     * @param reportId Report identifier
     * @return report Violation report information
     */
    function getViolationReport(bytes32 reportId) external view returns (ViolationReport memory report) {
        return violationReports[reportId];
    }
    
    /**
     * @dev Get ad network information
     * @param networkName Network name
     * @return network Ad network information
     */
    function getAdNetwork(string calldata networkName) external view returns (AdNetwork memory network) {
        return adNetworks[networkName];
    }
    
    /**
     * @dev Get contract statistics
     * @return optOuts Total number of opt-outs
     * @return violations Total number of violations
     * @return penalties Total penalties
     * @return networks Total number of networks
     */
    function getStats() external view returns (uint256 optOuts, uint256 violations, uint256 penalties, uint256 networks) {
        return (totalOptOuts, totalViolations, totalPenalties, totalNetworks);
    }
    
    /**
     * @dev Check if consumer has active opt-out
     * @param consumerId Consumer identifier
     * @param optOutType Opt-out type to check
     * @return hasOptOut Whether consumer has active opt-out
     */
    function hasActiveOptOut(bytes32 consumerId, OptOutType optOutType) external view returns (bool hasOptOut) {
        ConsumerOptOut[] memory optOuts = consumerOptOuts[consumerId];
        for (uint256 i = 0; i < optOuts.length; i++) {
            if (optOuts[i].optOutType == optOutType && 
                (optOuts[i].status == OptOutStatus.VERIFIED || optOuts[i].status == OptOutStatus.ACTIVE) &&
                (optOuts[i].expiresAt == 0 || optOuts[i].expiresAt > block.timestamp)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Convert OptOutType enum to string
     * @param optOutType Opt-out type enum
     * @return String representation of opt-out type
     */
    function optOutTypeToString(OptOutType optOutType) external pure returns (string memory) {
        if (optOutType == OptOutType.NAI) return "nai";
        if (optOutType == OptOutType.DAA) return "daa";
        if (optOutType == OptOutType.GPC) return "gpc";
        if (optOutType == OptOutType.CCPA) return "ccpa";
        if (optOutType == OptOutType.GDPR) return "gdpr";
        if (optOutType == OptOutType.CUSTOM) return "custom";
        return "unknown";
    }
    
    /**
     * @dev Convert OptOutStatus enum to string
     * @param status Opt-out status enum
     * @return String representation of status
     */
    function optOutStatusToString(OptOutStatus status) external pure returns (string memory) {
        if (status == OptOutStatus.ACTIVE) return "active";
        if (status == OptOutStatus.PENDING) return "pending";
        if (status == OptOutStatus.VERIFIED) return "verified";
        if (status == OptOutStatus.VIOLATED) return "violated";
        if (status == OptOutStatus.REVOKED) return "revoked";
        return "unknown";
    }
}
