/**
 * CanonMaskIntegration Service Tests
 * Tests the integration between Canon Registry events and Mask SBT minting
 */

import { solidityPacked, keccak256, isHexString } from 'ethers';
import {
  CanonMaskIntegration,
  type CanonMaskIntegrationConfig,
} from '../../relayer/src/services/CanonMaskIntegration';
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
      off: jest.fn(),
    };

    // Create mock services
    mockCanonService = {
      getContract: jest.fn(() => mockContract),
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
      await integration.startEventListening();
      await integration.stopEventListening();

      const anchoredListener = mockContract.on.mock.calls.find(
        ([eventName]) => eventName === 'Anchored'
      )?.[1];

      expect(mockContract.off).toHaveBeenCalledWith('Anchored', anchoredListener);
    });
  });


  describe('Manual Minting', () => {
    it('should manually mint Mask SBT for Canon event', async () => {
      const warrantDigest = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const attestationDigest =
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
      const recipient = '0xrecipient';

      mockSBTService.isReceiptMinted.mockResolvedValue(false);
      mockSBTService.mintReceipt.mockResolvedValue({
        transactionHash: '0xtest',
        tokenId: '123',
      });

      const result = await integration.manualMintForCanonEvent(
        warrantDigest,
        attestationDigest,
        recipient
      );

      const expectedReceiptHash = keccak256(
        solidityPacked(['bytes32', 'bytes32'], [warrantDigest, attestationDigest])
      );

      expect(mockSBTService.isReceiptMinted).toHaveBeenCalledWith(expectedReceiptHash);
      expect(mockSBTService.mintReceipt).toHaveBeenCalledWith(recipient, result.receiptHash);
      expect(result.transactionHash).toBe('0xtest');
      expect(result.tokenId).toBe('123');
      expect(isHexString(result.receiptHash, 32)).toBe(true);
    });

    it('should throw error if SBT already exists', async () => {
      const warrantDigest = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const attestationDigest =
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
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
        relayer: '0x3333333333333333333333333333333333333333',
        subjectTag: '0x4444444444444444444444444444444444444444444444444444444444444444',
        controllerDidHash: '0x5555555555555555555555555555555555555555555555555555555555555555',
        assurance: 1,
        timestamp: 1234567890,
        blockNumber: 100,
        transactionHash: '0x6666666666666666666666666666666666666666666666666666666666666666',
      };

      mockSBTService.isReceiptMinted.mockResolvedValue(false);
      mockSBTService.mintReceipt.mockResolvedValue('0xtest');

      await integration.startEventListening();

      const anchoredListener = mockContract.on.mock.calls.find(
        ([eventName]) => eventName === 'Anchored'
      )?.[1];

      expect(anchoredListener).toBeDefined();

      await anchoredListener?.({
        args: {
          warrantDigest: mockEvent.warrantDigest,
          attestationDigest: mockEvent.attestationDigest,
          relayer: mockEvent.relayer,
          subjectTag: mockEvent.subjectTag,
          controllerDidHash: mockEvent.controllerDidHash,
          assurance: mockEvent.assurance,
          timestamp: mockEvent.timestamp,
        },
        blockNumber: mockEvent.blockNumber,
        transactionHash: mockEvent.transactionHash,
      });

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
        relayer: '0x3333333333333333333333333333333333333333',
        subjectTag: '0x4444444444444444444444444444444444444444444444444444444444444444',
        controllerDidHash: '0x5555555555555555555555555555555555555555555555555555555555555555',
        assurance: 1,
        timestamp: 1234567890,
        blockNumber: 100,
        transactionHash: '0x6666666666666666666666666666666666666666666666666666666666666666',
      };

      const anchoredListener = mockContract.on.mock.calls.find(
        ([eventName]) => eventName === 'Anchored'
      )?.[1];

      expect(anchoredListener).toBeDefined();

      await anchoredListener?.({
        args: {
          warrantDigest: mockEvent.warrantDigest,
          attestationDigest: mockEvent.attestationDigest,
          relayer: mockEvent.relayer,
          subjectTag: mockEvent.subjectTag,
          controllerDidHash: mockEvent.controllerDidHash,
          assurance: mockEvent.assurance,
          timestamp: mockEvent.timestamp,
        },
        blockNumber: mockEvent.blockNumber,
        transactionHash: mockEvent.transactionHash,
      });

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
