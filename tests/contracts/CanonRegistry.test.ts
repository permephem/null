import { expect } from 'chai';
import hre from 'hardhat';
import type { CanonRegistry } from '../../typechain-types';

const { ethers } = hre;

describe('CanonRegistry', function () {
  let canonRegistry: CanonRegistry;
  let owner: any;
  let _relayer: any;
  let user: any;

  beforeEach(async function () {
    [owner, _relayer, user] = await ethers.getSigners();

    const CanonRegistryFactory = await ethers.getContractFactory('CanonRegistry');
    canonRegistry = await CanonRegistryFactory.deploy(
      owner.address, // foundationTreasury
      owner.address, // implementerTreasury
      owner.address // admin
    );
    await canonRegistry.waitForDeployment();

    // Grant RELAYER_ROLE to owner for testing
    await canonRegistry.grantRole(await canonRegistry.RELAYER_ROLE(), owner.address);
  });

  describe('Deployment', function () {
    it('Should deploy with correct initial state', async function () {
      expect(await canonRegistry.getAddress()).to.be.properAddress;
      expect(await canonRegistry.hasRole(await canonRegistry.DEFAULT_ADMIN_ROLE(), owner.address))
        .to.be.true;
    });

    it('Should have correct role assignments', async function () {
      expect(await canonRegistry.hasRole(await canonRegistry.DEFAULT_ADMIN_ROLE(), owner.address))
        .to.be.true;
    });
  });

  describe('Warrant Anchoring', function () {
    it('Should anchor a warrant successfully', async function () {
      const warrantHash = ethers.keccak256(ethers.toUtf8Bytes('test-warrant'));
      const subjectHandleHash = ethers.keccak256(ethers.toUtf8Bytes('test-subject'));
      const enterpriseHash = ethers.keccak256(ethers.toUtf8Bytes('test-enterprise'));
      const _controllerDidHash = ethers.keccak256(ethers.toUtf8Bytes('test-controller'));
      const _subjectTag = ethers.keccak256(ethers.toUtf8Bytes('test-tag'));

      await expect(
        canonRegistry.anchorWarrant(
          warrantHash,
          subjectHandleHash,
          enterpriseHash,
          'test-enterprise',
          'test-warrant',
          { value: ethers.parseEther('0.01') } // Pay the base fee
        )
      ).to.emit(canonRegistry, 'WarrantAnchored');
    });

    it('Should only allow admin to anchor warrants', async function () {
      const warrantHash = ethers.keccak256(ethers.toUtf8Bytes('test-warrant'));
      const subjectHandleHash = ethers.keccak256(ethers.toUtf8Bytes('test-subject'));
      const enterpriseHash = ethers.keccak256(ethers.toUtf8Bytes('test-enterprise'));
      const _controllerDidHash = ethers.keccak256(ethers.toUtf8Bytes('test-controller'));
      const _subjectTag = ethers.keccak256(ethers.toUtf8Bytes('test-tag'));

      await expect(
        canonRegistry
          .connect(user)
          .anchorWarrant(
            warrantHash,
            subjectHandleHash,
            enterpriseHash,
            'test-enterprise',
            'test-warrant',
            { value: ethers.parseEther('0.01') }
          )
      ).to.be.revertedWithCustomError(canonRegistry, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('Query Functions', function () {
    it('Should return correct last anchor block', async function () {
      const warrantHash = ethers.keccak256(ethers.toUtf8Bytes('test-warrant'));
      const subjectHandleHash = ethers.keccak256(ethers.toUtf8Bytes('test-subject'));
      const enterpriseHash = ethers.keccak256(ethers.toUtf8Bytes('test-enterprise'));
      const _controllerDidHash = ethers.keccak256(ethers.toUtf8Bytes('test-controller'));
      const _subjectTag = ethers.keccak256(ethers.toUtf8Bytes('test-tag'));

      const tx = await canonRegistry.anchorWarrant(
        warrantHash,
        subjectHandleHash,
        enterpriseHash,
        'test-enterprise',
        'test-warrant',
        { value: ethers.parseEther('0.01') }
      );
      const receipt = await tx.wait();
      const blockNumber = receipt!.blockNumber;

      expect(await canonRegistry.lastAnchorBlock(warrantHash)).to.equal(blockNumber);
    });

    it('Should return zero for non-existent hash', async function () {
      const nonExistentHash = ethers.keccak256(ethers.toUtf8Bytes('non-existent'));
      expect(await canonRegistry.lastAnchorBlock(nonExistentHash)).to.equal(0);
    });
  });
});
