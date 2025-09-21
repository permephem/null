/**
 * CanonMaskIntegration Service
 * Wires Mask SBT minting to Canon Registry anchoring events
 * Implements tokenId = keccak256(warrant||attest) as requested
 */

import { solidityPacked, keccak256 } from 'ethers';
import { CanonService } from '../canon/CanonService';
import { SBTService } from '../sbt/SBTService';
import logger from '../utils/logger';

export interface CanonMaskIntegrationConfig {
  canonService: CanonService;
  sbtService: SBTService;
  autoMintEnabled: boolean;
  mintingDelay: number; // Delay in milliseconds before minting
}

export interface AnchoredEvent {
  warrantDigest: string;
  attestationDigest: string;
  relayer: string;
  subjectTag: string;
  controllerDidHash: string;
  assurance: number;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export class CanonMaskIntegration {
  private canonService: CanonService;
  private sbtService: SBTService;
  private autoMintEnabled: boolean;
  private mintingDelay: number;
  private eventListeners: Map<string, (event: AnchoredEvent) => Promise<void>> = new Map();
  private isListening: boolean = false;
  private anchoredEventListener?: (event: any) => Promise<void>;

  constructor(config: CanonMaskIntegrationConfig) {
    this.canonService = config.canonService;
    this.sbtService = config.sbtService;
    this.autoMintEnabled = config.autoMintEnabled;
    this.mintingDelay = config.mintingDelay;
  }

  /**
   * Start listening for Canon Registry Anchored events
   */
  public async startEventListening(): Promise<void> {
    try {
      if (this.isListening) {
        logger.warn('Event listening is already active');
        return;
      }

      logger.info('Starting Canon Registry event listening...');

      const contract = this.canonService.getContract();
      if (!contract) {
        throw new Error('CanonRegistry contract not available');
      }

      // Create the event listener function
      this.anchoredEventListener = async (event: any) => {
        try {
          logger.info('Received Anchored event from CanonRegistry:', {
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            warrantDigest: event.args?.warrantDigest,
            attestationDigest: event.args?.attestationDigest,
            relayer: event.args?.relayer,
            assurance: event.args?.assurance,
          });

          // Transform the raw event into our AnchoredEvent interface
          const anchoredEvent: AnchoredEvent = {
            warrantDigest: event.args?.warrantDigest || '',
            attestationDigest: event.args?.attestationDigest || '',
            relayer: event.args?.relayer || '',
            subjectTag: event.args?.subjectTag || '',
            controllerDidHash: event.args?.controllerDidHash || '',
            assurance: event.args?.assurance || 0,
            timestamp: event.args?.timestamp || 0,
            blockNumber: event.blockNumber || 0,
            transactionHash: event.transactionHash || '',
          };

          // Handle the event
          await this.handleAnchoredEvent(anchoredEvent);
        } catch (error) {
          logger.error('Error processing Anchored event:', error);
          // Don't throw to prevent event listener from crashing
        }
      };

      // Set up the event listener
      contract.on('Anchored', this.anchoredEventListener);

      this.isListening = true;
      logger.info('Canon Registry event listening started successfully');
    } catch (error) {
      logger.error('Failed to start event listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening for events
   */
  public async stopEventListening(): Promise<void> {
    try {
      if (!this.isListening) {
        logger.warn('Event listening is not active');
        return;
      }

      logger.info('Stopping Canon Registry event listening...');

      const contract = this.canonService.getContract();
      if (contract && this.anchoredEventListener) {
        // Remove the specific event listener
        contract.off('Anchored', this.anchoredEventListener);
        this.anchoredEventListener = undefined;
      }

      this.isListening = false;
      logger.info('Canon Registry event listening stopped successfully');
    } catch (error) {
      logger.error('Failed to stop event listening:', error);
      throw error;
    }
  }

  /**
   * Handle Anchored event and mint corresponding Mask SBT
   */
  private async handleAnchoredEvent(event: AnchoredEvent): Promise<void> {
    try {
      logger.info('Processing Anchored event:', {
        warrantDigest: event.warrantDigest,
        attestationDigest: event.attestationDigest,
        relayer: event.relayer,
        assurance: event.assurance,
        transactionHash: event.transactionHash,
      });

      if (!this.autoMintEnabled) {
        logger.info('Auto-minting disabled, skipping Mask SBT minting');
        return;
      }

      // Calculate tokenId as keccak256(warrant||attest) as requested
      const tokenId = this.calculateTokenId(event.warrantDigest, event.attestationDigest);

      // Add delay if configured
      if (this.mintingDelay > 0) {
        await this.delay(this.mintingDelay);
      }

      // Check if SBT already exists for this tokenId
      const existingToken = await this.sbtService.isReceiptMinted(tokenId);
      if (existingToken) {
        logger.warn('Mask SBT already exists for tokenId:', tokenId);
        return;
      }

      // Mint the Mask SBT
      const receiptHash = this.calculateReceiptHash(event);
      const recipient = event.relayer; // Use relayer as recipient, or implement custom logic

      logger.info('Minting Mask SBT:', {
        tokenId,
        recipient,
        receiptHash,
        warrantDigest: event.warrantDigest,
        attestationDigest: event.attestationDigest,
      });

      const transactionHash = await this.sbtService.mintReceipt(recipient, receiptHash);

      logger.info('Successfully minted Mask SBT:', {
        tokenId,
        recipient,
        receiptHash,
        transactionHash,
      });

      // Notify event listeners
      await this.notifyEventListeners('maskMinted', {
        tokenId,
        recipient,
        receiptHash,
        warrantDigest: event.warrantDigest,
        attestationDigest: event.attestationDigest,
        canonEvent: event,
      });
    } catch (error) {
      logger.error('Failed to handle Anchored event:', error);
      // Don't throw to prevent event listener from crashing
    }
  }

  /**
   * Calculate tokenId as keccak256(warrant||attest) as requested
   */
  private calculateTokenId(warrantDigest: string, attestationDigest: string): string {
    const combined = solidityPacked(['bytes32', 'bytes32'], [warrantDigest, attestationDigest]);
    return keccak256(combined);
  }

  /**
   * Calculate receipt hash for the Mask SBT
   */
  private calculateReceiptHash(event: AnchoredEvent): string {
    // Create a comprehensive receipt hash that includes all relevant data
    const receiptData = solidityPacked(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint8', 'uint256'],
      [
        event.warrantDigest,
        event.attestationDigest,
        event.subjectTag,
        event.controllerDidHash,
        event.assurance,
        event.timestamp,
      ]
    );
    return keccak256(receiptData);
  }

  /**
   * Add event listener for custom handling
   */
  public addEventListener(eventType: string, listener: (data: any) => Promise<void>): void {
    this.eventListeners.set(eventType, listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(eventType: string): void {
    this.eventListeners.delete(eventType);
  }

  /**
   * Notify event listeners
   */
  private async notifyEventListeners(eventType: string, data: any): Promise<void> {
    const listener = this.eventListeners.get(eventType);
    if (listener) {
      try {
        await listener(data);
      } catch (error) {
        logger.error(`Error in event listener for ${eventType}:`, error);
      }
    }
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get integration status
   */
  public getStatus(): {
    autoMintEnabled: boolean;
    mintingDelay: number;
    eventListenersCount: number;
    isListening: boolean;
  } {
    return {
      autoMintEnabled: this.autoMintEnabled,
      mintingDelay: this.mintingDelay,
      eventListenersCount: this.eventListeners.size,
      isListening: this.isListening,
    };
  }

  /**
   * Manually mint Mask SBT for a specific Canon event
   */
  public async manualMintForCanonEvent(
    warrantDigest: string,
    attestationDigest: string,
    recipient: string
  ): Promise<{ tokenId: string; receiptHash: string; transactionHash: string }> {
    try {
      const tokenId = this.calculateTokenId(warrantDigest, attestationDigest);

      // Check if SBT already exists
      const existingToken = await this.sbtService.isReceiptMinted(tokenId);
      if (existingToken) {
        throw new Error(`Mask SBT already exists for tokenId: ${tokenId}`);
      }

      // Create receipt hash
      const receiptHash = keccak256(
        solidityPacked(['bytes32', 'bytes32'], [warrantDigest, attestationDigest])
      );

      // Mint the SBT
      const transactionHash = await this.sbtService.mintReceipt(recipient, receiptHash);

      logger.info('Manually minted Mask SBT:', {
        tokenId,
        recipient,
        receiptHash,
        transactionHash,
      });

      return {
        tokenId,
        receiptHash,
        transactionHash,
      };
    } catch (error) {
      logger.error('Failed to manually mint Mask SBT:', error);
      throw error;
    }
  }
}
