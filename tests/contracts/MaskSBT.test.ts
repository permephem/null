import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import '@nomicfoundation/hardhat-chai-matchers';
// anyValue will be available from hardhat-chai-matchers
import type { MaskSBT } from '../../typechain-types';

const { ethers } = hre;

async function deployFixture() {
  const [owner, minter, user, rando] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory('MaskSBT');
  const c = (await Factory.deploy(
    'Null Protocol Mask Receipts',
    'MASK',
    owner.address
  )) as unknown as MaskSBT;
  await c.waitForDeployment();

  const MINTER_ROLE = await c.MINTER_ROLE();
  const DEFAULT_ADMIN_ROLE = await c.DEFAULT_ADMIN_ROLE();

  await c.grantRole(MINTER_ROLE, minter.address);

  const toHash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

  const mintTo = async (to: string, label = 'test-receipt') => {
    const h = toHash(label);
    const tx = await c.connect(minter).mintReceipt(to, h);
    const rc = await tx.wait();
    // Find Transfer(tokenId) robustly
    const log = rc!.logs.find((l: any) => l.fragment?.name === 'Transfer');
    const tokenId = log?.args?.tokenId ?? 1n;
    return { tokenId: Number(tokenId), receiptHash: h };
  };

  return { c, owner, minter, user, rando, MINTER_ROLE, DEFAULT_ADMIN_ROLE, toHash, mintTo };
}

