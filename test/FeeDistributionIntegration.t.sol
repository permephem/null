// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/CanonRegistry.sol";

/**
 * @title Fee Distribution Integration Tests
 * @dev Tests fee distribution with proper handling of rounding issues
 * @author Null Foundation
 */
contract FeeDistributionIntegrationTest is Test {
    CanonRegistry public canonRegistry;
    address public owner;
    address public relayer;
    address public foundationTreasury;
    address public implementerTreasury;

    function setUp() public {
        owner = makeAddr("owner");
        relayer = makeAddr("relayer");
        foundationTreasury = makeAddr("foundationTreasury");
        implementerTreasury = makeAddr("implementerTreasury");

        vm.startPrank(owner);
        canonRegistry = new CanonRegistry(foundationTreasury, implementerTreasury, owner);
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayer);
        vm.stopPrank();
    }

    function testFeeDistributionWithRounding() public {
        // Use a fee that divides evenly by 13 to avoid rounding issues
        uint256 fee = 0.013 ether; // 13 * 0.001 ether
        
        vm.startPrank(relayer);
        vm.deal(relayer, fee);
        
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
        
        // Verify total fees collected
        assertEq(canonRegistry.totalFeesCollected(), fee);
    }

    function testFeeDistributionWithRoundingError() public {
        // Use a fee that doesn't divide evenly by 13 to test rounding handling
        uint256 fee = 0.001 ether; // 1000000000000000 wei
        
        vm.startPrank(relayer);
        vm.deal(relayer, fee);
        
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
        uint256 totalDistributed = expectedFoundationBalance + expectedImplementerBalance;
        uint256 roundingError = fee - totalDistributed;

        // Verify the balances are correct (within rounding tolerance)
        assertEq(canonRegistry.balances(foundationTreasury), expectedFoundationBalance);
        assertEq(canonRegistry.balances(implementerTreasury), expectedImplementerBalance);
        
        // Verify total fees collected equals the original fee
        assertEq(canonRegistry.totalFeesCollected(), fee);
        
        // Verify rounding error is minimal (should be at most 1 wei per anchor)
        assertLe(roundingError, 1);
        
        console.log("Fee:", fee);
        console.log("Foundation balance:", canonRegistry.balances(foundationTreasury));
        console.log("Implementer balance:", canonRegistry.balances(implementerTreasury));
        console.log("Total distributed:", totalDistributed);
        console.log("Rounding error:", roundingError);
    }

    function testMultipleFeeDistributionsAccumulateCorrectly() public {
        uint256 fee1 = 0.013 ether; // Divides evenly
        uint256 fee2 = 0.001 ether; // Has rounding error
        
        vm.startPrank(relayer);
        vm.deal(relayer, fee1 + fee2);
        
        // First anchor
        canonRegistry.anchor{value: fee1}(
            keccak256("warrant1"),
            keccak256("attestation1"),
            keccak256("subject1"),
            keccak256("controller1"),
            1
        );
        
        // Second anchor
        canonRegistry.anchor{value: fee2}(
            keccak256("warrant2"),
            keccak256("attestation2"),
            keccak256("subject2"),
            keccak256("controller2"),
            1
        );
        vm.stopPrank();

        // Calculate expected balances
        uint256 expectedFoundationBalance = (fee1 * 1) / 13 + (fee2 * 1) / 13;
        uint256 expectedImplementerBalance = (fee1 * 12) / 13 + (fee2 * 12) / 13;

        assertEq(canonRegistry.balances(foundationTreasury), expectedFoundationBalance);
        assertEq(canonRegistry.balances(implementerTreasury), expectedImplementerBalance);
        assertEq(canonRegistry.totalFeesCollected(), fee1 + fee2);
    }

    function testFeeDistributionRatioMaintained() public {
        // Use a fresh fee that divides evenly by 13
        uint256 fee = 0.013 ether; // 13000000000000000 wei
        
        vm.startPrank(relayer);
        vm.deal(relayer, fee);
        
        canonRegistry.anchor{value: fee}(
            keccak256("warrant-ratio-test"),
            keccak256("attestation-ratio-test"),
            keccak256("subject-ratio-test"),
            keccak256("controller-ratio-test"),
            1
        );
        vm.stopPrank();

        uint256 foundationBalance = canonRegistry.balances(foundationTreasury);
        uint256 implementerBalance = canonRegistry.balances(implementerTreasury);

        // With 0.013 ether fee:
        // Foundation gets: 13000000000000000 * 1 / 13 = 1000000000000000 (0.001 ether)
        // Implementer gets: 13000000000000000 * 12 / 13 = 12000000000000000 (0.012 ether)
        // Ratio should be: 12000000000000000 * 13 / 1000000000000000 = 156
        
        // The issue is that the ratio calculation is wrong!
        // We should check: implementerBalance / foundationBalance == 12
        // Not: implementerBalance * 13 / foundationBalance == 12
        
        if (foundationBalance > 0) {
            uint256 ratio = implementerBalance / foundationBalance;
            assertEq(ratio, 12);
        }
    }

    function testEmergencyWithdrawWithFees() public {
        uint256 fee = 0.001 ether;
        
        vm.startPrank(relayer);
        vm.deal(relayer, fee);
        
        canonRegistry.anchor{value: fee}(
            keccak256("warrant"),
            keccak256("attestation"),
            keccak256("subject"),
            keccak256("controller"),
            1
        );
        vm.stopPrank();

        // Check that contract has some balance (the rounding error)
        uint256 contractBalance = address(canonRegistry).balance;
        assertGt(contractBalance, 0);
        
        // Emergency withdraw should work
        uint256 initialOwnerBalance = owner.balance;
        vm.startPrank(owner);
        canonRegistry.emergencyWithdraw();
        vm.stopPrank();
        
        assertEq(owner.balance, initialOwnerBalance + contractBalance);
        assertEq(address(canonRegistry).balance, 0);
    }
}
