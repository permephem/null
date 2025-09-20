// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Null Warrant system for revoking fraudulent or problematic tickets
contract NullWarrant is Ownable {
    struct Warrant {
        bytes32 ticketCommit;
        string reason;
        address issuer;
        uint256 timestamp;
        bool executed;
    }

    mapping(bytes32 => Warrant) public warrants;
    mapping(bytes32 => bool) public isRevoked; // ticketCommit => revoked

    // Authorized issuers (venues, relayer, etc.)
    mapping(address => bool) public isAuthorizedIssuer;

    event WarrantIssued(
        bytes32 indexed warrantId,
        bytes32 indexed ticketCommit,
        string reason,
        address indexed issuer
    );

    event WarrantExecuted(
        bytes32 indexed warrantId,
        bytes32 indexed ticketCommit,
        address indexed issuer
    );

    event AuthorizedIssuerSet(address indexed issuer, bool authorized);

    constructor(address admin) Ownable(admin) {
        isAuthorizedIssuer[admin] = true;
    }

    /// @notice Set authorized warrant issuers
    /// @param issuer Address to authorize/revoke
    /// @param authorized Whether the address is authorized
    function setAuthorizedIssuer(address issuer, bool authorized) external onlyOwner {
        isAuthorizedIssuer[issuer] = authorized;
        emit AuthorizedIssuerSet(issuer, authorized);
    }

    /// @notice Issue a warrant to revoke a ticket
    /// @param ticketCommit Commitment to ticket ID
    /// @param reason Reason for revocation
    /// @return warrantId Unique warrant identifier
    function issueWarrant(
        bytes32 ticketCommit,
        string calldata reason
    ) external returns (bytes32) {
        require(isAuthorizedIssuer[msg.sender], "not authorized issuer");
        require(!isRevoked[ticketCommit], "already revoked");

        bytes32 warrantId = keccak256(abi.encodePacked(
            ticketCommit,
            msg.sender,
            block.timestamp,
            reason
        ));

        warrants[warrantId] = Warrant({
            ticketCommit: ticketCommit,
            reason: reason,
            issuer: msg.sender,
            timestamp: block.timestamp,
            executed: false
        });

        emit WarrantIssued(warrantId, ticketCommit, reason, msg.sender);
        return warrantId;
    }

    /// @notice Execute a warrant to revoke a ticket
    /// @param warrantId Warrant identifier
    function executeWarrant(bytes32 warrantId) external {
        require(isAuthorizedIssuer[msg.sender], "not authorized issuer");
        
        Warrant storage warrant = warrants[warrantId];
        require(warrant.issuer != address(0), "warrant not found");
        require(!warrant.executed, "warrant already executed");
        require(!isRevoked[warrant.ticketCommit], "ticket already revoked");

        warrant.executed = true;
        isRevoked[warrant.ticketCommit] = true;

        emit WarrantExecuted(warrantId, warrant.ticketCommit, msg.sender);
    }

    /// @notice Check if a ticket is revoked
    /// @param ticketCommit Commitment to ticket ID
    /// @return revoked True if ticket is revoked
    function isRevoked(bytes32 ticketCommit) external view returns (bool) {
        return isRevoked[ticketCommit];
    }

    /// @notice Get warrant information
    /// @param warrantId Warrant identifier
    /// @return warrant Warrant information
    function getWarrant(bytes32 warrantId) external view returns (Warrant memory) {
        return warrants[warrantId];
    }

    /// @notice Emergency revocation by owner
    /// @param ticketCommit Commitment to ticket ID
    /// @param reason Reason for emergency revocation
    function emergencyRevoke(
        bytes32 ticketCommit,
        string calldata reason
    ) external onlyOwner {
        require(!isRevoked[ticketCommit], "already revoked");
        
        isRevoked[ticketCommit] = true;
        
        // Create a warrant record for audit trail
        bytes32 warrantId = keccak256(abi.encodePacked(
            ticketCommit,
            msg.sender,
            block.timestamp,
            reason,
            "emergency"
        ));

        warrants[warrantId] = Warrant({
            ticketCommit: ticketCommit,
            reason: reason,
            issuer: msg.sender,
            timestamp: block.timestamp,
            executed: true
        });

        emit WarrantIssued(warrantId, ticketCommit, reason, msg.sender);
        emit WarrantExecuted(warrantId, ticketCommit, msg.sender);
    }
}
