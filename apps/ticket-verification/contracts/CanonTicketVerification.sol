// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title CanonTicketVerification
 * @dev "Carfax for Tickets" - Complete ticket verification and escrow system
 * @notice This contract manages ticket lifecycle, verification, and escrow functionality
 */
contract CanonTicketVerification is ERC721, ERC721URIStorage, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant VENUE_ROLE = keccak256("VENUE_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");
    
    // Ticket status enumeration
    enum TicketStatus {
        VALID,          // 0: Ticket is valid and transferable
        REVOKED,        // 1: Ticket has been revoked by venue
        USED,           // 2: Ticket has been used at venue
        EXPIRED,        // 3: Ticket has expired
        FRAUDULENT      // 4: Ticket marked as fraudulent
    }
    
    // Transfer compliance status
    enum ComplianceStatus {
        COMPLIANT,      // 0: Transfer follows all rules
        MARKUP_VIOLATION, // 1: Resale price exceeds allowed markup
        UNAUTHORIZED_EXCHANGE, // 2: Sold on unauthorized platform
        BLACKLISTED_SELLER, // 3: Seller is blacklisted
        RULE_VIOLATION  // 4: Other rule violation
    }
    
    // Ticket metadata structure
    struct TicketMetadata {
        string eventId;
        string seatLocation;
        uint256 originalPrice;
        uint256 maxResaleMarkup; // Percentage (e.g., 110 = 10% markup)
        string[] authorizedExchanges;
        uint256 validUntil;
        address issuer;
        uint256 issuedAt;
    }
    
    // Transfer history entry
    struct TransferEntry {
        address from;
        address to;
        uint256 price;
        uint256 timestamp;
        ComplianceStatus compliance;
        string exchange;
        string evidenceUri; // IPFS URI to transfer evidence
    }
    
    // Escrow structure
    struct Escrow {
        address buyer;
        address seller;
        uint256 ticketId;
        uint256 amount;
        uint256 createdAt;
        uint256 expiresAt;
        bool verified;
        bool completed;
        string verificationUri; // IPFS URI to verification evidence
    }
    
    // State variables
    mapping(uint256 => TicketMetadata) public ticketMetadata;
    mapping(uint256 => TicketStatus) public ticketStatus;
    mapping(uint256 => TransferEntry[]) public transferHistory;
    mapping(uint256 => address) public currentOwner;
    mapping(address => bool) public blacklistedSellers;
    mapping(string => bool) public authorizedExchanges;
    mapping(uint256 => Escrow) public escrows;
    
    uint256 public nextTicketId = 1;
    uint256 public nextEscrowId = 1;
    uint256 public totalTickets;
    uint256 public totalTransfers;
    uint256 public totalEscrows;
    uint256 public totalRevocations;
    
    // Events
    event TicketIssued(
        uint256 indexed ticketId,
        address indexed owner,
        string eventId,
        uint256 originalPrice,
        address indexed issuer
    );
    
    event TicketTransferred(
        uint256 indexed ticketId,
        address indexed from,
        address indexed to,
        uint256 price,
        ComplianceStatus compliance,
        string exchange
    );
    
    event TicketRevoked(
        uint256 indexed ticketId,
        address indexed revoker,
        string reason,
        uint256 timestamp
    );
    
    event TicketScanned(
        uint256 indexed ticketId,
        address indexed scanner,
        uint256 timestamp
    );
    
    event EscrowCreated(
        uint256 indexed escrowId,
        uint256 indexed ticketId,
        address indexed buyer,
        address seller,
        uint256 amount
    );
    
    event EscrowCompleted(
        uint256 indexed escrowId,
        uint256 indexed ticketId,
        address indexed buyer,
        address seller,
        uint256 amount
    );
    
    event EscrowCancelled(
        uint256 indexed escrowId,
        uint256 indexed ticketId,
        address indexed buyer,
        uint256 refundAmount
    );
    
    event BlacklistUpdated(
        address indexed seller,
        bool blacklisted,
        string reason
    );
    
    event ExchangeAuthorized(
        string indexed exchange,
        bool authorized
    );
    
    constructor() ERC721("CanonTicket", "CTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VENUE_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(ESCROW_ROLE, msg.sender);
    }
    
    /**
     * @dev Issue a new ticket
     * @param to Address to receive the ticket
     * @param metadata Ticket metadata including event details and rules
     * @param tokenUri IPFS URI to ticket metadata
     */
    function issueTicket(
        address to,
        TicketMetadata calldata metadata,
        string calldata tokenUri
    ) external onlyRole(VENUE_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(bytes(metadata.eventId).length > 0, "Event ID required");
        require(metadata.originalPrice > 0, "Original price must be positive");
        require(metadata.validUntil > block.timestamp, "Invalid expiration");
        
        uint256 ticketId = nextTicketId++;
        _safeMint(to, ticketId);
        _setTokenURI(ticketId, tokenUri);
        
        ticketMetadata[ticketId] = metadata;
        ticketStatus[ticketId] = TicketStatus.VALID;
        currentOwner[ticketId] = to;
        
        totalTickets++;
        
        emit TicketIssued(ticketId, to, metadata.eventId, metadata.originalPrice, msg.sender);
        
        return ticketId;
    }
    
    /**
     * @dev Transfer ticket with compliance checking
     * @param to Recipient address
     * @param ticketId Ticket ID
     * @param price Transfer price
     * @param exchange Exchange platform used
     * @param evidenceUri IPFS URI to transfer evidence
     */
    function transferTicket(
        address to,
        uint256 ticketId,
        uint256 price,
        string calldata exchange,
        string calldata evidenceUri
    ) external whenNotPaused nonReentrant {
        require(_exists(ticketId), "Ticket does not exist");
        require(ticketStatus[ticketId] == TicketStatus.VALID, "Ticket not transferable");
        require(ownerOf(ticketId) == msg.sender, "Not ticket owner");
        require(to != address(0), "Invalid recipient");
        require(!blacklistedSellers[msg.sender], "Seller blacklisted");
        
        // Check compliance
        ComplianceStatus compliance = _checkCompliance(ticketId, price, exchange);
        require(compliance == ComplianceStatus.COMPLIANT, "Transfer not compliant");
        
        // Record transfer history
        TransferEntry memory entry = TransferEntry({
            from: msg.sender,
            to: to,
            price: price,
            timestamp: block.timestamp,
            compliance: compliance,
            exchange: exchange,
            evidenceUri: evidenceUri
        });
        
        transferHistory[ticketId].push(entry);
        currentOwner[ticketId] = to;
        totalTransfers++;
        
        // Transfer token
        _transfer(msg.sender, to, ticketId);
        
        emit TicketTransferred(ticketId, msg.sender, to, price, compliance, exchange);
    }
    
    /**
     * @dev Create escrow for ticket purchase
     * @param ticketId Ticket ID
     * @param seller Seller address
     * @param amount Purchase amount
     * @param expiresAt Escrow expiration timestamp
     */
    function createEscrow(
        uint256 ticketId,
        address seller,
        uint256 amount,
        uint256 expiresAt
    ) external payable onlyRole(ESCROW_ROLE) whenNotPaused nonReentrant returns (uint256) {
        require(_exists(ticketId), "Ticket does not exist");
        require(ticketStatus[ticketId] == TicketStatus.VALID, "Ticket not transferable");
        require(ownerOf(ticketId) == seller, "Seller not owner");
        require(msg.value == amount, "Incorrect payment amount");
        require(expiresAt > block.timestamp, "Invalid expiration");
        require(!blacklistedSellers[seller], "Seller blacklisted");
        
        uint256 escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            ticketId: ticketId,
            amount: amount,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            verified: false,
            completed: false,
            verificationUri: ""
        });
        
        totalEscrows++;
        
        emit EscrowCreated(escrowId, ticketId, msg.sender, seller, amount);
        
        return escrowId;
    }
    
    /**
     * @dev Verify ticket and complete escrow
     * @param escrowId Escrow ID
     * @param verificationUri IPFS URI to verification evidence
     */
    function verifyAndCompleteEscrow(
        uint256 escrowId,
        string calldata verificationUri
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.amount > 0, "Escrow does not exist");
        require(!escrow.completed, "Escrow already completed");
        require(block.timestamp <= escrow.expiresAt, "Escrow expired");
        
        uint256 ticketId = escrow.ticketId;
        require(ticketStatus[ticketId] == TicketStatus.VALID, "Ticket not valid");
        require(ownerOf(ticketId) == escrow.seller, "Seller no longer owner");
        
        // Mark as verified and completed
        escrow.verified = true;
        escrow.completed = true;
        escrow.verificationUri = verificationUri;
        
        // Transfer ticket to buyer
        _transfer(escrow.seller, escrow.buyer, ticketId);
        currentOwner[ticketId] = escrow.buyer;
        
        // Record transfer in history
        TransferEntry memory entry = TransferEntry({
            from: escrow.seller,
            to: escrow.buyer,
            price: escrow.amount,
            timestamp: block.timestamp,
            compliance: ComplianceStatus.COMPLIANT,
            exchange: "Canon Escrow",
            evidenceUri: verificationUri
        });
        
        transferHistory[ticketId].push(entry);
        totalTransfers++;
        
        // Release funds to seller
        payable(escrow.seller).transfer(escrow.amount);
        
        emit EscrowCompleted(escrowId, ticketId, escrow.buyer, escrow.seller, escrow.amount);
    }
    
    /**
     * @dev Cancel escrow and refund buyer
     * @param escrowId Escrow ID
     */
    function cancelEscrow(uint256 escrowId) external whenNotPaused nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.amount > 0, "Escrow does not exist");
        require(!escrow.completed, "Escrow already completed");
        require(
            msg.sender == escrow.buyer || 
            msg.sender == escrow.seller || 
            block.timestamp > escrow.expiresAt,
            "Not authorized to cancel"
        );
        
        escrow.completed = true;
        
        // Refund buyer
        payable(escrow.buyer).transfer(escrow.amount);
        
        emit EscrowCancelled(escrowId, escrow.ticketId, escrow.buyer, escrow.amount);
    }
    
    /**
     * @dev Revoke ticket (venue only)
     * @param ticketId Ticket ID
     * @param reason Revocation reason
     */
    function revokeTicket(uint256 ticketId, string calldata reason) external onlyRole(VENUE_ROLE) {
        require(_exists(ticketId), "Ticket does not exist");
        require(ticketStatus[ticketId] == TicketStatus.VALID, "Ticket already revoked");
        
        ticketStatus[ticketId] = TicketStatus.REVOKED;
        totalRevocations++;
        
        emit TicketRevoked(ticketId, msg.sender, reason, block.timestamp);
    }
    
    /**
     * @dev Mark ticket as used (venue only)
     * @param ticketId Ticket ID
     */
    function markTicketUsed(uint256 ticketId) external onlyRole(VENUE_ROLE) {
        require(_exists(ticketId), "Ticket does not exist");
        require(ticketStatus[ticketId] == TicketStatus.VALID, "Ticket not valid");
        
        ticketStatus[ticketId] = TicketStatus.USED;
        
        emit TicketScanned(ticketId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update blacklist status
     * @param seller Seller address
     * @param blacklisted Blacklist status
     * @param reason Reason for blacklisting
     */
    function updateBlacklist(
        address seller,
        bool blacklisted,
        string calldata reason
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        blacklistedSellers[seller] = blacklisted;
        emit BlacklistUpdated(seller, blacklisted, reason);
    }
    
    /**
     * @dev Authorize or deauthorize exchange
     * @param exchange Exchange name
     * @param authorized Authorization status
     */
    function updateExchangeAuthorization(
        string calldata exchange,
        bool authorized
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        authorizedExchanges[exchange] = authorized;
        emit ExchangeAuthorized(exchange, authorized);
    }
    
    /**
     * @dev Get complete ticket history
     * @param ticketId Ticket ID
     * @return entries Complete transfer history
     */
    function getTicketHistory(uint256 ticketId) external view returns (TransferEntry[] memory entries) {
        return transferHistory[ticketId];
    }
    
    /**
     * @dev Get ticket verification data
     * @param ticketId Ticket ID
     * @return status Current ticket status
     * @return owner Current owner
     * @return metadata Ticket metadata
     * @return historyLength Number of transfers
     */
    function getTicketVerification(uint256 ticketId) external view returns (
        TicketStatus status,
        address owner,
        TicketMetadata memory metadata,
        uint256 historyLength
    ) {
        require(_exists(ticketId), "Ticket does not exist");
        
        return (
            ticketStatus[ticketId],
            currentOwner[ticketId],
            ticketMetadata[ticketId],
            transferHistory[ticketId].length
        );
    }
    
    /**
     * @dev Check if transfer is compliant
     * @param ticketId Ticket ID
     * @param price Transfer price
     * @param exchange Exchange platform
     * @return compliance Compliance status
     */
    function _checkCompliance(
        uint256 ticketId,
        uint256 price,
        string calldata exchange
    ) internal view returns (ComplianceStatus compliance) {
        TicketMetadata memory metadata = ticketMetadata[ticketId];
        
        // Check markup compliance
        uint256 maxAllowedPrice = (metadata.originalPrice * metadata.maxResaleMarkup) / 100;
        if (price > maxAllowedPrice) {
            return ComplianceStatus.MARKUP_VIOLATION;
        }
        
        // Check exchange authorization
        if (!authorizedExchanges[exchange]) {
            return ComplianceStatus.UNAUTHORIZED_EXCHANGE;
        }
        
        // Check seller blacklist
        if (blacklistedSellers[msg.sender]) {
            return ComplianceStatus.BLACKLISTED_SELLER;
        }
        
        return ComplianceStatus.COMPLIANT;
    }
    
    /**
     * @dev Get contract statistics
     * @return tickets Total tickets issued
     * @return transfers Total transfers
     * @return escrows Total escrows
     * @return revocations Total revocations
     */
    function getStats() external view returns (
        uint256 tickets,
        uint256 transfers,
        uint256 escrows,
        uint256 revocations
    ) {
        return (totalTickets, totalTransfers, totalEscrows, totalRevocations);
    }
    
    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
