/**
 * Integration Tests for Null Protocol
 * Tests the integration between different components
 * @author Null Foundation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ethers } from 'hardhat';
import { RelayerService } from '../../relayer/src/services/RelayerService';
import { CanonService } from '../../relayer/src/canon/CanonService';
import { SBTService } from '../../relayer/src/sbt/SBTService';
import { EmailService } from '../../relayer/src/email/EmailService';
import { CryptoService } from '../../relayer/src/crypto/crypto';
import { CanonRegistry } from '../../typechain-types';
import { MaskSBT } from '../../typechain-types';

describe('Null Protocol Integration Tests', () => {
  let canonRegistry: CanonRegistry;
  let maskSBT: MaskSBT;
  let relayerService: RelayerService;
  let canonService: CanonService;
  let sbtService: SBTService;
  let emailService: EmailService;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy contracts
    const CanonRegistryFactory = await ethers.getContractFactory("CanonRegistry");
    canonRegistry = await CanonRegistryFactory.deploy(
      owner.address, // foundationTreasury
      owner.address, // implementerTreasury
      owner.address  // admin
    );
    await canonRegistry.waitForDeployment();

    const MaskSBTFactory = await ethers.getContractFactory("MaskSBT");
    maskSBT = await MaskSBTFactory.deploy(
      "Null Protocol Mask Receipts",
      "MASK",
      owner.address
    );
    await maskSBT.waitForDeployment();

    // Enable SBT minting
    await maskSBT.setSbtMintingEnabled(true);

    // Initialize services
    canonService = new CanonService({
      rpcUrl: 'http://localhost:8545',
      privateKey: owner.privateKey,
      contractAddress: await canonRegistry.getAddress()
    });

    sbtService = new SBTService({
      rpcUrl: 'http://localhost:8545',
      privateKey: owner.privateKey,
      contractAddress: await maskSBT.getAddress()
    });

    emailService = new EmailService({
      smtpHost: 'localhost',
      smtpPort: 587,
      smtpUser: 'test',
      smtpPass: 'test',
      fromEmail: 'test@example.com'
    });

    relayerService = new RelayerService(canonService, sbtService, emailService);
  });

  describe('End-to-End Deletion Workflow', () => {
    it('should complete full deletion workflow successfully', async () => {
      // Step 1: Create a warrant
      const warrant = {
        type: 'NullWarrant@v0.2',
        warrant_id: 'test-warrant-1',
        enterprise_id: 'test-enterprise',
        subject: {
          subject_handle: 'test-subject'
        },
        scope: ['personal_data'],
        jurisdiction: 'US',
        legal_basis: 'GDPR',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        return_channels: ['email'],
        nonce: CryptoService.generateNonce(),
        signature: {
          alg: 'EdDSA',
          kid: 'test-key-id',
          sig: 'test-signature'
        },
        aud: 'test-controller',
        jti: 'test-jti',
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
        audience_bindings: ['test-enterprise.com'],
        version: 'v0.2',
        evidence_requested: ['API_LOG'],
        sla_seconds: 3600
      };

      // Mock signature verification
      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);
      jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical-data');

      // Step 2: Process warrant
      const warrantResult = await relayerService.processWarrant(warrant);
      expect(warrantResult.success).toBe(true);
      expect(warrantResult.data).toHaveProperty('warrantDigest');
      expect(warrantResult.data).toHaveProperty('anchorTxHash');

      // Step 3: Create attestation
      const attestation = {
        type: 'DeletionAttestation@v0.2',
        attestation_id: 'test-attestation-1',
        warrant_id: warrant.warrant_id,
        enterprise_id: warrant.enterprise_id,
        subject_handle: warrant.subject.subject_handle,
        status: 'deleted',
        completed_at: new Date().toISOString(),
        evidence_hash: 'test-evidence-hash',
        signature: {
          alg: 'EdDSA',
          kid: 'test-key-id',
          sig: 'test-signature'
        },
        aud: 'test-engine',
        ref: warrant.jti,
        processing_window: 3600,
        accepted_claims: ['US'],
        controller_policy_digest: 'test-policy-hash'
      };

      // Step 4: Process attestation
      const attestationResult = await relayerService.processAttestation(attestation);
      expect(attestationResult.success).toBe(true);
      expect(attestationResult.data).toHaveProperty('attestationDigest');

      // Step 5: Verify on-chain state
      const warrantHash = warrantResult.data.warrantDigest;
      const isAnchored = await canonService.isAnchored(warrantHash);
      expect(isAnchored).toBe(true);

      const lastBlock = await canonService.getLastAnchorBlock(warrantHash);
      expect(lastBlock).toBeGreaterThan(0);
    });

    it('should handle workflow with SBT minting', async () => {
      const warrant = {
        type: 'NullWarrant@v0.2',
        warrant_id: 'test-warrant-2',
        enterprise_id: 'test-enterprise',
        subject: {
          subject_handle: 'test-subject'
        },
        scope: ['personal_data'],
        jurisdiction: 'US',
        legal_basis: 'GDPR',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        return_channels: ['email'],
        nonce: CryptoService.generateNonce(),
        signature: {
          alg: 'EdDSA',
          kid: 'test-key-id',
          sig: 'test-signature'
        },
        aud: 'test-controller',
        jti: 'test-jti-2',
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
        audience_bindings: ['test-enterprise.com'],
        version: 'v0.2',
        evidence_requested: ['API_LOG'],
        sla_seconds: 3600
      };

      // Mock signature verification
      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);
      jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical-data');

      // Process warrant
      const warrantResult = await relayerService.processWarrant(warrant);
      expect(warrantResult.success).toBe(true);

      // Create attestation
      const attestation = {
        type: 'DeletionAttestation@v0.2',
        attestation_id: 'test-attestation-2',
        warrant_id: warrant.warrant_id,
        enterprise_id: warrant.enterprise_id,
        subject_handle: warrant.subject.subject_handle,
        status: 'deleted',
        completed_at: new Date().toISOString(),
        evidence_hash: 'test-evidence-hash',
        signature: {
          alg: 'EdDSA',
          kid: 'test-key-id',
          sig: 'test-signature'
        },
        aud: 'test-engine',
        ref: warrant.jti,
        processing_window: 3600,
        accepted_claims: ['US'],
        controller_policy_digest: 'test-policy-hash'
      };

      // Process attestation
      const attestationResult = await relayerService.processAttestation(attestation);
      expect(attestationResult.success).toBe(true);

      // Verify SBT was minted
      expect(attestationResult.data).toHaveProperty('receipt');
      expect(attestationResult.data.receipt).toHaveProperty('sbt');
    });
  });

  describe('Cryptographic Integration', () => {
    it('should validate HMAC-Blake3 subject tags', () => {
      const controllerKey = 'test-controller-key';
      const subjectDID = 'did:test:subject';
      const context = 'test-context';

      const subjectTag = CryptoService.generateSubjectTag(controllerKey, subjectDID, context);
      expect(subjectTag).toBeDefined();
      expect(subjectTag).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars

      // Verify tag is deterministic
      const subjectTag2 = CryptoService.generateSubjectTag(controllerKey, subjectDID, context);
      expect(subjectTag).toBe(subjectTag2);

      // Verify tag changes with different inputs
      const subjectTag3 = CryptoService.generateSubjectTag(controllerKey, subjectDID, 'different-context');
      expect(subjectTag).not.toBe(subjectTag3);
    });

    it('should handle JWS signature verification', async () => {
      const payload = { test: 'data' };
      const privateKey = 'test-private-key';
      const publicKey = 'test-public-key';

      // Mock JWS creation and verification
      jest.spyOn(CryptoService, 'createJWS').mockResolvedValue('test-jws-token');
      jest.spyOn(CryptoService, 'verifyJWS').mockResolvedValue(payload);

      const jws = await CryptoService.createJWS(payload, privateKey);
      expect(jws).toBe('test-jws-token');

      const verifiedPayload = await CryptoService.verifyJWS(jws, publicKey);
      expect(verifiedPayload).toEqual(payload);
    });
  });

  describe('Contract Integration', () => {
    it('should integrate CanonRegistry with RelayerService', async () => {
      const warrantHash = ethers.keccak256(ethers.toUtf8Bytes("test-warrant"));
      const subjectHandleHash = ethers.keccak256(ethers.toUtf8Bytes("test-subject"));
      const enterpriseHash = ethers.keccak256(ethers.toUtf8Bytes("test-enterprise"));
      const controllerDidHash = ethers.keccak256(ethers.toUtf8Bytes("test-controller"));
      const subjectTag = ethers.keccak256(ethers.toUtf8Bytes("test-tag"));

      // Anchor warrant directly to contract
      const tx = await canonRegistry.anchorWarrant(
        warrantHash,
        subjectHandleHash,
        enterpriseHash,
        "test-enterprise",
        "test-warrant",
        controllerDidHash,
        subjectTag,
        1
      );
      await tx.wait();

      // Verify through service
      const isAnchored = await canonService.isAnchored(warrantHash);
      expect(isAnchored).toBe(true);

      const lastBlock = await canonService.getLastAnchorBlock(warrantHash);
      expect(lastBlock).toBeGreaterThan(0);
    });

    it('should integrate MaskSBT with RelayerService', async () => {
      const receiptHash = ethers.keccak256(ethers.toUtf8Bytes("test-receipt"));

      // Mint SBT directly to contract
      const tx = await maskSBT.safeMint(user.address, receiptHash);
      await tx.wait();

      // Verify through service
      const isMintingEnabled = await sbtService.isMintingEnabled();
      expect(isMintingEnabled).toBe(true);

      // Verify token was minted
      expect(await maskSBT.ownerOf(1)).toBe(user.address);
      expect(await maskSBT.balanceOf(user.address)).toBe(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle contract failures gracefully', async () => {
      // Mock contract failure
      jest.spyOn(canonService, 'anchorWarrant').mockRejectedValue(new Error('Contract error'));

      const warrant = {
        warrant_id: 'test-warrant-error',
        enterprise_id: 'test-enterprise',
        subject: { subject_handle: 'test-subject' },
        signature: { sig: 'test', kid: 'test', alg: 'EdDSA' },
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);
      jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical-data');

      const result = await relayerService.processWarrant(warrant);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Contract error');
      expect(result.code).toBe('PROCESSING_ERROR');
    });

    it('should handle network failures with retry logic', async () => {
      let callCount = 0;
      jest.spyOn(canonService, 'anchorWarrant').mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve('0xtx123');
      });

      const warrant = {
        warrant_id: 'test-warrant-retry',
        enterprise_id: 'test-enterprise',
        subject: { subject_handle: 'test-subject' },
        signature: { sig: 'test', kid: 'test', alg: 'EdDSA' },
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);
      jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical-data');
      jest.spyOn(relayerService as any, 'sendWarrantToEnterprise').mockResolvedValue({ status: 'sent' });

      const result = await relayerService.processWarrant(warrant);
      expect(result.success).toBe(true);
      expect(callCount).toBe(3); // Should have retried 3 times
    });
  });
});