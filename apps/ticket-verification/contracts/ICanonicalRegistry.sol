// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @notice Interface for Canonical Registry contract
interface ICanonicalRegistry {
    /// @notice Anchor a ticket to the Canon ledger
    /// @param ticketCommit Commitment to ticket ID
    /// @param eventCommit Commitment to event ID
    /// @param holderCommit Commitment to holder identifier
    /// @param policyCommit Commitment to policy
    /// @param assurance Assurance level (0-4)
    /// @param uri Evidence URI (IPFS)
    /// @param feeWei Fee in wei for anchoring
    function anchorTickets(
        bytes32 ticketCommit,
        bytes32 eventCommit,
        bytes32 holderCommit,
        bytes32 policyCommit,
        uint8 assurance,
        string calldata uri,
        uint256 feeWei
    ) external payable returns (bytes32);

    /// @notice Check if a ticket is anchored
    /// @param ticketCommit Commitment to ticket ID
    /// @return isAnchored True if ticket is anchored
    function isAnchored(bytes32 ticketCommit) external view returns (bool);

    /// @notice Get ticket information
    /// @param ticketCommit Commitment to ticket ID
    /// @return eventCommit Event commitment
    /// @return holderCommit Holder commitment
    /// @return policyCommit Policy commitment
    /// @return assurance Assurance level
    /// @return uri Evidence URI
    function getTicket(bytes32 ticketCommit) external view returns (
        bytes32 eventCommit,
        bytes32 holderCommit,
        bytes32 policyCommit,
        uint8 assurance,
        string memory uri
    );

    /// @notice Events
    event TicketAnchored(
        bytes32 indexed ticketCommit,
        bytes32 indexed eventCommit,
        bytes32 indexed holderCommit,
        bytes32 policyCommit,
        uint8 assurance,
        string uri,
        bytes32 canonTx
    );
}
