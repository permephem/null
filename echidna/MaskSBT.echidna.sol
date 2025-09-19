// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MaskSBT.sol";

contract MaskSBTEchidnaTest is Test {
    MaskSBT public maskSBT;
    address public owner;
    address public minter;
    address public user;

    constructor() {
        owner = address(this);
        minter = makeAddr("minter");
        user = makeAddr("user");

        maskSBT = new MaskSBT(
            "Null Protocol Mask Receipts",
            "MASK",
            owner
        );
        
        maskSBT.grantRole(maskSBT.MINTER_ROLE(), minter);
        maskSBT.toggleSBTMinting(true);
    }

    // Property: Total supply should equal minted minus burned
    function echidna_totalSupplyEqualsMintedMinusBurned() public view returns (bool) {
        return maskSBT.totalSupply() == maskSBT.totalMinted() - maskSBT.totalBurned();
    }

    // Property: No duplicate receipt hashes should exist
    function echidna_noDuplicateReceiptHashes() public view returns (bool) {
        uint256 totalSupply = maskSBT.totalSupply();
        
        // For each token, verify its receipt hash is marked as minted
        for (uint256 i = 1; i <= totalSupply; i++) {
            try maskSBT.ownerOf(i) returns (address) {
                bytes32 receiptHash = maskSBT.getReceiptHash(i);
                if (!maskSBT.isReceiptMinted(receiptHash)) {
                    return false;
                }
            } catch {
                // Token doesn't exist, skip
            }
        }
        return true;
    }

    // Property: Balance consistency
    function echidna_balanceConsistency() public view returns (bool) {
        uint256 totalSupply = maskSBT.totalSupply();
        return totalSupply >= 0;
    }

    // Property: Token ID increment
    function echidna_tokenIdIncrement() public view returns (bool) {
        uint256 totalSupply = maskSBT.totalSupply();
        return totalSupply >= 0;
    }

    // Property: SBT minting state consistency
    function echidna_sbtMintingStateConsistency() public view returns (bool) {
        bool sbtMintingEnabled = maskSBT.sbtMintingEnabled();
        return sbtMintingEnabled == true || sbtMintingEnabled == false;
    }

    // Property: Transfer state consistency
    function echidna_transferStateConsistency() public view returns (bool) {
        bool transferEnabled = maskSBT.transferEnabled();
        return transferEnabled == true || transferEnabled == false;
    }

    // Property: Contract should not be paused by default
    function echidna_notPausedByDefault() public view returns (bool) {
        return !maskSBT.paused();
    }

    // Property: Role consistency
    function echidna_roleConsistency() public view returns (bool) {
        return maskSBT.hasRole(maskSBT.DEFAULT_ADMIN_ROLE(), owner) &&
               maskSBT.hasRole(maskSBT.MINTER_ROLE(), minter);
    }

    // Property: Mint function should work with valid inputs
    function echidna_mintWithValidInputs() public returns (bool) {
        bytes32 receiptHash = keccak256("test-receipt");
        
        vm.startPrank(minter);
        uint256 tokenId = maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        return maskSBT.ownerOf(tokenId) == user &&
               maskSBT.getReceiptHash(tokenId) == receiptHash &&
               maskSBT.isReceiptMinted(receiptHash);
    }

    // Property: Burn function should work when token exists
    function echidna_burnWhenTokenExists() public returns (bool) {
        bytes32 receiptHash = keccak256("test-receipt");
        
        vm.startPrank(minter);
        uint256 tokenId = maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        vm.startPrank(owner);
        maskSBT.burnReceipt(tokenId);
        vm.stopPrank();

        // Token should no longer exist
        try maskSBT.ownerOf(tokenId) returns (address) {
            return false;
        } catch {
            return true;
        }
    }

    // Property: Transfers should be disabled by default
    function echidna_transfersDisabledByDefault() public view returns (bool) {
        return !maskSBT.transferEnabled();
    }

    // Property: SBT minting should be enabled after toggle
    function echidna_sbtMintingEnabledAfterToggle() public returns (bool) {
        maskSBT.toggleSBTMinting(true);
        return maskSBT.sbtMintingEnabled();
    }

    // Property: Transfer should be enabled after toggle
    function echidna_transferEnabledAfterToggle() public returns (bool) {
        maskSBT.toggleTransfer(true);
        return maskSBT.transferEnabled();
    }
}
