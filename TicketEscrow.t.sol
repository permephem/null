// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {TicketEscrow} from "../contracts/TicketEscrow.sol";
import {ICanonicalRegistry} from "../contracts/ICanonicalRegistry.sol";
import {NullWarrant} from "../contracts/NullWarrant.sol";
import {ConsumerProtectionPool} from "../contracts/ConsumerProtectionPool.sol";

// Mock Canonical Registry for testing
contract MockCanonicalRegistry is ICanonicalRegistry {
    mapping(bytes32 => bool) public anchored;
    
    function anchorTickets(
        bytes32 ticketCommit,
        bytes32 eventCommit,
        bytes32 holderCommit,
        bytes32 policyCommit,
        uint8 assurance,
        string calldata uri,
        uint256 feeWei
    ) external payable returns (bytes32) {
        anchored[ticketCommit] = true;
        return keccak256(abi.encodePacked(ticketCommit, block.timestamp));
    }
    
    function isAnchored(bytes32 ticketCommit) external view returns (bool) {
        return anchored[ticketCommit];
    }
    
    function getTicket(bytes32 ticketCommit) external view returns (
        bytes32 eventCommit,
        bytes32 holderCommit,
        bytes32 policyCommit,
        uint8 assurance,
        string memory uri
    ) {
        return (bytes32(0), bytes32(0), bytes32(0), 1, "ipfs://test");
    }
}

