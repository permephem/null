/**
 * CanonMaskIntegration Service
 * Wires Mask SBT minting to Canon Registry anchoring events
 * Implements tokenId = keccak256(warrant||attest) as requested
 */
import { CanonService } from '../canon/CanonService';
import { SBTService } from '../sbt/SBTService';
export interface CanonMaskIntegrationConfig {
    canonService: CanonService;
    sbtService: SBTService;
    autoMintEnabled: boolean;
    mintingDelay: number;
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
export declare class CanonMaskIntegration {
    private sbtService;
    private autoMintEnabled;
    private mintingDelay;
    private eventListeners;
    constructor(config: CanonMaskIntegrationConfig);
    /**
     * Start listening for Canon Registry Anchored events
     */
    startEventListening(): Promise<void>;
    /**
     * Stop listening for events
     */
    stopEventListening(): Promise<void>;
    /**
     * Handle Anchored event and mint corresponding Mask SBT
     * Note: This method is currently unused but kept for future event-driven implementation
     */
    private handleAnchoredEvent;
    /**
     * Calculate tokenId as keccak256(warrant||attest) as requested
     */
    private calculateTokenId;
    /**
     * Calculate receipt hash for the Mask SBT
     */
    private calculateReceiptHash;
    /**
     * Add event listener for custom handling
     */
    addEventListener(eventType: string, listener: (data: any) => Promise<void>): void;
    /**
     * Remove event listener
     */
    removeEventListener(eventType: string): void;
    /**
     * Notify event listeners
     */
    private notifyEventListeners;
    /**
     * Utility function to delay execution
     */
    private delay;
    /**
     * Get integration status
     */
    getStatus(): {
        autoMintEnabled: boolean;
        mintingDelay: number;
        eventListenersCount: number;
    };
    /**
     * Manually mint Mask SBT for a specific Canon event
     */
    manualMintForCanonEvent(warrantDigest: string, attestationDigest: string, recipient: string): Promise<{
        tokenId: string;
        receiptHash: string;
        transactionHash: string;
    }>;
}
//# sourceMappingURL=CanonMaskIntegration.d.ts.map