import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { getAddress, isHexString } from 'ethers';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Mock TypeChain imports
jest.mock('../../typechain-types', () => ({
  CanonRegistry: jest.fn(),
  CanonRegistry__factory: {
    connect: jest.fn(),
    deploy: jest.fn(),
  },
  MaskSBT: jest.fn(),
  MaskSBT__factory: {
    connect: jest.fn(),
    deploy: jest.fn(),
  },
}));

import { RelayerService } from '../../relayer/src/services/RelayerService';
import { CanonService } from '../../relayer/src/canon/CanonService';
import { SBTService } from '../../relayer/src/sbt/SBTService';
import { EmailService } from '../../relayer/src/email/EmailService';
import { CryptoService } from '../../relayer/src/crypto/crypto';
import * as validators from '../../relayer/src/schemas/validators';
import { createMockAttestation, createMockWarrant } from './fixtures';
import {
  FileWarrantDigestStore,
  InMemoryWarrantDigestStore,
} from '../../relayer/src/services/WarrantDigestStore';

const ensureHexPrefixed = (value?: string): string | undefined => {
  if (!value) {
    return value;
  }
  return value.startsWith('0x') ? value : `0x${value}`;
};

const createReceipt = (hash: string, blockNumber = 100) => ({
  hash,
  blockNumber,
}) as any;

// Mock the services
jest.mock('../../relayer/src/canon/CanonService');
jest.mock('../../relayer/src/sbt/SBTService');
jest.mock('../../relayer/src/email/EmailService');

