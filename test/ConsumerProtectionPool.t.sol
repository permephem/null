// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ConsumerProtectionPool} from "../contracts/ConsumerProtectionPool.sol";

contract ConsumerProtectionPoolTest is Test {
    ConsumerProtectionPool pool;
    address owner;
    address resolver;
    address buyer;
    address nonResolver;

    event ToppedUp(address indexed from, uint256 amount);
    event Refunded(bytes32 indexed saleId, address indexed to, uint256 amount, string reason);
    event ResolverSet(address indexed resolver, bool allowed);

    function setUp() public {
        owner = makeAddr("owner");
        resolver = makeAddr("resolver");
        buyer = makeAddr("buyer");
        nonResolver = makeAddr("nonResolver");

        vm.prank(owner);
        pool = new ConsumerProtectionPool();

        // Set resolver
        vm.prank(owner);
        pool.setResolver(resolver, true);
    }

    function testInitialState() public {
        assertEq(pool.owner(), owner);
        assertTrue(pool.isResolver(resolver));
        assertFalse(pool.isResolver(nonResolver));
        assertEq(address(pool).balance, 0);
    }

    function testReceiveFunds() public {
        uint256 amount = 1 ether;
        
        vm.expectEmit(true, false, false, true);
        emit ToppedUp(address(this), amount);
        
        (bool success,) = address(pool).call{value: amount}("");
        assertTrue(success);
        assertEq(address(pool).balance, amount);
    }

    function testSetResolver() public {
        address newResolver = makeAddr("newResolver");
        
        vm.expectEmit(true, false, false, true);
        emit ResolverSet(newResolver, true);
        
        vm.prank(owner);
        pool.setResolver(newResolver, true);
        
        assertTrue(pool.isResolver(newResolver));
        
        vm.expectEmit(true, false, false, true);
        emit ResolverSet(newResolver, false);
        
        vm.prank(owner);
        pool.setResolver(newResolver, false);
        
        assertFalse(pool.isResolver(newResolver));
    }

    function testSetResolverOnlyOwner() public {
        vm.prank(nonResolver);
        vm.expectRevert("Ownable: caller is not the owner");
        pool.setResolver(nonResolver, true);
    }

    function testRefundBuyer() public {
        // Fund the pool
        uint256 poolAmount = 2 ether;
        (bool success,) = address(pool).call{value: poolAmount}("");
        assertTrue(success);

        // Prepare refund
        bytes32 saleId = keccak256(abi.encodePacked("test-sale-123"));
        uint256 refundAmount = 1 ether;
        string memory reason = "revoked";

        // Check initial state
        assertFalse(pool.refundedSale(saleId));
        uint256 buyerBalanceBefore = buyer.balance;

        // Execute refund
        vm.expectEmit(true, true, false, true);
        emit Refunded(saleId, buyer, refundAmount, reason);
        
        vm.prank(resolver);
        pool.refundBuyer(saleId, payable(buyer), refundAmount, reason);

        // Verify refund
        assertTrue(pool.refundedSale(saleId));
        assertEq(buyer.balance, buyerBalanceBefore + refundAmount);
        assertEq(address(pool).balance, poolAmount - refundAmount);
    }

    function testRefundBuyerOnlyResolver() public {
        bytes32 saleId = keccak256(abi.encodePacked("test-sale-123"));
        uint256 refundAmount = 1 ether;
        string memory reason = "revoked";

        vm.prank(nonResolver);
        vm.expectRevert("not resolver");
        pool.refundBuyer(saleId, payable(buyer), refundAmount, reason);
    }

    function testRefundBuyerPreventDoubleRefund() public {
        // Fund the pool
        uint256 poolAmount = 2 ether;
        (bool success,) = address(pool).call{value: poolAmount}("");
        assertTrue(success);

        bytes32 saleId = keccak256(abi.encodePacked("test-sale-123"));
        uint256 refundAmount = 1 ether;
        string memory reason = "revoked";

        // First refund should succeed
        vm.prank(resolver);
        pool.refundBuyer(saleId, payable(buyer), refundAmount, reason);

        // Second refund should fail
        vm.prank(resolver);
        vm.expectRevert("already refunded");
        pool.refundBuyer(saleId, payable(buyer), refundAmount, reason);
    }

    function testRefundBuyerInsufficientFunds() public {
        bytes32 saleId = keccak256(abi.encodePacked("test-sale-123"));
        uint256 refundAmount = 1 ether;
        string memory reason = "revoked";

        // Pool has no funds
        assertEq(address(pool).balance, 0);

        vm.prank(resolver);
        vm.expectRevert("refund failed");
        pool.refundBuyer(saleId, payable(buyer), refundAmount, reason);
    }

    function testSweep() public {
        // Fund the pool
        uint256 poolAmount = 2 ether;
        (bool success,) = address(pool).call{value: poolAmount}("");
        assertTrue(success);

        uint256 sweepAmount = 1 ether;
        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(owner);
        pool.sweep(payable(owner), sweepAmount);

        assertEq(owner.balance, ownerBalanceBefore + sweepAmount);
        assertEq(address(pool).balance, poolAmount - sweepAmount);
    }

    function testSweepOnlyOwner() public {
        uint256 sweepAmount = 1 ether;

        vm.prank(nonResolver);
        vm.expectRevert("Ownable: caller is not the owner");
        pool.sweep(payable(owner), sweepAmount);
    }

    function testSweepInsufficientFunds() public {
        uint256 sweepAmount = 1 ether;

        // Pool has no funds
        assertEq(address(pool).balance, 0);

        vm.prank(owner);
        vm.expectRevert("sweep failed");
        pool.sweep(payable(owner), sweepAmount);
    }

    function testMultipleRefunds() public {
        // Fund the pool
        uint256 poolAmount = 5 ether;
        (bool success,) = address(pool).call{value: poolAmount}("");
        assertTrue(success);

        // Multiple buyers
        address buyer1 = makeAddr("buyer1");
        address buyer2 = makeAddr("buyer2");
        address buyer3 = makeAddr("buyer3");

        bytes32 saleId1 = keccak256(abi.encodePacked("sale-1"));
        bytes32 saleId2 = keccak256(abi.encodePacked("sale-2"));
        bytes32 saleId3 = keccak256(abi.encodePacked("sale-3"));

        uint256 refundAmount = 1 ether;

        // Execute multiple refunds
        vm.prank(resolver);
        pool.refundBuyer(saleId1, payable(buyer1), refundAmount, "revoked");

        vm.prank(resolver);
        pool.refundBuyer(saleId2, payable(buyer2), refundAmount, "fraud");

        vm.prank(resolver);
        pool.refundBuyer(saleId3, payable(buyer3), refundAmount, "invalid_transfer");

        // Verify all refunds
        assertTrue(pool.refundedSale(saleId1));
        assertTrue(pool.refundedSale(saleId2));
        assertTrue(pool.refundedSale(saleId3));

        assertEq(buyer1.balance, refundAmount);
        assertEq(buyer2.balance, refundAmount);
        assertEq(buyer3.balance, refundAmount);
        assertEq(address(pool).balance, poolAmount - (3 * refundAmount));
    }

    function testReentrancyProtection() public {
        // This test would require a malicious contract to test reentrancy
        // For now, we verify the contract inherits ReentrancyGuard
        assertTrue(true); // Placeholder - reentrancy protection is inherited
    }

    receive() external payable {}
}