contract TicketEscrowTest is Test {
    TicketEscrow escrow;
    MockCanonicalRegistry canon;
    NullWarrant warrant;
    ConsumerProtectionPool cpp;
    
    address owner;
    address confirmer;
    address seller;
    address buyer;
    address foundation;
    
    event Funded(bytes32 indexed saleId, address indexed buyer, uint256 amount);
    event Settled(bytes32 indexed saleId, address indexed seller, uint256 netProceeds, string canonUri);
    event Refunded(bytes32 indexed saleId, address indexed buyer, uint256 amount, string reason);
    event Cancelled(bytes32 indexed saleId, address indexed buyer);
    
    function setUp() public {
        owner = makeAddr("owner");
        confirmer = makeAddr("confirmer");
        seller = makeAddr("seller");
        buyer = makeAddr("buyer");
        foundation = makeAddr("foundation");
        
        vm.startPrank(owner);
        
        // Deploy dependencies
        canon = new MockCanonicalRegistry();
        warrant = new NullWarrant(owner);
        cpp = new ConsumerProtectionPool();
        
        // Deploy escrow
        escrow = new TicketEscrow(
            address(canon),
            address(warrant),
            address(cpp),
            payable(foundation),
            owner
        );
        
        // Set confirmer
        escrow.setConfirmer(confirmer, true);
        
        vm.stopPrank();
    }
    
    function testInitialState() public {
        assertEq(escrow.owner(), owner);
        assertTrue(escrow.isConfirmer(confirmer));
        assertFalse(escrow.isConfirmer(seller));
        assertEq(escrow.foundation(), foundation);
        assertEq(escrow.obolBps(), 769);
        assertEq(escrow.protectBps(), 50);
    }
    
    function testFundOrder() public {
        TicketEscrow.Order memory order = createTestOrder();
        uint256 price = 1 ether;
        
        vm.deal(buyer, price);
        vm.prank(buyer);
        
        vm.expectEmit(true, true, false, true);
        emit Funded(order.saleId, buyer, price);
        
        escrow.fund{value: price}(order);
        
        assertEq(uint256(escrow.saleState(order.saleId)), uint256(TicketEscrow.State.Funded));
        assertEq(escrow.escrowedAmt(order.saleId), price);
        assertEq(escrow.saleBuyer(order.saleId), buyer);
    }
    
    function testFundOrderExpired() public {
        TicketEscrow.Order memory order = createTestOrder();
        order.expiry = uint32(block.timestamp - 1); // Expired
        
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        
        vm.expectRevert("expired");
        escrow.fund{value: order.price}(order);
    }
    
    function testFundOrderWrongAmount() public {
        TicketEscrow.Order memory order = createTestOrder();
        uint256 wrongAmount = order.price + 1 ether;
        
        vm.deal(buyer, wrongAmount);
        vm.prank(buyer);
        
        vm.expectRevert("bad amount");
        escrow.fund{value: wrongAmount}(order);
    }
    
    function testFundOrderAlreadyExists() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund once
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Try to fund again
        vm.prank(buyer);
        vm.expectRevert("exists");
        escrow.fund{value: order.price}(order);
    }
    
    function testCancelOrder() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Fast forward past expiry
        vm.warp(order.expiry + 1);
        
        vm.prank(buyer);
        vm.expectEmit(true, true, false, true);
        emit Cancelled(order.saleId, buyer);
        
        escrow.cancel(order);
        
        assertEq(uint256(escrow.saleState(order.saleId)), uint256(TicketEscrow.State.Cancelled));
        assertEq(escrow.escrowedAmt(order.saleId), 0);
        assertEq(buyer.balance, order.price);
    }
    
    function testCancelOrderNotFunded() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        vm.prank(buyer);
        vm.expectRevert("not funded");
        escrow.cancel(order);
    }
    
    function testCancelOrderNotBuyer() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Try to cancel as different user
        vm.prank(seller);
        vm.expectRevert("not buyer");
        escrow.cancel(order);
    }
    
    function testCancelOrderNotExpired() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Try to cancel before expiry
        vm.prank(buyer);
        vm.expectRevert("not yet");
        escrow.cancel(order);
    }
    
    function testConfirmAndSettle() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Confirm and settle
        uint256 sellerBalanceBefore = seller.balance;
        uint256 foundationBalanceBefore = foundation.balance;
        uint256 cppBalanceBefore = address(cpp).balance;
        
        vm.prank(confirmer);
        vm.expectEmit(true, true, false, true);
        emit Settled(order.saleId, seller, 0, "ipfs://test"); // netProceeds calculated below
        
        escrow.confirmAndSettle(order, "ipfs://test");
        
        // Calculate expected amounts
        uint256 gross = order.price;
        uint256 obol = (gross * 769) / 10000; // 7.69%
        uint256 protect = (gross * 50) / 10000; // 0.5%
        uint256 net = gross - obol - protect;
        
        assertEq(uint256(escrow.saleState(order.saleId)), uint256(TicketEscrow.State.Settled));
        assertEq(escrow.escrowedAmt(order.saleId), 0);
        assertEq(seller.balance, sellerBalanceBefore + net);
        assertEq(foundation.balance, foundationBalanceBefore + obol);
        assertEq(address(cpp).balance, cppBalanceBefore + protect);
    }
    
    function testConfirmAndSettleNotConfirmer() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Try to confirm as non-confirmer
        vm.prank(seller);
        vm.expectRevert("not confirmer");
        escrow.confirmAndSettle(order, "ipfs://test");
    }
    
    function testConfirmAndSettleNotFunded() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        vm.prank(confirmer);
        vm.expectRevert("bad state");
        escrow.confirmAndSettle(order, "ipfs://test");
    }
    
    function testConfirmAndSettleBuyerMismatch() public {
        TicketEscrow.Order memory order = createTestOrder();
        order.buyer = makeAddr("differentBuyer");
        
        // Fund order with original buyer
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Try to confirm with different buyer in order
        vm.prank(confirmer);
        vm.expectRevert("buyer mismatch");
        escrow.confirmAndSettle(order, "ipfs://test");
    }
    
    function testConfirmAndSettleRevokedTicket() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Revoke ticket
        vm.prank(owner);
        warrant.emergencyRevoke(order.ticketCommit, "fraud");
        
        // Try to confirm and settle
        vm.prank(confirmer);
        vm.expectRevert("revoked");
        escrow.confirmAndSettle(order, "ipfs://test");
    }
    
    function testRefundFromPool() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund and settle order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        vm.prank(confirmer);
        escrow.confirmAndSettle(order, "ipfs://test");
        
        // Fund the protection pool
        vm.deal(address(cpp), order.price);
        
        // Refund from pool
        uint256 buyerBalanceBefore = buyer.balance;
        
        vm.prank(confirmer);
        vm.expectEmit(true, true, false, true);
        emit Refunded(order.saleId, buyer, order.price, "fraud");
        
        escrow.refundFromPool(order, "fraud");
        
        assertEq(uint256(escrow.saleState(order.saleId)), uint256(TicketEscrow.State.Refunded));
        assertEq(buyer.balance, buyerBalanceBefore + order.price);
    }
    
    function testRefundFromPoolNotConfirmer() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund and settle order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        vm.prank(confirmer);
        escrow.confirmAndSettle(order, "ipfs://test");
        
        // Try to refund as non-confirmer
        vm.prank(seller);
        vm.expectRevert("not confirmer");
        escrow.refundFromPool(order, "fraud");
    }
    
    function testRefundFromPoolNotSettled() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // Fund order but don't settle
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // Try to refund
        vm.prank(confirmer);
        vm.expectRevert("not settled");
        escrow.refundFromPool(order, "fraud");
    }
    
    function testComputeSaleId() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        bytes32 computedId = escrow.computeSaleId(order);
        assertEq(computedId, order.saleId);
    }
    
    function testSetConfirmer() public {
        address newConfirmer = makeAddr("newConfirmer");
        
        vm.prank(owner);
        escrow.setConfirmer(newConfirmer, true);
        
        assertTrue(escrow.isConfirmer(newConfirmer));
        
        vm.prank(owner);
        escrow.setConfirmer(newConfirmer, false);
        
        assertFalse(escrow.isConfirmer(newConfirmer));
    }
    
    function testSetConfirmerOnlyOwner() public {
        vm.prank(seller);
        vm.expectRevert("Ownable: caller is not the owner");
        escrow.setConfirmer(seller, true);
    }
    
    function testSetFees() public {
        vm.prank(owner);
        escrow.setFees(1000, 100, payable(foundation));
        
        assertEq(escrow.obolBps(), 1000);
        assertEq(escrow.protectBps(), 100);
    }
    
    function testSetFeesTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("fees too high");
        escrow.setFees(15000, 10000, payable(foundation)); // 25% total
    }
    
    function testSetFeesOnlyOwner() public {
        vm.prank(seller);
        vm.expectRevert("Ownable: caller is not the owner");
        escrow.setFees(1000, 100, payable(foundation));
    }
    
    function testCompleteFlow() public {
        TicketEscrow.Order memory order = createTestOrder();
        
        // 1. Fund order
        vm.deal(buyer, order.price);
        vm.prank(buyer);
        escrow.fund{value: order.price}(order);
        
        // 2. Confirm and settle
        vm.prank(confirmer);
        escrow.confirmAndSettle(order, "ipfs://test");
        
        // 3. Later, refund due to fraud
        vm.deal(address(cpp), order.price);
        vm.prank(confirmer);
        escrow.refundFromPool(order, "fraud");
        
        // Verify final state
        assertEq(uint256(escrow.saleState(order.saleId)), uint256(TicketEscrow.State.Refunded));
        assertEq(buyer.balance, order.price); // Buyer got refunded
    }
    
    function createTestOrder() internal view returns (TicketEscrow.Order memory) {
        bytes32 ticketCommit = keccak256(abi.encodePacked("ticket123"));
        bytes32 saleId = keccak256(abi.encode(
            ticketCommit,
            seller,
            buyer,
            uint256(1 ether),
            uint256(block.timestamp + 3600),
            uint256(11000) // 110% cap
        ));
        
        return TicketEscrow.Order({
            saleId: saleId,
            ticketCommit: ticketCommit,
            seller: payable(seller),
            buyer: payable(buyer),
            price: 1 ether,
            expiry: uint32(block.timestamp + 3600),
            maxPctCap: 11000
        });
    }
}
