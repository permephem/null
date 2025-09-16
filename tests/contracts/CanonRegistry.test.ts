import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import '@nomicfoundation/hardhat-chai-matchers';
import type { CanonRegistry } from '../../typechain-types';

const { ethers } = hre;

async function deployFixture() {
  const [owner, relayer, user, foundation, implementer] = await ethers.getSigners();

  const Factory = await ethers.getContractFactory('CanonRegistry');
  const c = (await Factory.deploy(
    foundation.address,
    implementer.address,
    owner.address
  )) as unknown as CanonRegistry;
  await c.waitForDeployment();

  const RELAYER_ROLE = await c.RELAYER_ROLE();
  const DEFAULT_ADMIN_ROLE = await c.DEFAULT_ADMIN_ROLE();
  const TREASURY_ROLE = await c.TREASURY_ROLE();

  await c.grantRole(RELAYER_ROLE, relayer.address);

  const toHash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

  return {
    c,
    owner,
    relayer,
    _user: user,
    foundation,
    implementer,
    _RELAYER_ROLE: RELAYER_ROLE,
    DEFAULT_ADMIN_ROLE,
    TREASURY_ROLE,
    toHash,
  };
}

describe('CanonRegistry', function () {
  describe('Deployment', function () {
    it('initializes correctly', async function () {
      const {
        c,
        owner,
        foundation,
        implementer,
        _RELAYER_ROLE,
        DEFAULT_ADMIN_ROLE,
        TREASURY_ROLE,
      } = await loadFixture(deployFixture);

      expect(await c.getAddress()).to.be.properAddress;
      expect(await c.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
      expect(await c.hasRole(TREASURY_ROLE, foundation.address)).to.equal(true);
      expect(await c.hasRole(TREASURY_ROLE, implementer.address)).to.equal(true);
      expect(await c.foundationTreasury()).to.equal(foundation.address);
      expect(await c.implementerTreasury()).to.equal(implementer.address);
    });

    it('rejects zero addresses in constructor', async function () {
      const [owner, foundation, implementer] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory('CanonRegistry');

      await expect(
        Factory.deploy(ethers.ZeroAddress, implementer.address, owner.address)
      ).to.be.revertedWithCustomError(Factory, 'ZeroAddress');

      await expect(
        Factory.deploy(foundation.address, ethers.ZeroAddress, owner.address)
      ).to.be.revertedWithCustomError(Factory, 'ZeroAddress');

      await expect(
        Factory.deploy(foundation.address, implementer.address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Factory, 'ZeroAddress');
    });
  });

  describe('Anchoring', function () {
    it('anchors events successfully with proper fees', async function () {
      const { c, relayer, _user, toHash } = await loadFixture(deployFixture);

      const warrantDigest = toHash('warrant');
      const attestationDigest = toHash('attestation');
      const subjectTag = toHash('subject-tag');
      const controllerDidHash = toHash('controller-did');

      await expect(
        c.connect(relayer).anchor(
          warrantDigest,
          attestationDigest,
          subjectTag,
          controllerDidHash,
          1, // assurance level
          { value: ethers.parseEther('0.001') }
        )
      ).to.emit(c, 'Anchored');

      expect(await c.isAnchored(warrantDigest)).to.equal(true);
      expect(await c.isAnchored(attestationDigest)).to.equal(true);
    });

    it('validates assurance level', async function () {
      const { c, relayer, toHash } = await loadFixture(deployFixture);

      await expect(
        c.connect(relayer).anchor(
          toHash('warrant'),
          toHash('attestation'),
          toHash('subject-tag'),
          toHash('controller-did'),
          3, // invalid assurance level
          { value: ethers.parseEther('0.001') }
        )
      )
        .to.be.revertedWithCustomError(c, 'InvalidAssuranceLevel')
        .withArgs(3);
    });

    it('validates minimum fee', async function () {
      const { c, relayer, toHash } = await loadFixture(deployFixture);

      await expect(
        c.connect(relayer).anchor(
          toHash('warrant'),
          toHash('attestation'),
          toHash('subject-tag'),
          toHash('controller-did'),
          1,
          { value: ethers.parseEther('0.0001') } // too low
        )
      )
        .to.be.revertedWithCustomError(c, 'InsufficientFee')
        .withArgs(ethers.parseEther('0.0001'), ethers.parseEther('0.001'));
    });

    it('requires RELAYER_ROLE', async function () {
      const { c, _user, toHash } = await loadFixture(deployFixture);

      await expect(
        c
          .connect(_user)
          .anchor(
            toHash('warrant'),
            toHash('attestation'),
            toHash('subject-tag'),
            toHash('controller-did'),
            1,
            { value: ethers.parseEther('0.001') }
          )
      ).to.be.revertedWithCustomError(c, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('Legacy anchoring functions', function () {
    it('validates fees in legacy functions', async function () {
      const { c, relayer, toHash } = await loadFixture(deployFixture);

      await expect(
        c
          .connect(relayer)
          .anchorWarrant(
            toHash('warrant'),
            toHash('subject'),
            toHash('enterprise'),
            'enterprise-123',
            'warrant-456',
            { value: ethers.parseEther('0.0001') }
          )
      ).to.be.revertedWithCustomError(c, 'InsufficientFee');
    });
  });

  describe('Fee Management', function () {
    it('allows fee withdrawal with balances', async function () {
      const { c, relayer, foundation, implementer, toHash } = await loadFixture(deployFixture);

      // Anchor to generate fees
      await c.connect(relayer).anchor(
        toHash('warrant'),
        toHash('attestation'),
        toHash('subject-tag'),
        toHash('controller-did'),
        1,
        { value: ethers.parseEther('0.013') } // 13 wei for clean division
      );

      // Check fee distribution
      expect(await c.balances(foundation.address)).to.equal(ethers.parseEther('0.001')); // 1/13
      expect(await c.balances(implementer.address)).to.equal(ethers.parseEther('0.012')); // 12/13

      // Test withdrawal
      const initialBalance = await ethers.provider.getBalance(foundation.address);
      await c.connect(foundation).withdraw();
      const finalBalance = await ethers.provider.getBalance(foundation.address);

      expect(finalBalance).to.be.greaterThan(initialBalance);
      expect(await c.balances(foundation.address)).to.equal(0);
    });

    it('rejects withdrawal with no balance', async function () {
      const { c, _user } = await loadFixture(deployFixture);

      await expect(c.connect(_user).withdraw()).to.be.revertedWithCustomError(c, 'NoBalance');
    });
  });

  describe('Admin functions', function () {
    it('validates treasury addresses', async function () {
      const { c, owner } = await loadFixture(deployFixture);

      await expect(
        c.connect(owner).setTreasuries(ethers.ZeroAddress, owner.address)
      ).to.be.revertedWithCustomError(c, 'InvalidTreasuryAddress');

      await expect(
        c.connect(owner).setTreasuries(owner.address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(c, 'InvalidTreasuryAddress');
    });

    it('validates emergency withdraw', async function () {
      const { c, owner } = await loadFixture(deployFixture);

      await expect(c.connect(owner).emergencyWithdraw()).to.be.revertedWithCustomError(
        c,
        'NoBalance'
      );
    });
  });

  describe('Interfaces', function () {
    it('supports AccessControl', async function () {
      const { c } = await loadFixture(deployFixture);
      expect(await c.supportsInterface('0x7965db0b')).to.equal(true); // AccessControl
    });
  });
});
