// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/MaskSBT.sol";

contract MaskSBTTest is Test {
    MaskSBT public maskSBT;
    address public owner;
    address public minter;
    address public user;
    address public rando;

    event ReceiptMinted(
        uint256 indexed tokenId,
        bytes32 indexed receiptHash,
        address indexed recipient,
        address minter,
        uint256 timestamp
    );

    event ReceiptBurned(
        uint256 indexed tokenId,
        bytes32 indexed receiptHash,
        address indexed owner,
        uint256 timestamp
    );

    event SBTMintingToggled(bool enabled);
    event TransferToggled(bool enabled);

    function setUp() public {
        owner = makeAddr("owner");
        minter = makeAddr("minter");
        user = makeAddr("user");
        rando = makeAddr("rando");

        vm.startPrank(owner);
        maskSBT = new MaskSBT("Null Protocol Mask Receipts", "MASK", owner);

        // Grant minter role
        maskSBT.grantRole(maskSBT.MINTER_ROLE(), minter);
        vm.stopPrank();
    }

    function testDeployment() public {
        assertEq(maskSBT.name(), "Null Protocol Mask Receipts");
        assertEq(maskSBT.symbol(), "MASK");
        assertFalse(maskSBT.sbtMintingEnabled());
        assertFalse(maskSBT.transferEnabled());
        assertTrue(maskSBT.hasRole(maskSBT.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(maskSBT.hasRole(maskSBT.MINTER_ROLE(), owner));
        assertTrue(maskSBT.hasRole(maskSBT.MINTER_ROLE(), minter));
    }

    function testMintOnlyWhenEnabled() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(minter);
        vm.expectRevert(MaskSBT.SBTMintingDisabled.selector);
        maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();
    }

    function testMintReceipt() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        vm.startPrank(minter);
        vm.expectEmit(true, true, true, true);
        emit ReceiptMinted(1, receiptHash, user, minter, block.timestamp);

        uint256 tokenId = maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(maskSBT.ownerOf(tokenId), user);
        assertEq(maskSBT.getReceiptHash(tokenId), receiptHash);
        assertEq(maskSBT.getMintTimestamp(tokenId), block.timestamp);
        assertEq(maskSBT.getOriginalMinter(tokenId), minter);
        assertEq(maskSBT.balanceOf(user), 1);
        assertEq(maskSBT.totalSupply(), 1);
        assertTrue(maskSBT.isReceiptMinted(receiptHash));
    }

    function testMintToZeroAddress() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        vm.startPrank(minter);
        vm.expectRevert(MaskSBT.MintToZeroAddress.selector);
        maskSBT.mintReceipt(address(0), receiptHash);
        vm.stopPrank();
    }

    function testMintInvalidReceiptHash() public {
        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        vm.startPrank(minter);
        vm.expectRevert(MaskSBT.InvalidReceiptHash.selector);
        maskSBT.mintReceipt(user, bytes32(0));
        vm.stopPrank();
    }

    function testOnlyMinterCanMint() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        vm.startPrank(user);
        vm.expectRevert();
        maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();
    }

    function testBurnReceipt() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        vm.startPrank(minter);
        uint256 tokenId = maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit ReceiptBurned(tokenId, receiptHash, user, block.timestamp);

        maskSBT.burnReceipt(tokenId);
        vm.stopPrank();

        vm.expectRevert();
        maskSBT.ownerOf(tokenId);

        // totalSupply() returns the token counter, not the actual supply
        // After burning, the counter is still 1 (highest token ID minted)
        assertEq(maskSBT.totalSupply(), 1);
        assertFalse(maskSBT.isReceiptMinted(receiptHash));
    }

    function testBurnNonexistentToken() public {
        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(MaskSBT.NonexistentToken.selector, 1));
        maskSBT.burnReceipt(1);
        vm.stopPrank();
    }

    function testOnlyAdminCanBurn() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        vm.startPrank(minter);
        uint256 tokenId = maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        vm.startPrank(user);
        vm.expectRevert();
        maskSBT.burnReceipt(tokenId);
        vm.stopPrank();
    }

    function testToggleSBTMinting() public {
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit SBTMintingToggled(true);
        maskSBT.toggleSBTMinting(true);
        assertTrue(maskSBT.sbtMintingEnabled());

        vm.expectEmit(true, true, true, true);
        emit SBTMintingToggled(false);
        maskSBT.toggleSBTMinting(false);
        assertFalse(maskSBT.sbtMintingEnabled());
        vm.stopPrank();
    }

    function testOnlyAdminCanToggleSBTMinting() public {
        vm.startPrank(user);
        vm.expectRevert();
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();
    }

    function testToggleTransfer() public {
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit TransferToggled(true);
        maskSBT.toggleTransfer(true);
        assertTrue(maskSBT.transferEnabled());

        vm.expectEmit(true, true, true, true);
        emit TransferToggled(false);
        maskSBT.toggleTransfer(false);
        assertFalse(maskSBT.transferEnabled());
        vm.stopPrank();
    }

    function testOnlyAdminCanToggleTransfer() public {
        vm.startPrank(user);
        vm.expectRevert();
        maskSBT.toggleTransfer(true);
        vm.stopPrank();
    }

    function testTransfersDisabledByDefault() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        vm.startPrank(minter);
        uint256 tokenId = maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        vm.startPrank(user);
        vm.expectRevert(MaskSBT.TransfersDisabled.selector);
        maskSBT.transferFrom(user, rando, tokenId);

        vm.expectRevert(MaskSBT.TransfersDisabled.selector);
        maskSBT.safeTransferFrom(user, rando, tokenId);

        vm.expectRevert(MaskSBT.TransfersDisabled.selector);
        maskSBT.safeTransferFrom(user, rando, tokenId, "");

        vm.expectRevert(MaskSBT.ApprovalsDisabled.selector);
        maskSBT.approve(rando, tokenId);

        vm.expectRevert(MaskSBT.ApprovalsDisabled.selector);
        maskSBT.setApprovalForAll(rando, true);
        vm.stopPrank();
    }

    function testTransfersWhenEnabled() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        maskSBT.toggleTransfer(true);
        vm.stopPrank();

        vm.startPrank(minter);
        uint256 tokenId = maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        vm.startPrank(user);
        maskSBT.transferFrom(user, rando, tokenId);
        vm.stopPrank();

        assertEq(maskSBT.ownerOf(tokenId), rando);
        assertEq(maskSBT.balanceOf(user), 0);
        assertEq(maskSBT.balanceOf(rando), 1);
    }

    function testApprovalsWhenEnabled() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        maskSBT.toggleTransfer(true);
        vm.stopPrank();

        vm.startPrank(minter);
        uint256 tokenId = maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();

        vm.startPrank(user);
        maskSBT.approve(rando, tokenId);
        assertEq(maskSBT.getApproved(tokenId), rando);

        maskSBT.setApprovalForAll(rando, true);
        assertTrue(maskSBT.isApprovedForAll(user, rando));
        vm.stopPrank();
    }

    function testPauseUnpause() public {
        vm.startPrank(owner);
        maskSBT.pause();
        assertTrue(maskSBT.paused());

        maskSBT.unpause();
        assertFalse(maskSBT.paused());
        vm.stopPrank();
    }

    function testOnlyAdminCanPause() public {
        vm.startPrank(user);
        vm.expectRevert();
        maskSBT.pause();
        vm.stopPrank();
    }

    function testPausedContractBlocksMinting() public {
        bytes32 receiptHash = keccak256("test-receipt");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        maskSBT.pause();
        vm.stopPrank();

        vm.startPrank(minter);
        vm.expectRevert();
        maskSBT.mintReceipt(user, receiptHash);
        vm.stopPrank();
    }

    function testAccessorsForNonexistentToken() public {
        vm.expectRevert(abi.encodeWithSelector(MaskSBT.NonexistentToken.selector, 1));
        maskSBT.getReceiptHash(1);

        vm.expectRevert(abi.encodeWithSelector(MaskSBT.NonexistentToken.selector, 1));
        maskSBT.getMintTimestamp(1);

        vm.expectRevert(abi.encodeWithSelector(MaskSBT.NonexistentToken.selector, 1));
        maskSBT.getOriginalMinter(1);
    }

    function testSupportsInterface() public {
        assertTrue(maskSBT.supportsInterface(0x80ac58cd)); // IERC721
        assertTrue(maskSBT.supportsInterface(0x7965db0b)); // AccessControl
    }

    function testMultipleMints() public {
        bytes32 receiptHash1 = keccak256("receipt1");
        bytes32 receiptHash2 = keccak256("receipt2");

        vm.startPrank(owner);
        maskSBT.toggleSBTMinting(true);
        vm.stopPrank();

        vm.startPrank(minter);
        uint256 tokenId1 = maskSBT.mintReceipt(user, receiptHash1);
        uint256 tokenId2 = maskSBT.mintReceipt(user, receiptHash2);
        vm.stopPrank();

        assertEq(tokenId2, tokenId1 + 1);
        assertEq(maskSBT.balanceOf(user), 2);
        assertEq(maskSBT.totalSupply(), 2);
        assertTrue(maskSBT.isReceiptMinted(receiptHash1));
        assertTrue(maskSBT.isReceiptMinted(receiptHash2));
    }
}
