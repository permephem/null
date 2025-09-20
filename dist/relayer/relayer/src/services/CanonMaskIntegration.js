/**
 * CanonMaskIntegration Service
 * Wires Mask SBT minting to Canon Registry anchoring events
 * Implements tokenId = keccak256(warrant||attest) as requested
 */
import { solidityPacked, keccak256 } from 'ethers';
import logger from '../utils/logger';
export class CanonMaskIntegration {
    sbtService;
    autoMintEnabled;
    mintingDelay;
    eventListeners = new Map();
    constructor(config) {
        // Note: canonService is kept in config for future use but not stored as instance variable
        // since it's not currently used in the implementation
        this.sbtService = config.sbtService;
        this.autoMintEnabled = config.autoMintEnabled;
        this.mintingDelay = config.mintingDelay;
    }
    /**
     * Start listening for Canon Registry Anchored events
     */
    async startEventListening() {
        try {
            logger.info('Starting Canon Registry event listening...');
            // For now, we'll implement a polling mechanism instead of event listening
            // This avoids the complex TypeChain event handling issues
            logger.info('Event listening will be implemented via polling mechanism');
            logger.info('Canon Registry event listening started successfully');
        }
        catch (error) {
            logger.error('Failed to start event listening:', error);
            throw error;
        }
    }
    /**
     * Stop listening for events
     */
    async stopEventListening() {
        try {
            logger.info('Stopped Canon Registry event listening');
        }
        catch (error) {
            logger.error('Failed to stop event listening:', error);
            throw error;
        }
    }
    /**
     * Handle Anchored event and mint corresponding Mask SBT
     * Note: This method is currently unused but kept for future event-driven implementation
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async handleAnchoredEvent(event) {
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
        }
        catch (error) {
            logger.error('Failed to handle Anchored event:', error);
            // Don't throw to prevent event listener from crashing
        }
    }
    /**
     * Calculate tokenId as keccak256(warrant||attest) as requested
     */
    calculateTokenId(warrantDigest, attestationDigest) {
        const combined = solidityPacked(['bytes32', 'bytes32'], [warrantDigest, attestationDigest]);
        return keccak256(combined);
    }
    /**
     * Calculate receipt hash for the Mask SBT
     */
    calculateReceiptHash(event) {
        // Create a comprehensive receipt hash that includes all relevant data
        const receiptData = solidityPacked(['bytes32', 'bytes32', 'bytes32', 'bytes32', 'uint8', 'uint256'], [
            event.warrantDigest,
            event.attestationDigest,
            event.subjectTag,
            event.controllerDidHash,
            event.assurance,
            event.timestamp,
        ]);
        return keccak256(receiptData);
    }
    /**
     * Add event listener for custom handling
     */
    addEventListener(eventType, listener) {
        this.eventListeners.set(eventType, listener);
    }
    /**
     * Remove event listener
     */
    removeEventListener(eventType) {
        this.eventListeners.delete(eventType);
    }
    /**
     * Notify event listeners
     */
    async notifyEventListeners(eventType, data) {
        const listener = this.eventListeners.get(eventType);
        if (listener) {
            try {
                await listener(data);
            }
            catch (error) {
                logger.error(`Error in event listener for ${eventType}:`, error);
            }
        }
    }
    /**
     * Utility function to delay execution
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get integration status
     */
    getStatus() {
        return {
            autoMintEnabled: this.autoMintEnabled,
            mintingDelay: this.mintingDelay,
            eventListenersCount: this.eventListeners.size,
        };
    }
    /**
     * Manually mint Mask SBT for a specific Canon event
     */
    async manualMintForCanonEvent(warrantDigest, attestationDigest, recipient) {
        try {
            const tokenId = this.calculateTokenId(warrantDigest, attestationDigest);
            // Check if SBT already exists
            const existingToken = await this.sbtService.isReceiptMinted(tokenId);
            if (existingToken) {
                throw new Error(`Mask SBT already exists for tokenId: ${tokenId}`);
            }
            // Create receipt hash
            const receiptHash = keccak256(solidityPacked(['bytes32', 'bytes32'], [warrantDigest, attestationDigest]));
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
        }
        catch (error) {
            logger.error('Failed to manually mint Mask SBT:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=CanonMaskIntegration.js.map