// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title CanonRegistry
 * @dev Append-only ledger for closure events with privacy-preserving and gas-optimized design
 * @author Null Foundation
 */
contract CanonRegistry is AccessControl, ReentrancyGuard, Pausable {
    using Address for address;

    // Roles
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // Custom errors
    error InvalidAssuranceLevel(uint8 assurance);
    error InsufficientFee(uint256 provided, uint256 required);
    error NoBalance();
    error ZeroAddress();
    error InvalidTreasuryAddress();

    // Events
    event Anchored(
        bytes32 indexed warrantDigest,
        bytes32 indexed attestationDigest,
        address indexed relayer,
        bytes32 subjectTag,           // HMAC-based privacy-preserving tag
        bytes32 controllerDidHash,    // Hash instead of string for gas optimization
        uint8 assurance,              // Assurance level (0-2)
        uint256 timestamp
    );

    // Legacy events for backward compatibility (deprecated)
    event WarrantAnchored(
        bytes32 indexed warrantHash,
        bytes32 indexed subjectHandleHash,
        bytes32 indexed enterpriseHash,
        string  enterpriseId,
        string  warrantId,
        address submitter,
        uint256 ts
    );

    event AttestationAnchored(
        bytes32 indexed attestationHash,
        bytes32 indexed warrantHash,
        bytes32 indexed enterpriseHash,
        string  enterpriseId,
        string  attestationId,
        address submitter,
        uint256 ts
    );

    event ReceiptAnchored(
        bytes32 indexed receiptHash,
        bytes32 indexed warrantHash,
        bytes32 indexed attestationHash,
        address subjectWallet,
        address submitter,
        uint256 ts
    );

    // Storage
    mapping(bytes32 => uint256) private _lastAnchor;
    mapping(address => uint256) public balances;
    
    // Fee configuration
    uint256 public constant FEE_DENOMINATOR = 13;
    uint256 public constant FOUNDATION_FEE = 1; // 1/13 to Foundation
    uint256 public constant IMPLEMENTER_FEE = 12; // 12/13 to implementer
    
    uint256 public baseFee = 0.001 ether; // Base fee in ETH
    address public foundationTreasury;
    address public implementerTreasury;

    // Statistics
    uint256 public totalAnchors;
    uint256 public totalFeesCollected;

    constructor(
        address _foundationTreasury,
        address _implementerTreasury,
        address _admin
    ) {
        if (_foundationTreasury == address(0)) {
            revert ZeroAddress();
        }
        if (_implementerTreasury == address(0)) {
            revert ZeroAddress();
        }
        if (_admin == address(0)) {
            revert ZeroAddress();
        }
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(RELAYER_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _foundationTreasury);
        _grantRole(TREASURY_ROLE, _implementerTreasury);
        
        foundationTreasury = _foundationTreasury;
        implementerTreasury = _implementerTreasury;
    }

    /**
     * @dev Anchor a closure event with privacy-preserving design
     * @param warrantDigest Hash of the warrant
     * @param attestationDigest Hash of the attestation
     * @param subjectTag HMAC-based privacy-preserving tag
     * @param controllerDidHash Hash of controller DID
     * @param assurance Assurance level (0-2)
     */
    function anchor(
        bytes32 warrantDigest,
        bytes32 attestationDigest,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance
    ) external payable onlyRole(RELAYER_ROLE) whenNotPaused nonReentrant {
        if (assurance > 2) {
            revert InvalidAssuranceLevel(assurance);
        }
        if (msg.value < baseFee) {
            revert InsufficientFee(msg.value, baseFee);
        }
        
        // Record the anchor
        _lastAnchor[warrantDigest] = block.number;
        _lastAnchor[attestationDigest] = block.number;
        
        // Emit optimized event
        emit Anchored(
            warrantDigest,
            attestationDigest,
            msg.sender,
            subjectTag,
            controllerDidHash,
            assurance,
            block.timestamp
        );
        
        // Distribute fees using pull payment pattern
        _distributeFees(msg.value);
        
        totalAnchors++;
        totalFeesCollected += msg.value;
    }

    /**
     * @dev Legacy warrant anchoring (deprecated)
     */
    function anchorWarrant(
        bytes32 warrantHash,
        bytes32 subjectHandleHash,
        bytes32 enterpriseHash,
        string calldata enterpriseId,
        string calldata warrantId
    ) external payable onlyRole(RELAYER_ROLE) whenNotPaused nonReentrant {
        if (msg.value < baseFee) {
            revert InsufficientFee(msg.value, baseFee);
        }
        
        _lastAnchor[warrantHash] = block.number;
        
        emit WarrantAnchored(
            warrantHash,
            subjectHandleHash,
            enterpriseHash,
            enterpriseId,
            warrantId,
            msg.sender,
            block.timestamp
        );
        
        _distributeFees(msg.value);
        totalAnchors++;
        totalFeesCollected += msg.value;
    }

    /**
     * @dev Legacy attestation anchoring (deprecated)
     */
    function anchorAttestation(
        bytes32 attestationHash,
        bytes32 warrantHash,
        bytes32 enterpriseHash,
        string calldata enterpriseId,
        string calldata attestationId
    ) external payable onlyRole(RELAYER_ROLE) whenNotPaused nonReentrant {
        if (msg.value < baseFee) {
            revert InsufficientFee(msg.value, baseFee);
        }
        
        _lastAnchor[attestationHash] = block.number;
        
        emit AttestationAnchored(
            attestationHash,
            warrantHash,
            enterpriseHash,
            enterpriseId,
            attestationId,
            msg.sender,
            block.timestamp
        );
        
        _distributeFees(msg.value);
        totalAnchors++;
        totalFeesCollected += msg.value;
    }

    /**
     * @dev Legacy receipt anchoring (deprecated)
     */
    function anchorReceipt(
        bytes32 receiptHash,
        bytes32 warrantHash,
        bytes32 attestationHash,
        address subjectWallet
    ) external payable onlyRole(RELAYER_ROLE) whenNotPaused nonReentrant {
        if (msg.value < baseFee) {
            revert InsufficientFee(msg.value, baseFee);
        }
        
        _lastAnchor[receiptHash] = block.number;
        
        emit ReceiptAnchored(
            receiptHash,
            warrantHash,
            attestationHash,
            subjectWallet,
            msg.sender,
            block.timestamp
        );
        
        _distributeFees(msg.value);
        totalAnchors++;
        totalFeesCollected += msg.value;
    }

    /**
     * @dev Withdraw accumulated fees (pull payment pattern)
     */
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        if (amount == 0) {
            revert NoBalance();
        }
        
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Get the last anchor block for a hash
     */
    function lastAnchorBlock(bytes32 hash) external view returns (uint256) {
        return _lastAnchor[hash];
    }

    /**
     * @dev Check if a hash has been anchored
     */
    function isAnchored(bytes32 hash) external view returns (bool) {
        return _lastAnchor[hash] > 0;
    }

    /**
     * @dev Set base fee (admin only)
     */
    function setBaseFee(uint256 _baseFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseFee = _baseFee;
    }

    /**
     * @dev Set treasury addresses (admin only)
     */
    function setTreasuries(
        address _foundationTreasury,
        address _implementerTreasury
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_foundationTreasury == address(0) || _implementerTreasury == address(0)) {
            revert InvalidTreasuryAddress();
        }
        
        foundationTreasury = _foundationTreasury;
        implementerTreasury = _implementerTreasury;
    }

    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Internal function to distribute fees using pull payment pattern
     */
    function _distributeFees(uint256 totalFee) internal {
        uint256 foundationAmount = (totalFee * FOUNDATION_FEE) / FEE_DENOMINATOR;
        uint256 implementerAmount = (totalFee * IMPLEMENTER_FEE) / FEE_DENOMINATOR;
        
        balances[foundationTreasury] += foundationAmount;
        balances[implementerTreasury] += implementerAmount;
    }

    /**
     * @dev Emergency withdraw function (admin only)
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert NoBalance();
        }
        
        payable(msg.sender).transfer(balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Accept ETH for fees
    }
}
