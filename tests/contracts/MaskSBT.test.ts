import { expect } from 'chai';
import hre from 'hardhat';
import type { MaskSBT } from '../../typechain-types';

const { ethers } = hre;

describe('MaskSBT', function () {
  let maskSBT: MaskSBT;
  let owner: any;
  let minter: any;
  let user: any;

  beforeEach(async function () {
    [owner, minter, user] = await ethers.getSigners();

    const MaskSBTFactory = await ethers.getContractFactory('MaskSBT');
    maskSBT = await MaskSBTFactory.deploy('Null Protocol Mask Receipts', 'MASK', owner.address);
    await maskSBT.waitForDeployment();

    // Grant minter role to the minter account
    await maskSBT.grantRole(await maskSBT.MINTER_ROLE(), minter.address);
  });

  describe('Deployment', function () {
    it('Should deploy with correct initial state', async function () {
      expect(await maskSBT.getAddress()).to.be.properAddress;
      expect(await maskSBT.name()).to.equal('Null Protocol Mask Receipts');
      expect(await maskSBT.symbol()).to.equal('MASK');
      expect(await maskSBT.sbtMintingEnabled()).to.be.false;
    });

    it('Should have correct role assignments', async function () {
      expect(await maskSBT.hasRole(await maskSBT.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await maskSBT.hasRole(await maskSBT.MINTER_ROLE(), owner.address)).to.be.true;
      expect(await maskSBT.hasRole(await maskSBT.MINTER_ROLE(), minter.address)).to.be.true;
    });
  });

  describe('SBT Minting', function () {
    beforeEach(async function () {
      // Enable SBT minting for tests
      await maskSBT.toggleSBTMinting(true);
    });

    it('Should mint SBT successfully', async function () {
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes('test-receipt'));

      await expect(maskSBT.connect(minter).mintReceipt(user.address, receiptHash))
        .to.emit(maskSBT, 'Transfer')
        .withArgs(ethers.ZeroAddress, user.address, 1);

      expect(await maskSBT.ownerOf(1)).to.equal(user.address);
      expect(await maskSBT.balanceOf(user.address)).to.equal(1);
    });

    it('Should not allow minting when disabled', async function () {
      await maskSBT.toggleSBTMinting(false);
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes('test-receipt'));

      await expect(
        maskSBT.connect(minter).mintReceipt(user.address, receiptHash)
      ).to.be.revertedWith('SBT minting is disabled for privacy');
    });

    it('Should only allow minter role to mint', async function () {
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes('test-receipt'));

      await expect(
        maskSBT.connect(user).mintReceipt(user.address, receiptHash)
      ).to.be.revertedWithCustomError(maskSBT, 'AccessControlUnauthorizedAccount');
    });

    it('Should increment token ID correctly', async function () {
      const receiptHash1 = ethers.keccak256(ethers.toUtf8Bytes('test-receipt-1'));
      const receiptHash2 = ethers.keccak256(ethers.toUtf8Bytes('test-receipt-2'));

      await maskSBT.connect(minter).mintReceipt(user.address, receiptHash1);
      await maskSBT.connect(minter).mintReceipt(user.address, receiptHash2);

      expect(await maskSBT.ownerOf(1)).to.equal(user.address);
      expect(await maskSBT.ownerOf(2)).to.equal(user.address);
      expect(await maskSBT.balanceOf(user.address)).to.equal(2);
    });
  });

  describe('Soulbound Properties', function () {
    beforeEach(async function () {
      await maskSBT.toggleSBTMinting(true);
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes('test-receipt'));
      await maskSBT.connect(minter).mintReceipt(user.address, receiptHash);
    });

    it('Should not allow transfers by default', async function () {
      await expect(
        maskSBT.connect(user).transferFrom(user.address, owner.address, 1)
      ).to.be.revertedWith('Transfers are disabled for SBTs');
    });

    it('Should not allow approvals by default', async function () {
      await expect(maskSBT.connect(user).approve(owner.address, 1)).to.be.revertedWith(
        'Approvals are disabled for SBTs'
      );
    });

    it('Should allow transfers when enabled', async function () {
      await maskSBT.toggleTransfer(true);

      await expect(maskSBT.connect(user).transferFrom(user.address, owner.address, 1))
        .to.emit(maskSBT, 'Transfer')
        .withArgs(user.address, owner.address, 1);

      expect(await maskSBT.ownerOf(1)).to.equal(owner.address);
    });
  });

  describe('Admin Functions', function () {
    it('Should allow admin to enable/disable SBT minting', async function () {
      expect(await maskSBT.sbtMintingEnabled()).to.be.false;

      await maskSBT.toggleSBTMinting(true);
      expect(await maskSBT.sbtMintingEnabled()).to.be.true;

      await maskSBT.toggleSBTMinting(false);
      expect(await maskSBT.sbtMintingEnabled()).to.be.false;
    });

    it('Should not allow non-admin to change SBT minting status', async function () {
      await expect(maskSBT.connect(user).toggleSBTMinting(true)).to.be.revertedWithCustomError(
        maskSBT,
        'AccessControlUnauthorizedAccount'
      );
    });

    it('Should allow admin to enable/disable transfers', async function () {
      expect(await maskSBT.transferEnabled()).to.be.false;

      await maskSBT.toggleTransfer(true);
      expect(await maskSBT.transferEnabled()).to.be.true;

      await maskSBT.toggleTransfer(false);
      expect(await maskSBT.transferEnabled()).to.be.false;
    });
  });

  describe('Pausable Functionality', function () {
    beforeEach(async function () {
      await maskSBT.toggleSBTMinting(true);
    });

    it('Should pause and unpause the contract', async function () {
      await maskSBT.pause();
      expect(await maskSBT.paused()).to.be.true;

      await maskSBT.unpause();
      expect(await maskSBT.paused()).to.be.false;
    });

    it('Should not allow minting when paused', async function () {
      await maskSBT.pause();
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes('test-receipt'));

      await expect(
        maskSBT.connect(minter).mintReceipt(user.address, receiptHash)
      ).to.be.revertedWithCustomError(maskSBT, 'EnforcedPause');
    });
  });
});
