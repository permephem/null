// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICanonRegistry
 * @dev Interface for the Canon Registry contract
 * @author Null Foundation
 */
interface ICanonRegistry {
    // Events
    event Anchored(
        bytes32 indexed warrantDigest,
        bytes32 indexed attestationDigest,
        address indexed relayer,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance,
        uint256 timestamp
    );

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

    // Functions
    function anchor(
        bytes32 warrantDigest,
        bytes32 attestationDigest,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance
    ) external payable;

    function anchorWarrant(
        bytes32 warrantHash,
        bytes32 subjectHandleHash,
        bytes32 enterpriseHash,
        string calldata enterpriseId,
        string calldata warrantId
    ) external payable;

    function anchorAttestation(
        bytes32 attestationHash,
        bytes32 warrantHash,
        bytes32 enterpriseHash,
        string calldata enterpriseId,
        string calldata attestationId
    ) external payable;

    function anchorReceipt(
        bytes32 receiptHash,
        bytes32 warrantHash,
        bytes32 attestationHash,
        address subjectWallet
    ) external payable;

    function lastAnchorBlock(bytes32 hash) external view returns (uint256);
    function isAnchored(bytes32 hash) external view returns (bool);
    function withdraw() external;
    function setBaseFee(uint256 _baseFee) external;
    function setTreasuries(address _foundationTreasury, address _implementerTreasury) external;
    function pause() external;
    function unpause() external;
}
