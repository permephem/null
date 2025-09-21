// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MaskSBT
 * @dev Soulbound Token (SBT) representing deletion receipts
 * @dev Feature-flagged OFF by default for privacy
 * @author Null Foundation
 */
contract MaskSBT is ERC721, AccessControl, ReentrancyGuard, Pausable {
    uint256 private _tokenIdCounter;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Custom errors
    error SBTMintingDisabled();
    error MintToZeroAddress();
    error InvalidReceiptHash();
    error NonexistentToken(uint256 tokenId);
    error TransfersDisabled();
    error ApprovalsDisabled();

    // Feature flags
    bool public sbtMintingEnabled = false; // Default OFF for privacy
    bool public transferEnabled = false;   // SBTs are non-transferable by default

    // Counters

    // Token metadata
    mapping(uint256 => bytes32) public receiptHashes;
    mapping(uint256 => uint256) public mintTimestamps;
    mapping(uint256 => address) public originalMinter;

    // Statistics
    uint256 public totalMinted;
    uint256 public totalBurned;

    // Events
    event ReceiptMinted(
        uint256 indexed tokenId,
        bytes32 indexed receiptHash,
        address indexed recipient,
        address minter,
        uint256 timestamp
    );

    event ReceiptBurned(
        uint256 indexed tokenId,
        bytes32 indexed receiptHash,
        address indexed owner,
        uint256 timestamp
    );

    event SBTMintingToggled(bool enabled);
    event TransferToggled(bool enabled);

    constructor(
        string memory name,
        string memory symbol,
        address admin
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /**
     * @dev Mint a soulbound receipt (feature-flagged)
     * @param to Recipient address
     * @param receiptHash Hash of the receipt
     * @return tokenId The minted token ID
     */
    function mintReceipt(
        address to,
        bytes32 receiptHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256) {
        if (!sbtMintingEnabled) {
            revert SBTMintingDisabled();
        }
        if (to == address(0)) {
            revert MintToZeroAddress();
        }
        if (receiptHash == bytes32(0)) {
            revert InvalidReceiptHash();
        }

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        
        receiptHashes[tokenId] = receiptHash;
        mintTimestamps[tokenId] = block.timestamp;
        originalMinter[tokenId] = msg.sender;

        totalMinted++;

        emit ReceiptMinted(tokenId, receiptHash, to, msg.sender, block.timestamp);

        return tokenId;
    }

    /**
     * @dev Burn a receipt (admin only, for corrections)
     * @param tokenId Token ID to burn
     */
    function burnReceipt(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert NonexistentToken(tokenId);
        }

        bytes32 receiptHash = receiptHashes[tokenId];
        
        _burn(tokenId);
        
        delete receiptHashes[tokenId];
        delete mintTimestamps[tokenId];
        delete originalMinter[tokenId];
        
        totalBurned++;

        emit ReceiptBurned(tokenId, receiptHash, owner, block.timestamp);
    }

    /**
     * @dev Toggle SBT minting feature (admin only)
     * @param enabled Whether to enable SBT minting
     */
    function toggleSBTMinting(bool enabled) external onlyRole(ADMIN_ROLE) {
        sbtMintingEnabled = enabled;
        emit SBTMintingToggled(enabled);
    }

    /**
     * @dev Toggle transfer functionality (admin only)
     * @param enabled Whether to enable transfers
     */
    function toggleTransfer(bool enabled) external onlyRole(ADMIN_ROLE) {
        transferEnabled = enabled;
        emit TransferToggled(enabled);
    }

    /**
     * @dev Get receipt hash for a token
     * @param tokenId Token ID
     * @return receiptHash The receipt hash
     */
    function getReceiptHash(uint256 tokenId) external view returns (bytes32) {
        if (_ownerOf(tokenId) == address(0)) {
            revert NonexistentToken(tokenId);
        }
        return receiptHashes[tokenId];
    }

    /**
     * @dev Get mint timestamp for a token
     * @param tokenId Token ID
     * @return timestamp The mint timestamp
     */
    function getMintTimestamp(uint256 tokenId) external view returns (uint256) {
        if (_ownerOf(tokenId) == address(0)) {
            revert NonexistentToken(tokenId);
        }
        return mintTimestamps[tokenId];
    }

    /**
     * @dev Get original minter for a token
     * @param tokenId Token ID
     * @return minter The original minter address
     */
    function getOriginalMinter(uint256 tokenId) external view returns (address) {
        if (_ownerOf(tokenId) == address(0)) {
            revert NonexistentToken(tokenId);
        }
        return originalMinter[tokenId];
    }

    /**
     * @dev Check if a receipt hash has been minted
     * @param receiptHash The receipt hash to check
     * @return exists Whether the hash has been minted
     */
    function isReceiptMinted(bytes32 receiptHash) external view returns (bool) {
        for (uint256 i = 1; i <= _tokenIdCounter; i++) {
            address owner = _ownerOf(i);
            if (owner != address(0) && receiptHashes[i] == receiptHash) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get total supply of live SBTs
     * @return supply The total number of live (non-burned) tokens
     */
    function totalSupply() external view returns (uint256) {
        return totalMinted - totalBurned;
    }

    /**
     * @dev Get the highest token ID ever minted
     * @return highestId The highest token ID counter
     */
    function getHighestTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Override transfer functions to enforce SBT behavior
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting and burning
        if (from == address(0) || to == address(0)) {
            return super._update(to, tokenId, auth);
        }

        // Block transfers unless explicitly enabled
        if (!transferEnabled) {
            revert TransfersDisabled();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override approve functions to prevent approvals
     */
    function approve(address to, uint256 tokenId) public override {
        if (!transferEnabled) {
            revert ApprovalsDisabled();
        }
        super.approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public override {
        if (!transferEnabled) {
            revert ApprovalsDisabled();
        }
        super.setApprovalForAll(operator, approved);
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
     * @dev Supports interface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