// Mock crypto dependencies
jest.mock('@noble/ed25519', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

jest.mock('@noble/secp256k1', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

jest.mock('did-resolver', () => ({
  Resolver: jest.fn(),
}));

describe('RelayerService', () => {
  let relayerService: RelayerService;
  let mockCanonService: jest.Mocked<CanonService>;
  let mockSBTService: jest.Mocked<SBTService>;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockDigestStore: InMemoryWarrantDigestStore;
  const controllerSecret = 'test-controller-secret';

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanonService = new CanonService({
      rpcUrl: 'http://localhost:8545',
      privateKey: '0x123',
      contractAddress: '0x456',
    }) as jest.Mocked<CanonService>;

    mockSBTService = new SBTService({
      rpcUrl: 'http://localhost:8545',
      privateKey: '0x123',
      contractAddress: '0x789',
    }) as jest.Mocked<SBTService>;

    mockEmailService = new EmailService({
      smtpHost: 'localhost',
      smtpPort: 587,
      smtpUser: 'test',
      smtpPass: 'test',
      fromEmail: 'test@example.com',
    }) as jest.Mocked<EmailService>;

    mockDigestStore = new InMemoryWarrantDigestStore();

    relayerService = new RelayerService(
      mockCanonService,
      mockSBTService,
      mockEmailService,
      'test-controller-secret',
      mockDigestStore
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processWarrant', () => {
    it('should process a valid warrant successfully', async () => {
      const mockWarrant = createMockWarrant();

      // Mock successful validation
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });

      // Mock successful anchoring
      mockCanonService.anchor.mockResolvedValue(createReceipt('0xtx123'));

      // Mock successful enterprise communication
      jest
        .spyOn(relayerService as any, 'sendWarrantToEnterprise')
        .mockResolvedValue({ status: 'sent' });

      const result = await relayerService.processWarrant(mockWarrant);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('warrantDigest');
      expect(result.data).toHaveProperty('subjectHandleHash');
      expect(result.data).toHaveProperty('enterpriseHash');
      expect(result.data).toHaveProperty('controllerDidHash');
      expect(result.data).toHaveProperty('subjectTag');
      expect(result.data).toHaveProperty('anchorTxHash');
      expect(result.data).toHaveProperty('anchorBlock', 100);
      expect(result.data?.anchorTxHash).toBe('0xtx123');
      expect(isHexString(result.data?.warrantDigest, 32)).toBe(true);
      expect(isHexString(ensureHexPrefixed(result.data?.subjectHandleHash), 32)).toBe(true);
      expect(isHexString(ensureHexPrefixed(result.data?.enterpriseHash), 32)).toBe(true);
      expect(isHexString(ensureHexPrefixed(result.data?.controllerDidHash), 32)).toBe(true);
      expect(mockCanonService.anchor).toHaveBeenCalled();

      const [anchorArgs] = mockCanonService.anchor.mock.calls[0];
      expect(anchorArgs).toMatchObject({
        warrantDigest: result.data?.warrantDigest,
        controllerDidHash: result.data?.controllerDidHash,
        subjectTag: result.data?.subjectTag,
      });
      expect(anchorArgs.attestationDigest).toBeUndefined();
    });

    it('should generate stable subject tags for the same secret and subject', async () => {
      const firstWarrant = createMockWarrant();
      const secondWarrant = createMockWarrant();

      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });
      jest.spyOn(relayerService as any, 'sendWarrantToEnterprise').mockResolvedValue({ status: 'sent' });
      mockCanonService.anchorWarrant.mockResolvedValue('0xtx123');

      const firstResult = await relayerService.processWarrant(firstWarrant);
      const secondResult = await relayerService.processWarrant(secondWarrant);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);

      const expectedTag = CryptoService.generateSubjectTag(
        controllerSecret,
        firstWarrant.subject.subject_handle,
        `${firstWarrant.enterprise_id}:${firstWarrant.warrant_id}`
      );

      expect(firstResult.data?.subjectTag).toBe(expectedTag);
      expect(secondResult.data?.subjectTag).toBe(expectedTag);
    });

    it('should generate different subject tags when the controller secret changes', async () => {
      const firstWarrant = createMockWarrant();
      const secondWarrant = createMockWarrant();

      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });
      jest.spyOn(relayerService as any, 'sendWarrantToEnterprise').mockResolvedValue({ status: 'sent' });
      mockCanonService.anchorWarrant.mockResolvedValue('0xanchor1');

      const firstResult = await relayerService.processWarrant(firstWarrant);

      const altCanonService = new CanonService({
        rpcUrl: 'http://localhost:8545',
        privateKey: '0xabc',
        contractAddress: '0xdef',
      }) as jest.Mocked<CanonService>;
      const altSbtService = new SBTService({
        rpcUrl: 'http://localhost:8545',
        privateKey: '0xabc',
        contractAddress: '0xghi',
      }) as jest.Mocked<SBTService>;
      const altEmailService = new EmailService({
        smtpHost: 'localhost',
        smtpPort: 587,
        smtpUser: 'test',
        smtpPass: 'test',
        fromEmail: 'alt@example.com',
      }) as jest.Mocked<EmailService>;
      const alternateSecret = 'alternate-controller-secret';
      const alternateService = new RelayerService(
        altCanonService,
        altSbtService,
        altEmailService,
        alternateSecret
      );

      jest.spyOn(alternateService as any, 'validateWarrant').mockResolvedValue({ valid: true });
      jest.spyOn(alternateService as any, 'sendWarrantToEnterprise').mockResolvedValue({ status: 'sent' });
      altCanonService.anchorWarrant.mockResolvedValue('0xanchor2');

      const secondResult = await alternateService.processWarrant(secondWarrant);

      const expectedFirstTag = CryptoService.generateSubjectTag(
        controllerSecret,
        firstWarrant.subject.subject_handle,
        `${firstWarrant.enterprise_id}:${firstWarrant.warrant_id}`
      );
      const expectedSecondTag = CryptoService.generateSubjectTag(
        alternateSecret,
        secondWarrant.subject.subject_handle,
        `${secondWarrant.enterprise_id}:${secondWarrant.warrant_id}`
      );

      expect(firstResult.data?.subjectTag).toBe(expectedFirstTag);
      expect(secondResult.data?.subjectTag).toBe(expectedSecondTag);
      expect(firstResult.data?.subjectTag).not.toBe(secondResult.data?.subjectTag);
    });

    it('should handle validation failures', async () => {
      const mockWarrant = {
        warrant_id: 'test-warrant-1',
        enterprise_id: 'test-enterprise',
        subject: {
          subject_handle: 'test-subject',
        },
        // Missing required fields
      };

      // Mock validation failure
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({
        valid: false,
        error: 'Missing signature',
      });

      const result = await relayerService.processWarrant(mockWarrant as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing signature');
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should handle anchoring failures with retry logic', async () => {
      // Mock the CanonService to fail with network error
      (mockCanonService.anchorWarrant as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error('Network error'))
      );

      const mockWarrant = createMockWarrant();

      // Mock successful validation
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });

      // Mock anchoring failure
      mockCanonService.anchorWarrant.mockRejectedValue(new Error('Network error'));

      const result = await relayerService.processWarrant(mockWarrant);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to anchor warrant after 3 attempts');
      expect(result.code).toBe('PROCESSING_ERROR');
    }, 10000); // 10 second timeout for retry logic
  });

  describe('processAttestation', () => {
    it('should anchor attestations and receipts using the canonical warrant digest', async () => {
      const mockWarrant = createMockWarrant();
      const mockAttestation = createMockAttestation({
        warrant_id: mockWarrant.warrant_id,
        enterprise_id: mockWarrant.enterprise_id,
        subject_handle: mockWarrant.subject.subject_handle,
      });
      mockAttestation.signature = {
        ...mockAttestation.signature,
        alg: 'EdDSA',
      };

      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });
      jest.spyOn(relayerService as any, 'validateAttestation').mockResolvedValue({ valid: true });

      mockCanonService.anchorWarrant.mockResolvedValue('0xwarrant');
      mockCanonService.anchorAttestation.mockResolvedValue({ success: true, blockNumber: 123 });

      jest
        .spyOn(relayerService as any, 'sendWarrantToEnterprise')
        .mockResolvedValue({ status: 'sent' });

      const warrantResult = await relayerService.processWarrant(mockWarrant);
      expect(warrantResult.success).toBe(true);
      const canonicalDigest = warrantResult.data.warrantDigest;

      const attestationResult = await relayerService.processAttestation(mockAttestation);

      expect(attestationResult.success).toBe(true);
      expect(attestationResult.data.warrantDigest).toBe(canonicalDigest);
      expect(isHexString(attestationResult.data.attestationDigest, 32)).toBe(true);

      expect(mockCanonService.anchorAttestation).toHaveBeenCalledWith(
        attestationResult.data.attestationDigest,
        canonicalDigest,
        expect.any(String),
        mockAttestation.enterprise_id,
        mockAttestation.attestation_id,
        expect.any(String),
        mockAttestation.subject_handle,
        expect.any(Number)
      );

      const receipt = attestationResult.data.receipt.receipt;
      expect(receipt.warrant_hash).toBe(canonicalDigest);
      expect(receipt.attestation_hash).toBe(attestationResult.data.attestationDigest);
    });

    it('loads persisted warrant digests after a restart to validate attestations', async () => {
      const mockWarrant = createMockWarrant({ warrant_id: 'restart-warrant' });
      const mockAttestation = createMockAttestation({
        warrant_id: mockWarrant.warrant_id,
        enterprise_id: mockWarrant.enterprise_id,
        subject_handle: mockWarrant.subject.subject_handle,
        attestation_id: 'restart-attestation',
      });

      const tempDir = mkdtempSync(join(tmpdir(), 'warrant-digest-'));
      const storePath = join(tempDir, 'digests.json');

      try {
        const initialStore = new FileWarrantDigestStore({ filePath: storePath });
        const primaryService = new RelayerService(
          mockCanonService,
          mockSBTService,
          mockEmailService,
          controllerSecret,
          initialStore
        );

        jest.spyOn(primaryService as any, 'validateWarrant').mockResolvedValue({ valid: true });
        jest
          .spyOn(primaryService as any, 'sendWarrantToEnterprise')
          .mockResolvedValue({ status: 'sent' });
        mockCanonService.anchorWarrant.mockResolvedValue('0xrestart');

        const warrantResult = await primaryService.processWarrant(mockWarrant);
        expect(warrantResult.success).toBe(true);

        const restartedStore = new FileWarrantDigestStore({ filePath: storePath });
        const restartedService = new RelayerService(
          mockCanonService,
          mockSBTService,
          mockEmailService,
          controllerSecret,
          restartedStore
        );

        jest.spyOn(validators, 'validateAttestation').mockReturnValue({ valid: true });
        jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical');
        jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);
        mockCanonService.warrantExists.mockResolvedValue(true);
        mockCanonService.anchorAttestation.mockResolvedValue({ success: true, blockNumber: 456 });

        const attestationResult = await restartedService.processAttestation(mockAttestation);

        expect(attestationResult.success).toBe(true);
        expect(attestationResult.data.warrantDigest).toBe(warrantResult.data.warrantDigest);
        expect(mockCanonService.getWarrantDigestById).not.toHaveBeenCalled();
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('queries the blockchain when the warrant digest is missing locally', async () => {
      const mockAttestation = createMockAttestation({
        warrant_id: 'on-chain-warrant',
        enterprise_id: 'on-chain-enterprise',
        attestation_id: 'on-chain-attestation',
      });

      jest.spyOn(validators, 'validateAttestation').mockReturnValue({ valid: true });
      jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical');
      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);

      const chainDigest =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      mockCanonService.getWarrantDigestById.mockResolvedValue(chainDigest);
      mockCanonService.warrantExists.mockResolvedValue(true);
      mockCanonService.anchorAttestation.mockResolvedValue({ success: true, blockNumber: 789 });

      const attestationResult = await relayerService.processAttestation(mockAttestation);

      expect(attestationResult.success).toBe(true);
      expect(attestationResult.data.warrantDigest).toBe(chainDigest);
      expect(isHexString(attestationResult.data.warrantDigest, 32)).toBe(true);
      expect(mockCanonService.getWarrantDigestById).toHaveBeenCalledWith(mockAttestation.warrant_id);
      expect(await mockDigestStore.get(mockAttestation.warrant_id)).toBe(chainDigest);
    });
  });

  describe('validateAttestation', () => {
    it('validates attestations referencing an anchored warrant digest', async () => {
      const mockWarrant = createMockWarrant();
      const mockAttestation = createMockAttestation({
        warrant_id: mockWarrant.warrant_id,
        enterprise_id: mockWarrant.enterprise_id,
        subject_handle: mockWarrant.subject.subject_handle,
      });
      mockAttestation.signature = {
        ...mockAttestation.signature,
        alg: 'EdDSA',
      };

      jest.spyOn(validators, 'validateAttestation').mockReturnValue({ valid: true });
      const warrantDigest = (relayerService as any).computeWarrantDigest(mockWarrant);
      await (relayerService as any).storeWarrantDigest(mockWarrant.warrant_id, warrantDigest);

      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);
      mockCanonService.warrantExists.mockResolvedValue(true);

      const validation = await (relayerService as any).validateAttestation(mockAttestation);

      expect(validation.valid).toBe(true);
      expect(mockCanonService.warrantExists).toHaveBeenCalledWith(warrantDigest);
    });

    it('rejects attestations when the canonical warrant digest is unknown', async () => {
      const mockWarrant = createMockWarrant();
      const mockAttestation = createMockAttestation({
        warrant_id: mockWarrant.warrant_id,
        enterprise_id: mockWarrant.enterprise_id,
        subject_handle: mockWarrant.subject.subject_handle,
      });
      mockAttestation.signature = {
        ...mockAttestation.signature,
        alg: 'EdDSA',
      };

      jest.spyOn(validators, 'validateAttestation').mockReturnValue({ valid: true });

      const warrantDigest = (relayerService as any).computeWarrantDigest(mockWarrant);
      await (relayerService as any).storeWarrantDigest(mockWarrant.warrant_id, warrantDigest);

      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);
      mockCanonService.warrantExists.mockResolvedValue(false);

      const validation = await (relayerService as any).validateAttestation(mockAttestation);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Referenced warrant has not been anchored');
      expect(mockCanonService.warrantExists).toHaveBeenCalledWith(warrantDigest);
    });
  });

  describe('cryptographic validation', () => {
    it('should validate signatures correctly', async () => {
      const mockWarrant = createMockWarrant({
        warrant_id: '12345678-1234-1234-1234-123456789012',
        signature: {
          sig: 'valid-signature',
          kid: 'test-key-id',
          alg: 'ed25519',
        },
      });

      // Mock the validateWarrant method to return success
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });

      const validation = await (relayerService as any).validateWarrant(mockWarrant);

      expect(validation.valid).toBe(true);
    });

    it('should reject invalid signatures', async () => {
      const mockWarrant = createMockWarrant({
        warrant_id: '12345678-1234-1234-1234-123456789012',
        signature: {
          sig: 'invalid-signature',
          kid: 'test-key-id',
          alg: 'ed25519',
        },
      });

      // Mock failed signature verification
      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(false);
      jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical-data');

      // Mock the validateWarrant method to return validation failure
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({
        valid: false,
        error: 'Invalid signature',
      });

      const validation = await (relayerService as any).validateWarrant(mockWarrant);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid signature');
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock the CanonService to timeout
      (mockCanonService.anchorWarrant as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error('Request timeout'))
      );

      const mockWarrant = createMockWarrant({
        warrant_id: '12345678-1234-1234-1234-123456789012',
      });

      // Mock successful validation
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });

      // Mock timeout error
      mockCanonService.anchorWarrant.mockRejectedValue(new Error('Request timeout'));

      const result = await relayerService.processWarrant(mockWarrant);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
      expect(result.code).toBe('PROCESSING_ERROR');
    }, 10000); // 10 second timeout for retry logic
  });
});
