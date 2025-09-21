// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title CanonRegistry
 * @dev Registry for anchoring warrants, attestations, and receipts
 * @notice This contract manages the canonical registry of privacy-related transactions
 */
contract CanonRegistry is AccessControl, ReentrancyGuard, Pausable, EIP712 {
    // Roles
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Events
    event Anchored(
        bytes32 indexed warrantDigest,
        bytes32 indexed attestationDigest,
        address indexed relayer,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance,
        uint256 timestamp,
        uint256 blockNumber
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event InsufficientFee(uint256 provided, uint256 required);

    // Errors
    error InvalidAssuranceLevel(uint8 assurance);

    // State variables
    uint256 public baseFee;
    uint256 public totalAnchors;
    mapping(address => uint256) public nonces;

    // EIP-712 type hash for meta-transactions
    bytes32 public constant ANCHOR_TYPEHASH = keccak256(
        "Anchor(bytes32 warrantDigest,bytes32 attestationDigest,bytes32 subjectTag,bytes32 controllerDidHash,uint8 assurance,uint256 nonce,uint256 deadline)"
    );

    constructor(
        string memory name,
        string memory version,
        uint256 _baseFee
    ) EIP712(name, version) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
        
        baseFee = _baseFee;
    }

    /**
     * @dev Anchor a warrant or attestation
     * @param warrantDigest Hash of the warrant
     * @param attestationDigest Hash of the attestation
     * @param subjectTag Tag identifying the subject
     * @param controllerDidHash Hash of the controller DID
     * @param assurance Assurance level (0-2)
     */
    function anchor(
        bytes32 warrantDigest,
        bytes32 attestationDigest,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance
    ) external payable whenNotPaused nonReentrant onlyRole(RELAYER_ROLE) {
        _validateAssuranceTier(assurance);
        if (msg.value < baseFee) {
            revert InsufficientFee(msg.value, baseFee);
        }

        _performAnchor(
            warrantDigest, attestationDigest, subjectTag, controllerDidHash, assurance, msg.sender
        );
    }

    /**
     * @dev Anchor via meta-transaction
     * @param warrantDigest Hash of the warrant
     * @param attestationDigest Hash of the attestation
     * @param subjectTag Tag identifying the subject
     * @param controllerDidHash Hash of the controller DID
     * @param assurance Assurance level (0-2)
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
        totalAnchors++;

        emit Anchored(
            warrantDigest,
            attestationDigest,
            relayer,
            subjectTag,
            controllerDidHash,
            assurance,
            block.timestamp,
            block.number
        );
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
     * @notice This implementation uses the signer's nonce, not the relayer's nonce
     * @notice This prevents cross-relayer replay attacks
     */
    function _verifyMetaTransaction(
        bytes32 warrantDigest,
        bytes32 attestationDigest,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal returns (address) {
        // For meta-transactions, we need to recover the signer first
        // We'll use a reasonable nonce (0) for initial recovery
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
                        0, // Use nonce 0 for initial recovery
                        deadline
                    )
                )
            ),
            v,
            r,
            s
        );

        // Now verify that the signature was created with the signer's current nonce
        // This prevents cross-relayer replays
        uint256 signerNonce = nonces[signer];
        if (signerNonce == 0) {
            revert("Invalid nonce: signer has no nonce state");
        }

        // Verify the signature was created with the signer's current nonce
        address verifiedSigner = ECDSA.recover(
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        ANCHOR_TYPEHASH,
                        warrantDigest,
                        attestationDigest,
                        subjectTag,
                        controllerDidHash,
                        assurance,
                        signerNonce, // Use signer's actual nonce
                        deadline
                    )
                )
            ),
            v,
            r,
            s
        );

        // Ensure the signature is valid with the signer's nonce
        if (verifiedSigner != signer) {
            revert("Invalid signature: nonce mismatch");
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
            return "Basic assurance - minimal verification";
        } else if (assurance == 1) {
            return "Standard assurance - standard verification";
        } else if (assurance == 2) {
            return "High assurance - enhanced verification";
        } else {
            return "Invalid assurance level";
        }
    }

    /**
     * @dev Update the base fee (admin only)
     */
    function updateBaseFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        uint256 oldFee = baseFee;
        baseFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Withdraw accumulated fees (admin only)
     */
    function withdrawFees() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(msg.sender).transfer(balance);
        }
    }

    /**
     * @dev Emergency function to recover stuck tokens (admin only)
     */
    function emergencyRecover(address token, uint256 amount) external onlyRole(ADMIN_ROLE) {
        if (token == address(0)) {
            // Recover ETH
            payable(msg.sender).transfer(amount);
        } else {
            // Recover ERC20 tokens
            // This would require importing IERC20 and implementing the transfer
            revert("ERC20 recovery not implemented");
        }
    }
}
