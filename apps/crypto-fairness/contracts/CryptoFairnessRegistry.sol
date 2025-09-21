// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CryptoFairnessRegistry
/// @notice Manages crypto fairness attestations and evidence storage for the Null Protocol
/// @dev Integrates with Null Protocol's Canon Registry for immutable fairness records
contract CryptoFairnessRegistry is AccessControl, Ownable, ReentrancyGuard {
    bytes32 public constant ATTESTOR_ROLE = keccak256("ATTESTOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant NULL_PROTOCOL_ROLE = keccak256("NULL_PROTOCOL_ROLE");

    enum EventType {
        NFT_MINT,
        TOKEN_LAUNCH,
        AIRDROP,
        IDO,
        AUCTION
    }

    enum ViolationType {
        BOT_CONCENTRATION,
        MEV_FRONT_RUNNING,
        SANDWICH_ATTACK,
        BACKDOOR_ALLOWLIST,
        PREMINED_SUPPLY,
        SYBIL_ATTACK,
        TIMING_MANIPULATION,
        PRIVATE_RELAY_ABUSE
    }

    enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    enum FairnessScore {
        EXCELLENT,
        GOOD,
        FAIR,
        POOR
    }

    struct Violation {
        ViolationType violationType;
        Severity severity;
        string description;
        string evidenceUri; // IPFS URI
        uint256 confidence; // 0-100
        uint256 timestamp;
    }

    struct FairnessAnalysis {
        string eventId;
        EventType eventType;
        string chain;
        address contractAddress;
        uint256 startBlock;
        uint256 endBlock;
        uint256 totalSupply;
        uint256 totalParticipants;
        uint256 overallScore; // 0-100
        FairnessScore scoreCategory;
        Violation[] violations;
        string evidenceUri; // IPFS URI to full analysis
        uint256 analysisTimestamp;
    }

    struct Attestation {
        string attestationId;
        string eventId;
        FairnessAnalysis fairnessAnalysis;
        address attestor;
        uint256 attestationTimestamp;
        bytes signature;
        uint256 nullTokenPayment;
        string canonEntryUri; // IPFS URI to Canon Registry entry
        bool isVerified;
    }

    struct CanonEntry {
        bytes32 seal; // Cryptographic proof
        uint256 maskId; // Fairness Mask NFT ID
        string oblivionMarker; // Structured metadata
        uint256 inscribedAt;
        bool isActive;
    }

    // State variables
    mapping(string => Attestation) public attestations;
    mapping(string => CanonEntry) public canonEntries;
    mapping(address => uint256) public attestorReputation;
    mapping(string => bool) public isEventAttested;
    
    // Statistics
    uint256 public totalAttestations;
    uint256 public totalViolations;
    uint256 public totalEvents;
    
    // Events
    event AttestationCreated(
        string indexed attestationId,
        string indexed eventId,
        address indexed attestor,
        uint256 overallScore,
        uint256 violationCount
    );
    
    event AttestationVerified(
        string indexed attestationId,
        address indexed verifier,
        bool verified
    );
    
    event CanonEntryInscribed(
        string indexed eventId,
        bytes32 indexed seal,
        uint256 maskId,
        string oblivionMarker
    );
    
    event ViolationReported(
        string indexed eventId,
        ViolationType violationType,
        Severity severity,
        string evidenceUri
    );
    
    event AttestorReputationUpdated(
        address indexed attestor,
        uint256 oldReputation,
        uint256 newReputation
    );

    constructor(address admin) Ownable(admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ATTESTOR_ROLE, admin);
        _grantRole(AUDITOR_ROLE, admin);
        _grantRole(NULL_PROTOCOL_ROLE, admin);
    }

    /// @notice Grants the ATTESTOR_ROLE to an address
    function grantAttestorRole(address account) external onlyOwner {
        _grantRole(ATTESTOR_ROLE, account);
    }

    /// @notice Revokes the ATTESTOR_ROLE from an address
    function revokeAttestorRole(address account) external onlyOwner {
        _revokeRole(ATTESTOR_ROLE, account);
    }

    /// @notice Grants the AUDITOR_ROLE to an address
    function grantAuditorRole(address account) external onlyOwner {
        _grantRole(AUDITOR_ROLE, account);
    }

    /// @notice Revokes the AUDITOR_ROLE from an address
    function revokeAuditorRole(address account) external onlyOwner {
        _revokeRole(AUDITOR_ROLE, account);
    }

    /// @notice Creates a new fairness attestation
    /// @param attestationId Unique identifier for the attestation
    /// @param eventId Unique identifier for the event
    /// @param fairnessAnalysis The fairness analysis data
    /// @param signature Cryptographic signature of the attestation
    /// @param nullTokenPayment Amount of NULL tokens paid for attestation
    /// @param canonEntryUri IPFS URI to Canon Registry entry
    function createAttestation(
        string calldata attestationId,
        string calldata eventId,
        FairnessAnalysis calldata fairnessAnalysis,
        bytes calldata signature,
        uint256 nullTokenPayment,
        string calldata canonEntryUri
    ) external onlyRole(ATTESTOR_ROLE) nonReentrant {
        require(!isEventAttested[eventId], "Event already attested");
        require(bytes(attestationId).length > 0, "Attestation ID required");
        require(bytes(eventId).length > 0, "Event ID required");
        require(fairnessAnalysis.overallScore <= 100, "Invalid score");
        require(nullTokenPayment > 0, "NULL token payment required");

        // Create attestation
        Attestation storage attestation = attestations[attestationId];
        attestation.attestationId = attestationId;
        attestation.eventId = eventId;
        attestation.fairnessAnalysis = fairnessAnalysis;
        attestation.attestor = msg.sender;
        attestation.attestationTimestamp = block.timestamp;
        attestation.signature = signature;
        attestation.nullTokenPayment = nullTokenPayment;
        attestation.canonEntryUri = canonEntryUri;
        attestation.isVerified = false;

        // Mark event as attested
        isEventAttested[eventId] = true;

        // Update statistics
        totalAttestations++;
        totalEvents++;
        totalViolations += fairnessAnalysis.violations.length;

        // Update attestor reputation
        uint256 reputationIncrease = calculateReputationIncrease(fairnessAnalysis);
        attestorReputation[msg.sender] += reputationIncrease;

        emit AttestationCreated(
            attestationId,
            eventId,
            msg.sender,
            fairnessAnalysis.overallScore,
            fairnessAnalysis.violations.length
        );

        // Emit violation events
        for (uint256 i = 0; i < fairnessAnalysis.violations.length; i++) {
            Violation memory violation = fairnessAnalysis.violations[i];
            emit ViolationReported(
                eventId,
                violation.violationType,
                violation.severity,
                violation.evidenceUri
            );
        }
    }

    /// @notice Verifies an attestation
    /// @param attestationId The attestation to verify
    /// @param verified Whether the attestation is verified
    function verifyAttestation(
        string calldata attestationId,
        bool verified
    ) external onlyRole(AUDITOR_ROLE) {
        Attestation storage attestation = attestations[attestationId];
        require(bytes(attestation.attestationId).length > 0, "Attestation not found");

        attestation.isVerified = verified;

        emit AttestationVerified(attestationId, msg.sender, verified);
    }

    /// @notice Inscribes a Canon entry for an event
    /// @param eventId The event to inscribe
    /// @param seal Cryptographic proof of the analysis
    /// @param maskId Fairness Mask NFT ID
    /// @param oblivionMarker Structured metadata
    function inscribeCanonEntry(
        string calldata eventId,
        bytes32 seal,
        uint256 maskId,
        string calldata oblivionMarker
    ) external onlyRole(NULL_PROTOCOL_ROLE) {
        require(isEventAttested[eventId], "Event not attested");
        require(seal != bytes32(0), "Invalid seal");
        require(maskId > 0, "Invalid mask ID");

        CanonEntry storage entry = canonEntries[eventId];
        entry.seal = seal;
        entry.maskId = maskId;
        entry.oblivionMarker = oblivionMarker;
        entry.inscribedAt = block.timestamp;
        entry.isActive = true;

        emit CanonEntryInscribed(eventId, seal, maskId, oblivionMarker);
    }

    /// @notice Gets an attestation by ID
    function getAttestation(string calldata attestationId) external view returns (Attestation memory) {
        return attestations[attestationId];
    }

    /// @notice Gets a Canon entry by event ID
    function getCanonEntry(string calldata eventId) external view returns (CanonEntry memory) {
        return canonEntries[eventId];
    }

    /// @notice Gets attestor reputation
    function getAttestorReputation(address attestor) external view returns (uint256) {
        return attestorReputation[attestor];
    }

    /// @notice Checks if an event has been attested
    function isEventAttestedCheck(string calldata eventId) external view returns (bool) {
        return isEventAttested[eventId];
    }

    /// @notice Gets registry statistics
    function getRegistryStats() external view returns (
        uint256 _totalAttestations,
        uint256 _totalViolations,
        uint256 _totalEvents
    ) {
        return (totalAttestations, totalViolations, totalEvents);
    }

    /// @notice Calculates reputation increase based on analysis quality
    function calculateReputationIncrease(FairnessAnalysis memory analysis) internal pure returns (uint256) {
        uint256 baseReputation = 10;
        uint256 scoreBonus = analysis.overallScore / 10; // 0-10 bonus based on score
        uint256 violationPenalty = analysis.violations.length * 2; // Penalty for violations
        
        if (scoreBonus > violationPenalty) {
            return baseReputation + scoreBonus - violationPenalty;
        } else {
            return baseReputation;
        }
    }

    /// @notice Updates attestor reputation (admin only)
    function updateAttestorReputation(
        address attestor,
        uint256 newReputation
    ) external onlyOwner {
        uint256 oldReputation = attestorReputation[attestor];
        attestorReputation[attestor] = newReputation;
        
        emit AttestorReputationUpdated(attestor, oldReputation, newReputation);
    }
}
