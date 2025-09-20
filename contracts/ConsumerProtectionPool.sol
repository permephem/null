// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Pooled reserve that auto-refunds buyers harmed by fraud/revocation.
/// Funds are topped up by tiny fees collected during sales/transfers.
contract ConsumerProtectionPool is ReentrancyGuard, Ownable {
    event ToppedUp(address indexed from, uint256 amount);
    event Refunded(bytes32 indexed saleId, address indexed to, uint256 amount, string reason);
    event ResolverSet(address indexed resolver, bool allowed);

    mapping(address => bool) public isResolver;      // relayer/venue ops multisig
    mapping(bytes32 => bool)  public refundedSale;   // prevent double-refund

    receive() external payable {
        emit ToppedUp(msg.sender, msg.value);
    }

    function setResolver(address who, bool allowed) external onlyOwner {
        isResolver[who] = allowed;
        emit ResolverSet(who, allowed);
    }

    /// @notice Refund a buyer due to fraud/revocation (called by trusted resolver).
    /// @param saleId  deterministic sale id (e.g., keccak(order fields))
    /// @param to      buyer address
    /// @param amount  refund amount (in wei)
    /// @param reason  short text tag: "revoked", "invalid_transfer", etc.
    function refundBuyer(
        bytes32 saleId,
        address payable to,
        uint256 amount,
        string calldata reason
    ) external nonReentrant {
        require(isResolver[msg.sender], "not resolver");
        require(!refundedSale[saleId], "already refunded");
        refundedSale[saleId] = true;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "refund failed");
        emit Refunded(saleId, to, amount, reason);
    }

    /// @notice Owner can withdraw surplus (e.g., migrate or rebalance).
    function sweep(address payable to, uint256 amount) external onlyOwner {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "sweep failed");
    }
}
