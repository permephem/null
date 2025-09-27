// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/CanonRegistry.sol";

contract GasHeavyRecipient {
    CanonRegistry public immutable registry;
    bool public received;
    uint256 public totalReceived;

    constructor(CanonRegistry _registry) {
        registry = _registry;
    }

    function claim() external {
        registry.withdraw();
    }

    receive() external payable {
        received = true;
        totalReceived += msg.value;
    }
}

contract GasHeavyAdmin {
    CanonRegistry public immutable registry;
    bool public received;
    uint256 public totalReceived;

    constructor(CanonRegistry _registry) {
        registry = _registry;
    }

    function triggerEmergencyWithdraw() external {
        registry.emergencyWithdraw();
    }

    receive() external payable {
        received = true;
        totalReceived += msg.value;
    }
}

contract CanonRegistryTest is Test {
    CanonRegistry public canonRegistry;
    address public owner;
    address public relayer;
    address public user;
    address public foundationTreasury;
    address public implementerTreasury;

    event Anchored(
        bytes32 indexed warrantDigest,
        bytes32 indexed attestationDigest,
        address indexed relayer,
        bytes32 subjectTag,
        bytes32 controllerDidHash,
        uint8 assurance,
        uint256 timestamp
    );

    function setUp() public {
        owner = makeAddr("owner");
        relayer = makeAddr("relayer");
        user = makeAddr("user");
        foundationTreasury = makeAddr("foundationTreasury");
        implementerTreasury = makeAddr("implementerTreasury");

        vm.startPrank(owner);
        canonRegistry = new CanonRegistry(
            foundationTreasury,
            implementerTreasury,
            owner
        );
        
        // Grant relayer role
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayer);
        vm.stopPrank();
    }

    function testDeployment() public {
        assertEq(canonRegistry.foundationTreasury(), foundationTreasury);
        assertEq(canonRegistry.implementerTreasury(), implementerTreasury);
        assertEq(canonRegistry.baseFee(), 0.001 ether);
        assertTrue(canonRegistry.hasRole(canonRegistry.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(canonRegistry.hasRole(canonRegistry.RELAYER_ROLE(), relayer));
    }

    function testRejectsZeroAddressesInConstructor() public {
        vm.expectRevert(CanonRegistry.ZeroAddress.selector);
        new CanonRegistry(address(0), implementerTreasury, owner);

        vm.expectRevert(CanonRegistry.ZeroAddress.selector);
        new CanonRegistry(foundationTreasury, address(0), owner);

        vm.expectRevert(CanonRegistry.ZeroAddress.selector);
        new CanonRegistry(foundationTreasury, implementerTreasury, address(0));
    }

    function testAnchor() public {
        bytes32 warrantDigest = keccak256("warrant");
        bytes32 attestationDigest = keccak256("attestation");
        bytes32 subjectTag = keccak256("subject");
        bytes32 controllerDidHash = keccak256("controller");
        uint8 assurance = 1;
        uint256 fee = 0.001 ether;

        vm.deal(relayer, fee);
        vm.startPrank(relayer);

        vm.expectEmit(true, true, true, true);
        emit Anchored(
            warrantDigest,
            attestationDigest,
            relayer,
            subjectTag,
            controllerDidHash,
            assurance,
            block.timestamp
        );

        canonRegistry.anchor{value: fee}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance
        );

        vm.stopPrank();

        assertEq(canonRegistry.lastAnchorBlock(warrantDigest), block.number);
        assertEq(canonRegistry.lastAnchorBlock(attestationDigest), block.number);
        assertTrue(canonRegistry.isAnchored(warrantDigest));
        assertTrue(canonRegistry.isAnchored(attestationDigest));
        assertEq(canonRegistry.totalAnchors(), 1);
        assertEq(canonRegistry.totalFeesCollected(), fee);
    }

    function testAnchorInsufficientFee() public {
        bytes32 warrantDigest = keccak256("warrant");
        bytes32 attestationDigest = keccak256("attestation");
        bytes32 subjectTag = keccak256("subject");
        bytes32 controllerDidHash = keccak256("controller");
        uint8 assurance = 1;
        uint256 insufficientFee = 0.0005 ether;

        vm.deal(relayer, insufficientFee);
        vm.startPrank(relayer);

        vm.expectRevert(
            abi.encodeWithSelector(
                CanonRegistry.InsufficientFee.selector,
                insufficientFee,
                0.001 ether
            )
        );

        canonRegistry.anchor{value: insufficientFee}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance
        );

        vm.stopPrank();
    }

    function testAnchorInvalidAssuranceLevel() public {
        bytes32 warrantDigest = keccak256("warrant");
        bytes32 attestationDigest = keccak256("attestation");
        bytes32 subjectTag = keccak256("subject");
        bytes32 controllerDidHash = keccak256("controller");
        uint8 invalidAssurance = 3;
        uint256 fee = 0.001 ether;

        vm.deal(relayer, fee);
        vm.startPrank(relayer);

        vm.expectRevert(
            abi.encodeWithSelector(
                CanonRegistry.InvalidAssuranceLevel.selector,
                invalidAssurance
            )
        );

        canonRegistry.anchor{value: fee}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            invalidAssurance
        );

        vm.stopPrank();
    }

    function testOnlyRelayerCanAnchor() public {
        bytes32 warrantDigest = keccak256("warrant");
        bytes32 attestationDigest = keccak256("attestation");
        bytes32 subjectTag = keccak256("subject");
        bytes32 controllerDidHash = keccak256("controller");
        uint8 assurance = 1;
        uint256 fee = 0.001 ether;

        vm.deal(user, fee);
        vm.startPrank(user);

        vm.expectRevert();
        canonRegistry.anchor{value: fee}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance
        );

        vm.stopPrank();
    }

    function testFeeDistribution() public {
        uint256 fee = 0.001 ether;
        vm.deal(relayer, fee);
        
        vm.startPrank(relayer);
        canonRegistry.anchor{value: fee}(
            keccak256("warrant"),
            keccak256("attestation"),
            keccak256("subject"),
            keccak256("controller"),
            1
        );
        vm.stopPrank();

        // Foundation gets 1/13, implementer gets 12/13
        uint256 expectedFoundationBalance = (fee * 1) / 13;
        uint256 expectedImplementerBalance = (fee * 12) / 13;

        assertEq(canonRegistry.balances(foundationTreasury), expectedFoundationBalance);
        assertEq(canonRegistry.balances(implementerTreasury), expectedImplementerBalance);
    }

    function testWithdraw() public {
        uint256 fee = 0.001 ether;
        vm.deal(relayer, fee);
        
        vm.startPrank(relayer);
        canonRegistry.anchor{value: fee}(
            keccak256("warrant"),
            keccak256("attestation"),
            keccak256("subject"),
            keccak256("controller"),
            1
        );
        vm.stopPrank();

        uint256 foundationBalance = canonRegistry.balances(foundationTreasury);
        uint256 foundationBalanceBefore = foundationTreasury.balance;

        vm.startPrank(foundationTreasury);
        canonRegistry.withdraw();
        vm.stopPrank();

        assertEq(foundationTreasury.balance, foundationBalanceBefore + foundationBalance);
        assertEq(canonRegistry.balances(foundationTreasury), 0);
    }

    function testWithdrawToGasHeavyContract() public {
        GasHeavyRecipient implementerContract = new GasHeavyRecipient(canonRegistry);

        vm.startPrank(owner);
        canonRegistry.setTreasuries(foundationTreasury, address(implementerContract));
        vm.stopPrank();

        uint256 fee = 0.001 ether;
        vm.deal(relayer, fee);

        vm.startPrank(relayer);
        canonRegistry.anchor{value: fee}(
            keccak256("warrant"),
            keccak256("attestation"),
            keccak256("subject"),
            keccak256("controller"),
            1
        );
        vm.stopPrank();

        uint256 expectedImplementerBalance = (fee * 12) / 13;
        assertEq(
            canonRegistry.balances(address(implementerContract)),
            expectedImplementerBalance
        );

        implementerContract.claim();

        assertTrue(implementerContract.received());
        assertEq(implementerContract.totalReceived(), expectedImplementerBalance);
        assertEq(address(implementerContract).balance, expectedImplementerBalance);
        assertEq(canonRegistry.balances(address(implementerContract)), 0);
    }

    function testWithdrawNoBalance() public {
        vm.startPrank(foundationTreasury);
        vm.expectRevert(CanonRegistry.NoBalance.selector);
        canonRegistry.withdraw();
        vm.stopPrank();
    }

    function testSetBaseFee() public {
        uint256 newFee = 0.002 ether;
        
        vm.startPrank(owner);
        canonRegistry.setBaseFee(newFee);
        vm.stopPrank();

        assertEq(canonRegistry.baseFee(), newFee);
    }

    function testOnlyAdminCanSetBaseFee() public {
        uint256 newFee = 0.002 ether;
        
        vm.startPrank(user);
        vm.expectRevert();
        canonRegistry.setBaseFee(newFee);
        vm.stopPrank();
    }

    function testSetTreasuries() public {
        address newFoundation = makeAddr("newFoundation");
        address newImplementer = makeAddr("newImplementer");

        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit CanonRegistry.TreasuriesUpdated(
            foundationTreasury,
            newFoundation,
            implementerTreasury,
            newImplementer
        );
        canonRegistry.setTreasuries(newFoundation, newImplementer);
        vm.stopPrank();

        assertEq(canonRegistry.foundationTreasury(), newFoundation);
        assertEq(canonRegistry.implementerTreasury(), newImplementer);
        assertFalse(
            canonRegistry.hasRole(canonRegistry.TREASURY_ROLE(), foundationTreasury)
        );
        assertFalse(
            canonRegistry.hasRole(canonRegistry.TREASURY_ROLE(), implementerTreasury)
        );
        assertTrue(canonRegistry.hasRole(canonRegistry.TREASURY_ROLE(), newFoundation));
        assertTrue(canonRegistry.hasRole(canonRegistry.TREASURY_ROLE(), newImplementer));
    }

    function testSetTreasuriesRejectsZeroAddress() public {
        address newFoundation = makeAddr("newFoundation");
        
        vm.startPrank(owner);
        vm.expectRevert(CanonRegistry.InvalidTreasuryAddress.selector);
        canonRegistry.setTreasuries(address(0), newFoundation);
        vm.stopPrank();
    }

    function testEmergencyWithdrawToGasHeavyAdmin() public {
        GasHeavyAdmin admin = new GasHeavyAdmin(canonRegistry);

        vm.startPrank(owner);
        canonRegistry.grantRole(canonRegistry.DEFAULT_ADMIN_ROLE(), address(admin));
        vm.stopPrank();

        uint256 fee = 0.001 ether;
        vm.deal(relayer, fee);

        vm.startPrank(relayer);
        canonRegistry.anchor{value: fee}(
            keccak256("warrant"),
            keccak256("attestation"),
            keccak256("subject"),
            keccak256("controller"),
            1
        );
        vm.stopPrank();

        uint256 registryBalanceBefore = address(canonRegistry).balance;
        assertGt(registryBalanceBefore, 0);

        admin.triggerEmergencyWithdraw();

        assertTrue(admin.received());
        assertEq(admin.totalReceived(), registryBalanceBefore);
        assertEq(address(admin).balance, registryBalanceBefore);
        assertEq(address(canonRegistry).balance, 0);
    }

    function testPauseUnpause() public {
        vm.startPrank(owner);
        canonRegistry.pause();
        assertTrue(canonRegistry.paused());
        
        canonRegistry.unpause();
        assertFalse(canonRegistry.paused());
        vm.stopPrank();
    }

    function testOnlyAdminCanPause() public {
        vm.startPrank(user);
        vm.expectRevert();
        canonRegistry.pause();
        vm.stopPrank();
    }

    function testPausedContractBlocksAnchoring() public {
        vm.startPrank(owner);
        canonRegistry.pause();
        vm.stopPrank();

        uint256 fee = 0.001 ether;
        vm.deal(relayer, fee);
        
        vm.startPrank(relayer);
        vm.expectRevert();
        canonRegistry.anchor{value: fee}(
            keccak256("warrant"),
            keccak256("attestation"),
            keccak256("subject"),
            keccak256("controller"),
            1
        );
        vm.stopPrank();
    }

    function testEmergencyWithdraw() public {
        uint256 fee = 0.001 ether;
        vm.deal(relayer, fee);
        
        vm.startPrank(relayer);
        canonRegistry.anchor{value: fee}(
            keccak256("warrant"),
            keccak256("attestation"),
            keccak256("subject"),
            keccak256("controller"),
            1
        );
        vm.stopPrank();

        uint256 contractBalance = address(canonRegistry).balance;
        uint256 ownerBalanceBefore = owner.balance;

        vm.startPrank(owner);
        canonRegistry.emergencyWithdraw();
        vm.stopPrank();

        assertEq(owner.balance, ownerBalanceBefore + contractBalance);
    }

    function testEmergencyWithdrawNoBalance() public {
        vm.startPrank(owner);
        vm.expectRevert(CanonRegistry.NoBalance.selector);
        canonRegistry.emergencyWithdraw();
        vm.stopPrank();
    }

    function testReceive() public {
        uint256 amount = 1 ether;
        vm.deal(user, amount);
        
        vm.startPrank(user);
        (bool success,) = address(canonRegistry).call{value: amount}("");
        assertTrue(success);
        vm.stopPrank();

        assertEq(address(canonRegistry).balance, amount);
    }
}