describe('MaskSBT', function () {
  describe('Deployment', function () {
    it('initializes correctly', async function () {
      const { c, owner, MINTER_ROLE, DEFAULT_ADMIN_ROLE } = await loadFixture(deployFixture);
      expect(await c.getAddress()).to.be.properAddress;
      expect(await c.name()).to.equal('Null Protocol Mask Receipts');
      expect(await c.symbol()).to.equal('MASK');
      expect(await c.sbtMintingEnabled()).to.equal(false);

      expect(await c.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
      expect(await c.hasRole(MINTER_ROLE, owner.address)).to.equal(true);
    });
  });

  describe('Minting (SBT)', function () {
    it('mints only when enabled and only by MINTER_ROLE', async function () {
      const { c, minter, user, toHash } = await loadFixture(deployFixture);

      // Disabled by default
      await expect(
        c.connect(minter).mintReceipt(user.address, toHash('x'))
      ).to.be.revertedWithCustomError(c, 'SBTMintingDisabled');

      await c.toggleSBTMinting(true);

      const receiptHash = toHash('a');
      await expect(c.connect(minter).mintReceipt(user.address, receiptHash)).to.emit(
        c,
        'ReceiptMinted'
      );

      await expect(
        c.connect(user).mintReceipt(user.address, toHash('b'))
      ).to.be.revertedWithCustomError(c, 'AccessControlUnauthorizedAccount');
    });

    it('increments token IDs and balances', async function () {
      const { c, user, mintTo } = await loadFixture(deployFixture);
      await c.toggleSBTMinting(true);
      const { tokenId: t1 } = await mintTo(user.address, 'r1');
      const { tokenId: t2 } = await mintTo(user.address, 'r2');

      expect(t2).to.equal(t1 + 1);
      expect(await c.ownerOf(t1)).to.equal(user.address);
      expect(await c.ownerOf(t2)).to.equal(user.address);
      expect(await c.balanceOf(user.address)).to.equal(2);
      expect(await c.totalSupply()).to.equal(t2);
    });

    it('validates mint inputs', async function () {
      const { c, minter, toHash } = await loadFixture(deployFixture);
      await c.toggleSBTMinting(true);

      await expect(
        c.connect(minter).mintReceipt(ethers.ZeroAddress, toHash('x'))
      ).to.be.revertedWithCustomError(c, 'MintToZeroAddress');

      await expect(
        c.connect(minter).mintReceipt(minter.address, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(c, 'InvalidReceiptHash');
    });
  });

  describe('Receipt metadata', function () {
    it('guards accessors for nonexistent tokens', async function () {
      const { c } = await loadFixture(deployFixture);

      await expect(c.getReceiptHash(1))
        .to.be.revertedWithCustomError(c, 'NonexistentToken')
        .withArgs(1n);
      await expect(c.getMintTimestamp(1))
        .to.be.revertedWithCustomError(c, 'NonexistentToken')
        .withArgs(1n);
      await expect(c.getOriginalMinter(1))
        .to.be.revertedWithCustomError(c, 'NonexistentToken')
        .withArgs(1n);
    });
  });

  describe('Soulbound enforcement', function () {
    it('blocks transfer/approval surfaces by default', async function () {
      const { c, user, owner, mintTo } = await loadFixture(deployFixture);
      await c.toggleSBTMinting(true);
      const { tokenId } = await mintTo(user.address);

      // transferFrom
      await expect(
        c.connect(user).transferFrom(user.address, owner.address, tokenId)
      ).to.be.revertedWithCustomError(c, 'TransfersDisabled');

      // safeTransferFrom (no data)
      await expect(
        c.connect(user).safeTransferFrom(user.address, owner.address, tokenId)
      ).to.be.revertedWithCustomError(c, 'TransfersDisabled');

      // safeTransferFrom (with data)
      await expect(
        c.connect(user)['safeTransferFrom(address,address,uint256,bytes)'](
          user.address,
          owner.address,
          tokenId,
          '0x'
        )
      ).to.be.revertedWithCustomError(c, 'TransfersDisabled');

      // approvals
      await expect(c.connect(user).approve(owner.address, tokenId)).to.be.revertedWithCustomError(
        c,
        'ApprovalsDisabled'
      );

      await expect(
        c.connect(user).setApprovalForAll(owner.address, true)
      ).to.be.revertedWithCustomError(c, 'ApprovalsDisabled');
    });

    it('allows transfer when toggled on, then blocks again when toggled off', async function () {
      const { c, user, owner, mintTo } = await loadFixture(deployFixture);
      await c.toggleSBTMinting(true);
      const { tokenId } = await mintTo(user.address);

      await c.toggleTransfer(true);
      await expect(c.connect(user).transferFrom(user.address, owner.address, tokenId))
        .to.emit(c, 'Transfer')
        .withArgs(user.address, owner.address, tokenId);

      await c.toggleTransfer(false);
      await expect(
        c.connect(owner).transferFrom(owner.address, user.address, tokenId)
      ).to.be.revertedWithCustomError(c, 'TransfersDisabled');
    });
  });

  describe('Admin & AccessControl', function () {
    it('restricts toggles and role admin ops', async function () {
      const { c, user, rando, minter, MINTER_ROLE } = await loadFixture(deployFixture);

      await expect(c.connect(user).toggleSBTMinting(true)).to.be.revertedWithCustomError(
        c,
        'AccessControlUnauthorizedAccount'
      );
      await expect(c.connect(user).toggleTransfer(true)).to.be.revertedWithCustomError(
        c,
        'AccessControlUnauthorizedAccount'
      );

      await expect(c.connect(minter).toggleSBTMinting(true)).to.be.revertedWithCustomError(
        c,
        'AccessControlUnauthorizedAccount'
      );
      await expect(c.connect(minter).toggleTransfer(true)).to.be.revertedWithCustomError(
        c,
        'AccessControlUnauthorizedAccount'
      );

      await expect(
        c.connect(rando).grantRole(MINTER_ROLE, rando.address)
      ).to.be.revertedWithCustomError(c, 'AccessControlUnauthorizedAccount');

      await expect(
        c.connect(rando).revokeRole(MINTER_ROLE, minter.address)
      ).to.be.revertedWithCustomError(c, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('Pausable', function () {
    it('only admin can pause/unpause; pause blocks minting', async function () {
      const { c, owner, user, minter, toHash } = await loadFixture(deployFixture);
      await c.toggleSBTMinting(true);

      await expect(c.connect(user).pause()).to.be.revertedWithCustomError(
        c,
        'AccessControlUnauthorizedAccount'
      );
      await expect(c.connect(minter).pause()).to.be.revertedWithCustomError(
        c,
        'AccessControlUnauthorizedAccount'
      );

      await c.connect(owner).pause();
      expect(await c.paused()).to.equal(true);

      await expect(c.connect(user).unpause()).to.be.revertedWithCustomError(
        c,
        'AccessControlUnauthorizedAccount'
      );
      await expect(c.connect(minter).unpause()).to.be.revertedWithCustomError(
        c,
        'AccessControlUnauthorizedAccount'
      );

      await expect(
        c.connect(minter).mintReceipt(user.address, toHash('x'))
      ).to.be.revertedWithCustomError(c, 'EnforcedPause');

      await c.connect(owner).unpause();
      expect(await c.paused()).to.equal(false);
    });
  });

  describe('Interfaces', function () {
    it('supports IERC721 and AccessControl', async function () {
      const { c } = await loadFixture(deployFixture);
      expect(await c.supportsInterface('0x80ac58cd')).to.equal(true); // IERC721
      expect(await c.supportsInterface('0x7965db0b')).to.equal(true); // AccessControl
    });
  });
});
