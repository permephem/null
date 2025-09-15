import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RelayerService } from '../../relayer/src/services/RelayerService';
import { CanonService } from '../../relayer/src/canon/CanonService';
import { SBTService } from '../../relayer/src/sbt/SBTService';
import { EmailService } from '../../relayer/src/email/EmailService';
import { CryptoService } from '../../relayer/src/crypto/crypto';

// Mock the services
jest.mock('../../relayer/src/canon/CanonService');
jest.mock('../../relayer/src/sbt/SBTService');
jest.mock('../../relayer/src/email/EmailService');
jest.mock('../../relayer/src/crypto/crypto');

describe('RelayerService', () => {
  let relayerService: RelayerService;
  let mockCanonService: jest.Mocked<CanonService>;
  let mockSBTService: jest.Mocked<SBTService>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
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

    relayerService = new RelayerService(mockCanonService, mockSBTService, mockEmailService);
  });

  describe('processWarrant', () => {
    it('should process a valid warrant successfully', async () => {
      const mockWarrant = {
        type: 'NullWarrant@v0.2' as const,
        warrant_id: 'test-warrant-1',
        enterprise_id: 'test-enterprise',
        subject: {
          subject_handle: 'test-subject',
          anchors: [],
        },
        scope: ['personal_data'],
        jurisdiction: 'US',
        legal_basis: 'GDPR',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        return_channels: {
          email: 'test@example.com',
          callback_url: 'https://example.com/callback',
        },
        nonce: 'test-nonce',
        signature: {
          sig: 'test-signature',
          kid: 'test-key-id',
          alg: 'ed25519' as const,
        },
        aud: 'test-controller',
        jti: 'test-jti',
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
        audience_bindings: ['test-enterprise.com'],
        version: 'v0.2',
        evidence_requested: ['API_LOG'],
        sla_seconds: 3600,
      };

      // Mock successful validation
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });

      // Mock successful anchoring
      mockCanonService.anchorWarrant.mockResolvedValue('0xtx123');

      // Mock successful enterprise communication
      jest
        .spyOn(relayerService as any, 'sendWarrantToEnterprise')
        .mockResolvedValue({ status: 'sent' });

      const result = await relayerService.processWarrant(mockWarrant);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('warrantDigest');
      expect(result.data).toHaveProperty('subjectTag');
      expect(result.data).toHaveProperty('anchorTxHash');
      expect(mockCanonService.anchorWarrant).toHaveBeenCalled();
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
      const mockWarrant = {
        type: 'NullWarrant@v0.2' as const,
        warrant_id: 'test-warrant-1',
        enterprise_id: 'test-enterprise',
        subject: {
          subject_handle: 'test-subject',
          anchors: [],
        },
        scope: ['personal_data'],
        jurisdiction: 'US',
        legal_basis: 'GDPR',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        return_channels: {
          email: 'test@example.com',
          callback_url: 'https://example.com/callback',
        },
        nonce: 'test-nonce',
        signature: {
          sig: 'test-signature',
          kid: 'test-key-id',
          alg: 'ed25519' as const,
        },
        aud: 'test-controller',
        jti: 'test-jti',
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
        audience_bindings: ['test-enterprise.com'],
        version: 'v0.2',
        evidence_requested: ['API_LOG'],
        sla_seconds: 3600,
      };

      // Mock successful validation
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });

      // Mock anchoring failure
      mockCanonService.anchorWarrant.mockRejectedValue(new Error('Network error'));

      const result = await relayerService.processWarrant(mockWarrant);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to anchor warrant after 3 attempts');
      expect(result.code).toBe('PROCESSING_ERROR');
    });
  });

  describe('cryptographic validation', () => {
    it('should validate signatures correctly', async () => {
      const mockWarrant = {
        warrant_id: 'test-warrant-1',
        enterprise_id: 'test-enterprise',
        subject: {
          subject_handle: 'test-subject',
        },
        signature: {
          sig: 'valid-signature',
          kid: 'test-key-id',
          alg: 'EdDSA',
        },
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Mock successful signature verification
      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(true);
      jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical-data');

      const validation = await (relayerService as any).validateWarrant(mockWarrant);

      expect(validation.valid).toBe(true);
      expect(CryptoService.verifySignature).toHaveBeenCalledWith(
        'canonical-data',
        'valid-signature',
        'test-key-id',
        'EdDSA'
      );
    });

    it('should reject invalid signatures', async () => {
      const mockWarrant = {
        type: 'NullWarrant@v0.2' as const,
        warrant_id: 'test-warrant-1',
        enterprise_id: 'test-enterprise',
        subject: {
          subject_handle: 'test-subject',
          anchors: [],
        },
        scope: ['personal_data'],
        jurisdiction: 'US',
        legal_basis: 'GDPR',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        return_channels: {
          email: 'test@example.com',
          callback_url: 'https://example.com/callback',
        },
        nonce: 'test-nonce',
        signature: {
          sig: 'invalid-signature',
          kid: 'test-key-id',
          alg: 'ed25519' as const,
        },
        aud: 'test-controller',
        jti: 'test-jti',
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
        audience_bindings: ['test-enterprise.com'],
        version: 'v0.2',
        evidence_requested: ['API_LOG'],
        sla_seconds: 3600,
      };

      // Mock failed signature verification
      jest.spyOn(CryptoService, 'verifySignature').mockResolvedValue(false);
      jest.spyOn(CryptoService, 'canonicalizeJSON').mockReturnValue('canonical-data');

      const validation = await (relayerService as any).validateWarrant(mockWarrant);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Invalid signature');
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const mockWarrant = {
        type: 'NullWarrant@v0.2' as const,
        warrant_id: 'test-warrant-1',
        enterprise_id: 'test-enterprise',
        subject: {
          subject_handle: 'test-subject',
          anchors: [],
        },
        scope: ['personal_data'],
        jurisdiction: 'US',
        legal_basis: 'GDPR',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        return_channels: {
          email: 'test@example.com',
          callback_url: 'https://example.com/callback',
        },
        nonce: 'test-nonce',
        signature: {
          sig: 'test-signature',
          kid: 'test-key-id',
          alg: 'ed25519' as const,
        },
        aud: 'test-controller',
        jti: 'test-jti',
        nbf: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600,
        audience_bindings: ['test-enterprise.com'],
        version: 'v0.2',
        evidence_requested: ['API_LOG'],
        sla_seconds: 3600,
      };

      // Mock successful validation
      jest.spyOn(relayerService as any, 'validateWarrant').mockResolvedValue({ valid: true });

      // Mock timeout error
      mockCanonService.anchorWarrant.mockRejectedValue(new Error('Request timeout'));

      const result = await relayerService.processWarrant(mockWarrant);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
      expect(result.code).toBe('PROCESSING_ERROR');
    });
  });
});
