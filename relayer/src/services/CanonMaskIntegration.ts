/**
 * CanonMaskIntegration Service
 * Wires Mask SBT minting to Canon Registry anchoring events
 * Implements tokenId = keccak256(warrant||attest) as requested
 */

import { ethers } from 'ethers';
import { CanonService } from '../canon/CanonService';
import { SBTService } from '../sbt/SBTService';
import { logger } from '../utils/logger';

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
      logger.info('Starting Canon Registry event listening...');
      
      // Listen for Anchored events
      this.canonService.contract.on('Anchored', async (
        warrantDigest: string,
        attestationDigest: string,
        relayer: string,
        subjectTag: string,
        controllerDidHash: string,
        assurance: number,
        timestamp: number,
        event: ethers.Event
      ) => {
        const anchoredEvent: AnchoredEvent = {
          warrantDigest,
          attestationDigest,
          relayer,
          subjectTag,
          controllerDidHash,
          assurance,
          timestamp: timestamp.toNumber(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };

        await this.handleAnchoredEvent(anchoredEvent);
      });

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
      this.canonService.contract.removeAllListeners('Anchored');
      logger.info('Stopped Canon Registry event listening');
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
        transactionHash: event.transactionHash
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
        attestationDigest: event.attestationDigest
      });

      const mintTx = await this.sbtService.mintReceipt(recipient, receiptHash);
      await mintTx.wait();

      logger.info('Successfully minted Mask SBT:', {
        tokenId,
        recipient,
        receiptHash,
        transactionHash: mintTx.hash
      });

      // Notify event listeners
      await this.notifyEventListeners('maskMinted', {
        tokenId,
        recipient,
        receiptHash,
        warrantDigest: event.warrantDigest,
        attestationDigest: event.attestationDigest,
        canonEvent: event
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
    const combined = ethers.utils.solidityPack(['bytes32', 'bytes32'], [warrantDigest, attestationDigest]);
    return ethers.utils.keccak256(combined);
  }

  /**
   * Calculate receipt hash for the Mask SBT
   */
  private calculateReceiptHash(event: AnchoredEvent): string {
    // Create a comprehensive receipt hash that includes all relevant data
    const receiptData = ethers.utils.solidityPack(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint8', 'uint256'],
      [
        event.warrantDigest,
        event.attestationDigest,
        event.subjectTag,
        event.controllerDidHash,
        event.assurance,
        event.timestamp
      ]
    );
    return ethers.utils.keccak256(receiptData);
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get integration status
   */
  public getStatus(): {
    autoMintEnabled: boolean;
    mintingDelay: number;
    eventListenersCount: number;
  } {
    return {
      autoMintEnabled: this.autoMintEnabled,
      mintingDelay: this.mintingDelay,
      eventListenersCount: this.eventListeners.size
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
      const receiptHash = ethers.utils.keccak256(
        ethers.utils.solidityPack(['bytes32', 'bytes32'], [warrantDigest, attestationDigest])
      );

      // Mint the SBT
      const mintTx = await this.sbtService.mintReceipt(recipient, receiptHash);
      await mintTx.wait();

      logger.info('Manually minted Mask SBT:', {
        tokenId,
        recipient,
        receiptHash,
        transactionHash: mintTx.hash
      });

      return {
        tokenId,
        receiptHash,
        transactionHash: mintTx.hash
      };
    } catch (error) {
      logger.error('Failed to manually mint Mask SBT:', error);
      throw error;
    }
  }
}
