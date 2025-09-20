// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CanonRegistry.sol";

contract CanonRegistryEchidnaTest is Test {
    CanonRegistry public canonRegistry;
    address public owner;
    address public relayer;
    address public foundationTreasury;
    address public implementerTreasury;

    constructor() {
        owner = address(this);
        relayer = makeAddr("relayer");
        foundationTreasury = makeAddr("foundationTreasury");
        implementerTreasury = makeAddr("implementerTreasury");

        canonRegistry = new CanonRegistry(
            foundationTreasury,
            implementerTreasury,
            owner
        );
        
        canonRegistry.grantRole(canonRegistry.RELAYER_ROLE(), relayer);
    }

    // Property: Fee distribution should always maintain the 1:12 ratio
    function echidna_feeDistributionRatio() public view returns (bool) {
        uint256 foundationBalance = canonRegistry.balances(foundationTreasury);
        uint256 implementerBalance = canonRegistry.balances(implementerTreasury);
        
        if (foundationBalance == 0 && implementerBalance == 0) {
            return true;
        }
        
        // Foundation gets 1/13, implementer gets 12/13
        // So implementer should be 12x foundation
        return implementerBalance * 13 / foundationBalance == 12;
    }

    // Property: Total fees collected should equal sum of balances
    function echidna_totalFeesConsistency() public view returns (bool) {
        uint256 contractBalance = address(canonRegistry).balance;
        uint256 foundationBalance = canonRegistry.balances(foundationTreasury);
        uint256 implementerBalance = canonRegistry.balances(implementerTreasury);
        
        return contractBalance + foundationBalance + implementerBalance == canonRegistry.totalFeesCollected();
    }

    // Property: Treasury addresses should never be zero
    function echidna_treasuryAddressesNeverZero() public view returns (bool) {
        return canonRegistry.foundationTreasury() != address(0) && 
               canonRegistry.implementerTreasury() != address(0);
    }

    // Property: Base fee should never be zero
    function echidna_baseFeeNeverZero() public view returns (bool) {
        return canonRegistry.baseFee() > 0;
    }

    // Property: Total anchors should never be negative
    function echidna_totalAnchorsNonNegative() public view returns (bool) {
        return canonRegistry.totalAnchors() >= 0;
    }

    // Property: Contract should not be paused by default
    function echidna_notPausedByDefault() public view returns (bool) {
        return !canonRegistry.paused();
    }

    // Property: Anchor function should work with valid inputs
    function echidna_anchorWithValidInputs() public returns (bool) {
        bytes32 warrantDigest = keccak256("warrant");
        bytes32 attestationDigest = keccak256("attestation");
        bytes32 subjectTag = keccak256("subject");
        bytes32 controllerDidHash = keccak256("controller");
        uint8 assurance = 1;
        uint256 fee = canonRegistry.baseFee();

        // Fund the relayer
        vm.deal(relayer, fee);
        
        vm.startPrank(relayer);
        canonRegistry.anchor{value: fee}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance
        );
        vm.stopPrank();

        return canonRegistry.isAnchored(warrantDigest) && 
               canonRegistry.isAnchored(attestationDigest);
    }

    // Property: Withdraw should work when there's a balance
    function echidna_withdrawWhenBalance() public returns (bool) {
        // First anchor to create some balance
        bytes32 warrantDigest = keccak256("warrant");
        bytes32 attestationDigest = keccak256("attestation");
        bytes32 subjectTag = keccak256("subject");
        bytes32 controllerDidHash = keccak256("controller");
        uint8 assurance = 1;
        uint256 fee = canonRegistry.baseFee();

        vm.deal(relayer, fee);
        
        vm.startPrank(relayer);
        canonRegistry.anchor{value: fee}(
            warrantDigest,
            attestationDigest,
            subjectTag,
            controllerDidHash,
            assurance
        );
        vm.stopPrank();

        uint256 foundationBalanceBefore = foundationTreasury.balance;
        
        vm.startPrank(foundationTreasury);
        canonRegistry.withdraw();
        vm.stopPrank();

        return foundationTreasury.balance > foundationBalanceBefore;
    }
}

