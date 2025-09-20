// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import {ConsumerProtectionPool} from "../contracts/ConsumerProtectionPool.sol";
import {NullWarrant} from "../contracts/NullWarrant.sol";
import {TicketEscrow} from "../contracts/TicketEscrow.sol";
import {ICanonicalRegistry} from "../contracts/ICanonicalRegistry.sol";

// ---- Minimal mock for Canon (not strictly required by escrow path, but included for realism)
contract MockCanon is ICanonicalRegistry {
    event Anchored(
        bytes32 warrantDigest,
        bytes32 attDigest,
        bytes32 holderTag,
        address foundation,
        uint8 topic,
        uint8 assurance,
        string uri
    );

    function anchor(
        bytes32 warrantDigest,
        bytes32 attDigest,
        bytes32 holderTag,
        address foundation,
        uint8 topic,
        uint8 assurance,
        string calldata uri
    ) external payable returns (bool) {
        emit Anchored(warrantDigest, attDigest, holderTag, foundation, topic, assurance, uri);
        return true;
    }

    // Implement required interface functions
    function anchorTickets(
        bytes32 ticketCommit,
        bytes32 eventCommit,
        bytes32 holderCommit,
        bytes32 policyCommit,
        uint8 assurance,
        string calldata uri,
        uint256 feeWei
    ) external payable returns (bytes32) {
        return keccak256(abi.encodePacked(ticketCommit, block.timestamp));
    }
    
    function isAnchored(bytes32 ticketCommit) external view returns (bool) {
        return true; // Mock always returns true
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

contract TestTicketEscrow is Test {
    // Actors
    address payable internal foundation = payable(address(0xf0));
    address payable internal seller     = payable(address(0x5e));
    address payable internal buyer      = payable(address(0x6b));
    address payable internal buyer2     = payable(address(0x6c));
    address internal admin              = address(0xa1);
    address internal confirmer          = address(0xc0); // relayer/ops

    // Contracts
    MockCanon internal canon;
    NullWarrant internal warrant;
    ConsumerProtectionPool internal cpp;
    TicketEscrow internal escrow;

    // Common params
    bytes32 internal ticketCommit = keccak256("TICKET-ROW-112-D-8");
    uint96  internal price = 1 ether;
    uint32  internal capPct = 110;
    uint32  internal ttl; // set per test

    // Order struct mirror
    TicketEscrow.Order internal order;

    function setUp() public {
        vm.deal(seller, 100 ether);
        vm.deal(buyer,  100 ether);
        vm.deal(buyer2, 100 ether);
        vm.deal(admin,  10 ether);

        canon = new MockCanon();
        warrant = new NullWarrant(admin);
        cpp = new ConsumerProtectionPool();
        cpp.transferOwnership(admin);

        escrow = new TicketEscrow(
            address(canon),
            address(warrant),
            address(cpp),
            foundation,
            admin
        );

        // Allow our confirmer
        vm.prank(admin);
        escrow.setConfirmer(confirmer, true);

        // seed pool with a little buffer (for refund tests)
        vm.prank(admin);
        (bool ok, ) = address(cpp).call{value: 10 ether}("");
        require(ok, "seed fail");

        // baseline fees: 7.69% obol, 0.5% protect (can adjust in tests)
        vm.prank(admin);
        escrow.setFees(769, 50, foundation);
    }

    function _orderFor(address _buyer, uint32 secondsFromNow) internal returns (TicketEscrow.Order memory o) {
        ttl = uint32(block.timestamp + secondsFromNow);
        o = TicketEscrow.Order({
            saleId: bytes32(0), // filled after compute
            ticketCommit: ticketCommit,
            seller: seller,
            buyer: payable(_buyer),
            price: price,
            expiry: ttl,
            maxPctCap: capPct
        });
        bytes32 saleId = keccak256(abi.encode(
            o.ticketCommit, o.seller, o.buyer, o.price, o.expiry, o.maxPctCap
        ));
        o.saleId = saleId;
    }

    // --- Helpers to track balances ---
    function _balance(address a) internal view returns (uint256) {
        return a.balance;
    }

    // -----------------------------------------------------------
    // HAPPY PATH: fund -> confirmAndSettle (primary or resale)
    // -----------------------------------------------------------
    function test_FundAndSettle_Primary() public {
        TicketEscrow.Order memory o = _orderFor(buyer, 3600);

        // buyer funds
        vm.prank(buyer);
        escrow.fund{value: price}(o);
        assertEq(address(escrow).balance, price);

        // Before settle snapshot balances
        uint256 f0 = _balance(foundation);
        uint256 s0 = _balance(seller);
        uint256 p0 = _balance(address(cpp));

        // relayer confirms & settles (simulating Canon inscription already done)
        vm.prank(confirmer);
        escrow.confirmAndSettle(o, "ipfs://evidence-tx");

        // Fee math: price = 1 ETH
        // obol = 0.0769 ETH (approx 1/13); protect = 0.005 ETH; net = 0.9181 ETH
        uint256 obol = (price * 769) / 10000;
        uint256 protect = (price * 50) / 10000;
        uint256 net = price - obol - protect;

        assertEq(address(escrow).balance, 0);
        assertEq(_balance(foundation), f0 + obol);
        assertEq(_balance(seller),     s0 + net);
        assertEq(_balance(address(cpp)), p0 + protect);
    }

    // -----------------------------------------------------------
    // CANCEL: buyer cancels after expiry (no delivery)
    // -----------------------------------------------------------
    function test_CancelAfterExpiry_RefundsBuyer() public {
        TicketEscrow.Order memory o = _orderFor(buyer, 5); // short ttl

        // fund
        vm.prank(buyer);
        escrow.fund{value: price}(o);

        // wait past expiry
        vm.warp(block.timestamp + 10);

        uint256 b0 = _balance(buyer);

        vm.prank(buyer);
        escrow.cancel(o);

        assertEq(_balance(buyer), b0 + price);
        assertEq(address(escrow).balance, 0);
    }

    // -----------------------------------------------------------
    // REVOKE: cannot settle a revoked ticket
    // -----------------------------------------------------------
    function test_SettleFails_IfRevoked() public {
        TicketEscrow.Order memory o = _orderFor(buyer, 3600);

        // Issue a revocation on-chain (venue/issuer)
        vm.prank(admin);
        warrant.revoke(o.ticketCommit, NullWarrant.Reason.PolicyBreach, "ipfs://evidence");

        vm.prank(buyer);
        escrow.fund{value: price}(o);

        vm.expectRevert(); // "revoked"
        vm.prank(confirmer);
        escrow.confirmAndSettle(o, "ipfs://evidence-tx");
    }

    // -----------------------------------------------------------
    // MAKE-WHOLE: settled sale later deemed invalid -> refund from pool
    // -----------------------------------------------------------
    function test_RefundFromPool_AfterRevocation_MakesBuyerWhole() public {
        TicketEscrow.Order memory o = _orderFor(buyer, 3600);

        // fund + settle
        vm.prank(buyer);
        escrow.fund{value: price}(o);

        vm.prank(confirmer);
        escrow.confirmAndSettle(o, "ipfs://canon");

        // Venue revokes later (fraud discovered)
        vm.prank(admin);
        warrant.revoke(o.ticketCommit, NullWarrant.Reason.Fraud, "ipfs://fraud");

        // Pool pre-balance & buyer pre-balance
        uint256 poolBefore = _balance(address(cpp));
        uint256 buyerBefore = _balance(buyer);

        // Resolver triggers make-whole
        vm.prank(confirmer);
        escrow.refundFromPool(o, "fraud");

        // buyer gets refunded full price; pool decreases
        assertEq(_balance(buyer), buyerBefore + price);
        assertEq(_balance(address(cpp)), poolBefore - price);
    }

    // -----------------------------------------------------------
    // ACCESS CONTROL: only confirmer can settle or refundFromPool
    // -----------------------------------------------------------
    function test_OnlyConfirmerMaySettle() public {
        TicketEscrow.Order memory o = _orderFor(buyer, 3600);

        vm.prank(buyer);
        escrow.fund{value: price}(o);

        vm.expectRevert("not confirmer");
        vm.prank(buyer);
        escrow.confirmAndSettle(o, "ipfs://canon");
    }

    function test_OnlyConfirmerMayRefundFromPool() public {
        TicketEscrow.Order memory o = _orderFor(buyer, 3600);

        vm.prank(buyer);
        escrow.fund{value: price}(o);

        vm.prank(confirmer);
        escrow.confirmAndSettle(o, "ipfs://canon");

        vm.expectRevert("not confirmer");
        vm.prank(buyer);
        escrow.refundFromPool(o, "fraud");
    }

    // -----------------------------------------------------------
    // FEES: update fees & verify new splits apply
    // -----------------------------------------------------------
    function test_UpdateFees_AppliesToNextSettlements() public {
        TicketEscrow.Order memory o = _orderFor(buyer, 3600);

        // set fees to obol=1%, protect=0.5%
        vm.prank(admin);
        escrow.setFees(100, 50, foundation);

        vm.prank(buyer);
        escrow.fund{value: price}(o);

        uint256 f0 = _balance(foundation);
        uint256 s0 = _balance(seller);
        uint256 p0 = _balance(address(cpp));

        vm.prank(confirmer);
        escrow.confirmAndSettle(o, "ipfs://canon");

        uint256 obol = (price * 100) / 10000;     // 0.01 ETH
        uint256 protect = (price * 50) / 10000;   // 0.005 ETH
        uint256 net = price - obol - protect;

        assertEq(_balance(foundation), f0 + obol);
        assertEq(_balance(address(cpp)), p0 + protect);
        assertEq(_balance(seller), s0 + net);
    }

    // -----------------------------------------------------------
    // DOUBLE-REFUND GUARD: pool refuses double payouts on same saleId
    // -----------------------------------------------------------
    function test_NoDoubleRefunds() public {
        TicketEscrow.Order memory o = _orderFor(buyer, 3600);

        vm.prank(buyer);
        escrow.fund{value: price}(o);

        vm.prank(confirmer);
        escrow.confirmAndSettle(o, "ipfs://canon");

        // revoke then refund
        vm.prank(admin);
        warrant.revoke(o.ticketCommit, NullWarrant.Reason.Fraud, "ipfs://fraud");

        vm.prank(confirmer);
        escrow.refundFromPool(o, "fraud");

        // second attempt should fail inside CPP (already refunded)
        vm.expectRevert(); // ConsumerProtectionPool checks refundedSale
        vm.prank(confirmer);
        escrow.refundFromPool(o, "fraud-again");
    }

    // -----------------------------------------------------------
    // SALE ID CONSISTENCY: computeSaleId helper matches off-chain hash
    // -----------------------------------------------------------
    function test_ComputeSaleId_Matches() public {
        TicketEscrow.Order memory o = _orderFor(buyer2, 7200);
        bytes32 expected = keccak256(abi.encode(
            o.ticketCommit, o.seller, o.buyer, o.price, o.expiry, o.maxPctCap
        ));
        bytes32 fromHelper = escrow.computeSaleId(o);
        assertEq(expected, fromHelper);
        assertEq(expected, o.saleId);
    }
}
