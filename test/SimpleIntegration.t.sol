// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/CanonRegistry.sol";
import "../src/MaskSBT.sol";

/**
 * @title Simple Integration Tests for Null Protocol
 * @dev Basic integration tests between CanonRegistry and MaskSBT contracts
 * @author Null Foundation
 */
contract SimpleIntegrationTest is Test {
    CanonRegistry public canonRegistry;
    MaskSBT public maskSBT;

    address public owner;
    address public relayer;
    address public user;
    address public foundationTreasury;
    address public implementerTreasury;

    function setUp() public {
        owner = makeAddr("owner");
        relayer = makeAddr("relayer");
        user = makeAddr("user");
        foundationTreasury = makeAddr("foundationTreasury");
        implementerTreasury = makeAddr("implementerTreasury");

        vm.startPrank(owner);

        // Deploy CanonRegistry
        canonRegistry = new CanonRegistry(foundationTreasury, implementerTreasury, owner);

        // Deploy MaskSBT
        maskSBT = new MaskSBT("Null Protocol Mask Receipts", "MASK", owner);

        // Grant relayer role to CanonRegistry
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayer);

        // Grant minter role to MaskSBT
        maskSBT.grantRole(maskSBT.MINTER_ROLE(), relayer);

        vm.stopPrank();
    }

    function testContractDeploymentIntegration() public {
        // Verify both contracts are deployed
        assertTrue(address(canonRegistry) != address(0));
        assertTrue(address(maskSBT) != address(0));

        // Verify roles are set correctly
        assertTrue(canonRegistry.hasRole(canonRegistry.RELAYER_ROLE(), relayer));
        assertTrue(maskSBT.hasRole(maskSBT.MINTER_ROLE(), relayer));
    }

    function testBasicCanonRegistryOperation() public {
        // Test basic anchoring
        bytes32 warrantDigest = keccak256("test-warrant");
        bytes32 attestationDigest = keccak256("test-attestation");
        bytes32 subjectTag = keccak256("test-subject");
        bytes32 controllerDidHash = keccak256("test-controller");
        uint8 assurance = 1;

        vm.startPrank(relayer);
        vm.deal(relayer, 1 ether);

        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            warrantDigest, attestationDigest, subjectTag, controllerDidHash, assurance
        );

        vm.stopPrank();

        // Verify anchoring worked
        assertTrue(canonRegistry.isAnchored(warrantDigest));
        assertEq(canonRegistry.totalAnchors(), 1);
    }

    function testBasicMaskSBTOperation() public {
        // Enable SBT minting
        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        // Test basic minting
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(relayer);
        maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        // Verify minting worked
        assertEq(maskSBT.ownerOf(1), user);
        assertEq(maskSBT.receiptHashes(1), receiptHash);
        assertEq(maskSBT.totalSupply(), 1);
    }

    function testEndToEndWorkflow() public {
        // Enable SBT minting
        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        // Step 1: Anchor warrant
        bytes32 warrantDigest = keccak256("test-warrant");
        bytes32 attestationDigest = keccak256("test-attestation");
        bytes32 subjectTag = keccak256("test-subject");
        bytes32 controllerDidHash = keccak256("test-controller");
        uint8 assurance = 1;

        vm.startPrank(relayer);
        vm.deal(relayer, 1 ether);

        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            warrantDigest, attestationDigest, subjectTag, controllerDidHash, assurance
        );

        // Step 2: Mint SBT receipt
        bytes32 receiptHash = keccak256("test-receipt");
        maskSBT.mintReceipt(user, receiptHash);

        vm.stopPrank();

        // Verify both operations worked
        assertTrue(canonRegistry.isAnchored(warrantDigest));
        assertEq(maskSBT.ownerOf(1), user);
        assertEq(maskSBT.receiptHashes(1), receiptHash);
    }

    function testFeeCollection() public {
        // Generate some fees
        vm.startPrank(relayer);
        vm.deal(relayer, 1 ether);

        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            keccak256("test1"), keccak256("test1"), keccak256("test1"), keccak256("test1"), 1
        );

        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            keccak256("test2"), keccak256("test2"), keccak256("test2"), keccak256("test2"), 1
        );

        vm.stopPrank();

        // Verify fees were collected
        uint256 totalFees = canonRegistry.totalFeesCollected();
        uint256 expectedFees = 2 * canonRegistry.baseFee();

        assertEq(totalFees, expectedFees);
        assertTrue(totalFees > 0);
    }

    function testRoleManagement() public {
        address newRelayer = makeAddr("newRelayer");

        // Grant role
        vm.startPrank(owner);
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), newRelayer);
        vm.stopPrank();

        // Verify role was granted
        assertTrue(canonRegistry.hasRole(canonRegistry.RELAYER_ROLE(), newRelayer));

        // Test that new relayer can anchor
        vm.startPrank(newRelayer);
        vm.deal(newRelayer, 1 ether);

        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            keccak256("test"), keccak256("test"), keccak256("test"), keccak256("test"), 1
        );

        vm.stopPrank();

        // Verify anchoring worked
        assertTrue(canonRegistry.isAnchored(keccak256("test")));
    }
}
