// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMaskSBT
 * @dev Interface for the Mask SBT contract
 * @author Null Foundation
 */
interface IMaskSBT {
    // Events
    event ReceiptMinted(
        uint256 indexed tokenId,
        bytes32 indexed receiptHash,
        address indexed recipient,
        address minter,
        uint256 timestamp
    );

    event ReceiptBurned(uint256 indexed tokenId, bytes32 indexed receiptHash, address indexed owner, uint256 timestamp);

    event SBTMintingToggled(bool enabled);
    event TransferToggled(bool enabled);

    // Functions
    function mintReceipt(address to, bytes32 receiptHash) external returns (uint256);
    function burnReceipt(uint256 tokenId) external;
    function toggleSBTMinting(bool enabled) external;
    function toggleTransfer(bool enabled) external;
    function getReceiptHash(uint256 tokenId) external view returns (bytes32);
    function getMintTimestamp(uint256 tokenId) external view returns (uint256);
    function getOriginalMinter(uint256 tokenId) external view returns (address);
    function isReceiptMinted(bytes32 receiptHash) external view returns (bool);
    function totalSupply() external view returns (uint256);
    function sbtMintingEnabled() external view returns (bool);
    function transferEnabled() external view returns (bool);
    function pause() external;
    function unpause() external;
}
