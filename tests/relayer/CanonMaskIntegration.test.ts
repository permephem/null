/**
 * CanonMaskIntegration Service Tests
 * Tests the integration between Canon Registry events and Mask SBT minting
 */

import { solidityPacked, keccak256 } from 'ethers';
import { CanonMaskIntegration, type CanonMaskIntegrationConfig } from '../../relayer/src/services/CanonMaskIntegration';
import { CanonService } from '../../relayer/src/canon/CanonService';
import { SBTService } from '../../relayer/src/sbt/SBTService';

// Mock the services
jest.mock('../../relayer/src/canon/CanonService');
jest.mock('../../relayer/src/sbt/SBTService');

describe('CanonMaskIntegration', () => {
  let integration: CanonMaskIntegration;
  let mockCanonService: jest.Mocked<CanonService>;
  let mockSBTService: jest.Mocked<SBTService>;
  let mockContract: any;

  beforeEach(() => {
    // Create mock contract
    mockContract = {
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    };

    // Create mock services
    mockCanonService = {
      contract: mockContract,
    } as any;

    mockSBTService = {
      isReceiptMinted: jest.fn(),
      mintReceipt: jest.fn(),
    } as any;

    const config: CanonMaskIntegrationConfig = {
      canonService: mockCanonService,
      sbtService: mockSBTService,
      autoMintEnabled: true,
      mintingDelay: 1000,
    };

    integration = new CanonMaskIntegration(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Listening', () => {
    it('should start event listening successfully', async () => {
      await integration.startEventListening();

      expect(mockContract.on).toHaveBeenCalledWith('Anchored', expect.any(Function));
    });

    it('should stop event listening successfully', async () => {
      await integration.stopEventListening();

      expect(mockContract.removeAllListeners).toHaveBeenCalledWith('Anchored');
    });
  });

  describe('Token ID Calculation', () => {
    it('should calculate tokenId as keccak256(warrant||attest)', async () => {
      const warrantDigest = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const attestationDigest = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

      // Calculate expected tokenId
      const combined = solidityPacked(['bytes32', 'bytes32'], [warrantDigest, attestationDigest]);
      const expectedTokenId = keccak256(combined);

      // Mock the manual mint function to test tokenId calculation
      mockSBTService.isReceiptMinted.mockResolvedValue(false);
      mockSBTService.mintReceipt.mockResolvedValue('0xtest');

      const result = await integration.manualMintForCanonEvent(
        warrantDigest,
        attestationDigest,
        '0xrecipient'
      );

      expect(result.tokenId).toBe(expectedTokenId);
    });
  });

  describe('Manual Minting', () => {
    it('should manually mint Mask SBT for Canon event', async () => {
      const warrantDigest = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const attestationDigest = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
      const recipient = '0xrecipient';

      mockSBTService.isReceiptMinted.mockResolvedValue(false);
      mockSBTService.mintReceipt.mockResolvedValue('0xtest');

      const result = await integration.manualMintForCanonEvent(
        warrantDigest,
        attestationDigest,
        recipient
      );

      expect(mockSBTService.isReceiptMinted).toHaveBeenCalledWith(result.tokenId);
      expect(mockSBTService.mintReceipt).toHaveBeenCalledWith(recipient, result.receiptHash);
      expect(result.transactionHash).toBe('0xtest');
    });

    it('should throw error if SBT already exists', async () => {
      const warrantDigest = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const attestationDigest = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
      const recipient = '0xrecipient';

      const combined = solidityPacked(['bytes32', 'bytes32'], [warrantDigest, attestationDigest]);
      const tokenId = keccak256(combined);

      mockSBTService.isReceiptMinted.mockResolvedValue(true);

      await expect(
        integration.manualMintForCanonEvent(warrantDigest, attestationDigest, recipient)
      ).rejects.toThrow(`Mask SBT already exists for tokenId: ${tokenId}`);
    });
  });

  describe('Event Handling', () => {
    it('should handle Anchored event and mint SBT when auto-minting enabled', async () => {
      const mockEvent = {
        warrantDigest: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attestationDigest: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        relayer: '0xrelayer',
        subjectTag: '0xsubject',
        controllerDidHash: '0xcontroller',
        assurance: 1,
        timestamp: 1234567890,
        blockNumber: 100,
        transactionHash: '0xtxhash',
      };

      mockSBTService.isReceiptMinted.mockResolvedValue(false);
      mockSBTService.mintReceipt.mockResolvedValue('0xtest');

      // Simulate event emission
      const eventHandler = mockContract.on.mock.calls[0][1];
      await eventHandler(
        mockEvent.warrantDigest,
        mockEvent.attestationDigest,
        mockEvent.relayer,
        mockEvent.subjectTag,
        mockEvent.controllerDidHash,
        mockEvent.assurance,
        { toNumber: () => mockEvent.timestamp },
        {
          blockNumber: mockEvent.blockNumber,
          transactionHash: mockEvent.transactionHash,
        }
      );

      expect(mockSBTService.isReceiptMinted).toHaveBeenCalled();
      expect(mockSBTService.mintReceipt).toHaveBeenCalled();
    });

    it('should skip minting when auto-minting disabled', async () => {
      const config: CanonMaskIntegrationConfig = {
        canonService: mockCanonService,
        sbtService: mockSBTService,
        autoMintEnabled: false,
        mintingDelay: 0,
      };

      const disabledIntegration = new CanonMaskIntegration(config);
      await disabledIntegration.startEventListening();

      const mockEvent = {
        warrantDigest: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attestationDigest: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        relayer: '0xrelayer',
        subjectTag: '0xsubject',
        controllerDidHash: '0xcontroller',
        assurance: 1,
        timestamp: 1234567890,
        blockNumber: 100,
        transactionHash: '0xtxhash',
      };

      // Simulate event emission
      const eventHandler = mockContract.on.mock.calls[0][1];
      await eventHandler(
        mockEvent.warrantDigest,
        mockEvent.attestationDigest,
        mockEvent.relayer,
        mockEvent.subjectTag,
        mockEvent.controllerDidHash,
        mockEvent.assurance,
        { toNumber: () => mockEvent.timestamp },
        {
          blockNumber: mockEvent.blockNumber,
          transactionHash: mockEvent.transactionHash,
        }
      );

      expect(mockSBTService.isReceiptMinted).not.toHaveBeenCalled();
      expect(mockSBTService.mintReceipt).not.toHaveBeenCalled();
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove event listeners', () => {
      const mockListener = jest.fn();

      integration.addEventListener('maskMinted', mockListener);
      expect(integration.getStatus().eventListenersCount).toBe(1);

      integration.removeEventListener('maskMinted');
      expect(integration.getStatus().eventListenersCount).toBe(0);
    });
  });

  describe('Status', () => {
    it('should return correct status', () => {
      const status = integration.getStatus();

      expect(status.autoMintEnabled).toBe(true);
      expect(status.mintingDelay).toBe(1000);
      expect(status.eventListenersCount).toBe(0);
    });
  });
});
