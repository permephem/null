// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/CanonRegistry.sol";
import "../src/MaskSBT.sol";
import "openzeppelin-contracts/contracts/access/IAccessControl.sol";
import "openzeppelin-contracts/contracts/utils/Pausable.sol";

/**
 * @title Integration Tests for Null Protocol
 * @dev Tests the integration between CanonRegistry and MaskSBT contracts
 * @author Null Foundation
 */
contract IntegrationTest is Test {
    CanonRegistry public canonRegistry;
    MaskSBT public maskSBT;
    
    address public owner;
    address public relayer;
    address public user;
    address public foundationTreasury;
    address public implementerTreasury;

    event IntegrationTestStarted(string testName);
    event IntegrationTestCompleted(string testName, bool success);

    function setUp() public {
        owner = makeAddr("owner");
        relayer = makeAddr("relayer");
        user = makeAddr("user");
        foundationTreasury = makeAddr("foundationTreasury");
        implementerTreasury = makeAddr("implementerTreasury");

        vm.startPrank(owner);
        
        // Deploy CanonRegistry
        canonRegistry = new CanonRegistry(
            foundationTreasury,
            implementerTreasury,
            owner
        );
        
        // Deploy MaskSBT
        maskSBT = new MaskSBT(
            "Null Protocol Mask Receipts",
            "MASK",
            owner
        );
        
        // Grant relayer role to CanonRegistry
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayer);
        
        // Grant minter role to MaskSBT
        maskSBT.grantRole(maskSBT.MINTER_ROLE(), relayer);
        
        vm.stopPrank();
    }

    function testContractDeploymentIntegration() public {
        emit IntegrationTestStarted("Contract Deployment Integration");
        
        // Verify both contracts are deployed
        assertTrue(address(canonRegistry) != address(0));
        assertTrue(address(maskSBT) != address(0));
        
        // Verify roles are set correctly
        assertTrue(canonRegistry.hasRole(canonRegistry.RELAYER_ROLE(), relayer));
        assertTrue(maskSBT.hasRole(maskSBT.MINTER_ROLE(), relayer));
        
        emit IntegrationTestCompleted("Contract Deployment Integration", true);
    }

    function testEndToEndDeletionWorkflow() public {
        emit IntegrationTestStarted("End-to-End Deletion Workflow");
        
        // Step 1: Enable SBT minting
        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();
        
        // Step 2: Create warrant data
        bytes32 warrantDigest = keccak256("test-warrant-data");
        bytes32 attestationDigest = keccak256("test-attestation-data");
        bytes32 subjectTag = keccak256("test-subject");
        bytes32 controllerDidHash = keccak256("test-controller-did");
        uint8 assurance = 1;
        
        // Step 3: Anchor warrant in CanonRegistry
        vm.startPrank(relayer);
        vm.deal(relayer, 1 ether); // Give relayer some ETH for fees
        
        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance
        );
        
        // Step 4: Mint SBT receipt
        bytes32 receiptHash = keccak256("test-receipt-data");
        maskSBT.mintReceipt(user, receiptHash);
        
        vm.stopPrank();
        
        // Step 5: Verify integration
        assertTrue(canonRegistry.isAnchored(warrantDigest));
        assertEq(maskSBT.ownerOf(1), user);
        assertEq(maskSBT.receiptHashes(1), receiptHash);
        
        emit IntegrationTestCompleted("End-to-End Deletion Workflow", true);
    }

    function testFeeDistributionIntegration() public {
        emit IntegrationTestStarted("Fee Distribution Integration");
        
        // Anchor multiple warrants to generate fees
        vm.startPrank(relayer);
        vm.deal(relayer, 10 ether);
        
        for (uint i = 0; i < 5; i++) {
            bytes32 warrantDigest = keccak256(abi.encodePacked("warrant", i));
            bytes32 attestationDigest = keccak256(abi.encodePacked("attestation", i));
            bytes32 subjectTag = keccak256(abi.encodePacked("subject", i));
            bytes32 controllerDidHash = keccak256(abi.encodePacked("controller", i));
            
            canonRegistry.anchor{value: canonRegistry.baseFee()}(
                warrantDigest,
                attestationDigest,
                subjectTag,
                controllerDidHash,
                1
            );
        }
        
        vm.stopPrank();
        
        // Verify fee distribution
        uint256 totalFees = canonRegistry.totalFeesCollected();
        uint256 foundationBalance = canonRegistry.balances(foundationTreasury);
        uint256 implementerBalance = canonRegistry.balances(implementerTreasury);
        uint256 expectedTotal = 5 * canonRegistry.baseFee();
        
        assertEq(totalFees, expectedTotal);
        assertEq(foundationBalance + implementerBalance, totalFees);
        
        // Verify 1:12 ratio (foundation:implementer)
        // Foundation gets 1/13, implementer gets 12/13
        uint256 expectedFoundation = expectedTotal / 13;
        uint256 expectedImplementer = expectedTotal * 12 / 13;
        
        // Allow for small rounding differences
        assertLe(foundationBalance, expectedFoundation + 1);
        assertGe(foundationBalance, expectedFoundation - 1);
        assertLe(implementerBalance, expectedImplementer + 1);
        assertGe(implementerBalance, expectedImplementer - 1);
        
        emit IntegrationTestCompleted("Fee Distribution Integration", true);
    }

    function testSBTMintingIntegration() public {
        emit IntegrationTestStarted("SBT Minting Integration");
        
        // Enable SBT minting
        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();
        
        // Mint multiple SBTs
        vm.startPrank(relayer);
        
        for (uint i = 0; i < 3; i++) {
            bytes32 receiptHash = keccak256(abi.encodePacked("receipt", i));
            address recipient = makeAddr(string(abi.encodePacked("user", i)));
            
            maskSBT.mintReceipt(recipient, receiptHash);
        }
        
        vm.stopPrank();
        
        // Verify SBT minting
        assertEq(maskSBT.totalSupply(), 3);
        assertEq(maskSBT.totalMinted(), 3);
        assertEq(maskSBT.totalBurned(), 0);
        
        // Verify each SBT
        for (uint i = 1; i <= 3; i++) {
            assertTrue(maskSBT.ownerOf(i) != address(0));
            bytes32 expectedHash = keccak256(abi.encodePacked("receipt", i - 1));
            assertEq(maskSBT.receiptHashes(i), expectedHash);
        }
        
        emit IntegrationTestCompleted("SBT Minting Integration", true);
    }

    function testAccessControlIntegration() public {
        emit IntegrationTestStarted("Access Control Integration");
        
        address unauthorized = makeAddr("unauthorized");
        
        // Test unauthorized access to CanonRegistry
        vm.startPrank(unauthorized);
        vm.deal(unauthorized, 1 ether);
        
        vm.expectRevert();
        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            1
        );
        
        vm.stopPrank();
        
        // Test unauthorized access to MaskSBT
        vm.startPrank(unauthorized);
        
        vm.expectRevert();
        maskSBT.mintReceipt(user, keccak256("test"));
        
        vm.stopPrank();
        
        // Test authorized access works
        vm.startPrank(relayer);
        vm.deal(relayer, 1 ether);
        
        // This should succeed
        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            1
        );
        
        vm.stopPrank();
        
        emit IntegrationTestCompleted("Access Control Integration", true);
    }

    function testPauseUnpauseIntegration() public {
        emit IntegrationTestStarted("Pause Unpause Integration");
        
        // Pause both contracts
        vm.startPrank(owner);
        canonRegistry.pause();
        maskSBT.pause();
        vm.stopPrank();
        
        // Test that operations are blocked when paused
        vm.startPrank(relayer);
        vm.deal(relayer, 1 ether);
        
        vm.expectRevert();
        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            1
        );
        
        vm.expectRevert();
        maskSBT.mintReceipt(user, keccak256("test"));
        
        vm.stopPrank();
        
        // Unpause both contracts
        vm.startPrank(owner);
        canonRegistry.unpause();
        maskSBT.unpause();
        vm.stopPrank();
        
        // Test that operations work after unpausing
        vm.startPrank(relayer);
        vm.deal(relayer, 1 ether);
        
        // Enable SBT minting
        vm.stopPrank();
        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();
        
        vm.startPrank(relayer);
        
        // These should succeed now
        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            1
        );
        
        maskSBT.mintReceipt(user, keccak256("test"));
        
        vm.stopPrank();
        
        emit IntegrationTestCompleted("Pause Unpause Integration", true);
    }

    function testEmergencyWithdrawIntegration() public {
        emit IntegrationTestStarted("Emergency Withdraw Integration");
        
        // Generate some fees first
        vm.startPrank(relayer);
        vm.deal(relayer, 1 ether);
        
        canonRegistry.anchor{value: canonRegistry.baseFee()}(
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            keccak256("test"),
            1
        );
        
        vm.stopPrank();
        
        // Test emergency withdraw
        uint256 initialBalance = foundationTreasury.balance;
        
        vm.startPrank(owner);
        canonRegistry.emergencyWithdraw();
        vm.stopPrank();
        
        // Verify funds were withdrawn
        assertGt(foundationTreasury.balance, initialBalance);
        assertEq(address(canonRegistry).balance, 0);
        
        emit IntegrationTestCompleted("Emergency Withdraw Integration", true);
    }
}
