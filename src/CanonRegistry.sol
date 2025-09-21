// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/access/AccessControl.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-contracts/contracts/utils/Pausable.sol";
import "openzeppelin-contracts/contracts/utils/Address.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";

/**
 * @title CanonRegistry
 * @dev Append-only ledger for closure events with privacy-preserving and gas-optimized design
 * @author Null Foundation
 */
contract CanonRegistry is AccessControl, ReentrancyGuard, Pausable, EIP712 {
    using Address for address;

    // Roles
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // EIP-712 Type Hash for meta-transactions
    bytes32 public constant ANCHOR_TYPEHASH = keccak256(
        "Anchor(bytes32 warrantDigest,bytes32 attestationDigest,bytes32 subjectTag,bytes32 controllerDidHash,uint8 assurance,uint256 nonce,uint256 deadline)"
    );

    // Assurance Tier Policies
    enum AssuranceTier {
        EMAIL_DKIM, // 0: Email DKIM verification
        DID_JWS, // 1: DID JWS signature verification
        TEE_ATTESTATION // 2: Trusted Execution Environment attestation

    }

    // Custom errors
    error InvalidAssuranceLevel(uint8 assurance);
    error InsufficientFee(uint256 provided, uint256 required);
    error NoBalance();
    error ZeroAddress();
    error InvalidTreasuryAddress();
    error EtherTransferFailed();

    // Events
    // Hash instead of string for gas optimization
    // Assurance level (0-2)
    event Anchored( // HMAC-based privacy-preserving tag
        bytes32 indexed warrantDigest,
        bytes32 indexed attestationDigest,
        address indexed relayer,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance,
        uint256 timestamp
    );

    // Legacy events for backward compatibility (deprecated)
    event WarrantAnchored(
        bytes32 indexed warrantHash,
        bytes32 indexed subjectHandleHash,
        bytes32 indexed enterpriseHash,
        string enterpriseId,
        string warrantId,
        address submitter,
        uint256 ts
    );

    event AttestationAnchored(
        bytes32 indexed attestationHash,
        bytes32 indexed warrantHash,
        bytes32 indexed enterpriseHash,
        string enterpriseId,
        string attestationId,
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

    event Withdrawal(address indexed account, uint256 amount);
    event EmergencyWithdrawal(address indexed admin, uint256 amount);

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

    // Meta-transaction nonces
    mapping(address => uint256) public nonces;

    constructor(address _foundationTreasury, address _implementerTreasury, address _admin)
        EIP712("CanonRegistry", "1")
    {
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
        _validateAssuranceTier(assurance);
        if (msg.value < baseFee) {
            revert InsufficientFee(msg.value, baseFee);
        }

        _performAnchor(
            warrantDigest, attestationDigest, subjectTag, controllerDidHash, assurance, msg.sender
        );
    }

    /**
     * @dev Anchor a closure event via meta-transaction (EIP-712)
     * @param warrantDigest Hash of the warrant
     * @param attestationDigest Hash of the attestation
     * @param subjectTag HMAC-based privacy-preserving tag
     * @param controllerDidHash Hash of controller DID
     * @param assurance Assurance level (0-2)
     * @param nonce Signer's nonce for this transaction
     * @param deadline Meta-transaction deadline
     * @param v Signature recovery ID
     * @param r Signature r value
     * @param s Signature s value
     */
    function anchorMeta(
        bytes32 warrantDigest,
        bytes32 attestationDigest,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance,
        uint256 nonce,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable whenNotPaused nonReentrant {
        if (block.timestamp > deadline) {
            revert("Meta-transaction expired");
        }

        _validateAssuranceTier(assurance);
        if (msg.value < baseFee) {
            revert InsufficientFee(msg.value, baseFee);
        }

        // Verify meta-transaction signature
        address signer = _verifyMetaTransaction(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance,
            nonce,
            deadline,
            v,
            r,
            s
        );

        // Verify signer has RELAYER_ROLE
        if (!hasRole(RELAYER_ROLE, signer)) {
            revert("Invalid relayer signature");
        }

        _performAnchor(
            warrantDigest, attestationDigest, subjectTag, controllerDidHash, assurance, signer
        );
    }

    /**
     * @dev Internal function to perform the actual anchoring logic
     */
    function _performAnchor(
        bytes32 warrantDigest,
        bytes32 attestationDigest,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance,
        address relayer
    ) internal {
        // Record the anchor
        _lastAnchor[warrantDigest] = block.number;
        _lastAnchor[attestationDigest] = block.number;

        // Emit optimized event with additional indexing fields
        emit Anchored(
            warrantDigest,
            attestationDigest,
            relayer,
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
     * @dev Validate assurance tier policy
     */
    function _validateAssuranceTier(uint8 assurance) internal pure {
        if (assurance > 2) {
            revert InvalidAssuranceLevel(assurance);
        }
        // Additional validation can be added here based on assurance tier requirements
    }

    /**
     * @dev Verify EIP-712 meta-transaction signature
     * @notice Uses the provided nonce instead of msg.sender's nonce to prevent cross-relayer replays
     */
    function _verifyMetaTransaction(
        bytes32 warrantDigest,
        bytes32 attestationDigest,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance,
        uint256 nonce,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal returns (address) {
        // Recover the signer using the provided nonce
        address signer = ECDSA.recover(
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        ANCHOR_TYPEHASH,
                        warrantDigest,
                        attestationDigest,
                        subjectTag,
                        controllerDidHash,
                        assurance,
                        nonce, // Use the provided nonce
                        deadline
                    )
                )
            ),
            v,
            r,
            s
        );

        // Verify that the provided nonce matches the signer's current nonce
        // This prevents cross-relayer replays and ensures nonce synchronization
        if (nonce != nonces[signer]) {
            revert("Invalid nonce: provided nonce does not match signer's current nonce");
        }

        // Increment the signer's nonce to prevent replay
        nonces[signer]++;

        return signer;
    }

    /**
     * @dev Get the domain separator for EIP-712 meta-transactions
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Get the current nonce for an address
     */
    function getNonce(address account) external view returns (uint256) {
        return nonces[account];
    }

    /**
     * @dev Get assurance tier policy description
     */
    function getAssuranceTierPolicy(uint8 assurance) external pure returns (string memory) {
        if (assurance == 0) {
            return "EMAIL_DKIM: Email DKIM verification";
        } else if (assurance == 1) {
            return "DID_JWS: DID JWS signature verification";
        } else if (assurance == 2) {
            return "TEE_ATTESTATION: Trusted Execution Environment attestation";
        } else {
            return "INVALID: Unknown assurance tier";
        }
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
            receiptHash, warrantHash, attestationHash, subjectWallet, msg.sender, block.timestamp
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

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert EtherTransferFailed();
        }

        emit Withdrawal(msg.sender, amount);
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
    function setTreasuries(address _foundationTreasury, address _implementerTreasury)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
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

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        if (!success) {
            revert EtherTransferFailed();
        }

        emit EmergencyWithdrawal(msg.sender, balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Accept ETH for fees
    }
}
