/**
 * RelayerService
 * Core service for processing warrants, attestations, and receipts
 * @author Null Foundation
 */
import { CanonService } from '../canon/CanonService';
import { SBTService } from '../sbt/SBTService';
import { EmailService } from '../email/EmailService';
import type { NullWarrant, DeletionAttestation, ProcessingResult } from '../types/index.js';
export declare class RelayerService {
    private canonService;
    private sbtService;
    constructor(canonService: CanonService, sbtService: SBTService, _emailService: EmailService);
    /**
     * Process a deletion warrant
     * @param warrant The warrant to process
     * @returns Processing result
     */
    processWarrant(warrant: NullWarrant): Promise<ProcessingResult>;
    /**
     * Process a deletion attestation
     * @param attestation The attestation to process
     * @returns Processing result
     */
    processAttestation(attestation: DeletionAttestation): Promise<ProcessingResult>;
    /**
     * Validate a warrant
     * @param warrant The warrant to validate
     * @returns Validation result
     */
    private validateWarrant;
    /**
     * Validate an attestation
     * @param attestation The attestation to validate
     * @returns Validation result
     */
    private validateAttestation;
    /**
     * Compute warrant digest
     * @param warrant The warrant
     * @returns The digest
     */
    private computeWarrantDigest;
    /**
     * Compute attestation digest
     * @param attestation The attestation
     * @returns The digest
     */
    private computeAttestationDigest;
    /**
     * Compute receipt digest
     * @param receipt The receipt
     * @returns The digest
     */
    private computeReceiptDigest;
    /**
     * Canonicalize warrant for hashing
     * @param warrant The warrant
     * @returns Canonical JSON string
     */
    private canonicalizeWarrant;
    /**
     * Canonicalize attestation for hashing
     * @param attestation The attestation
     * @returns Canonical JSON string
     */
    private canonicalizeAttestation;
    /**
     * Canonicalize receipt for hashing
     * @param receipt The receipt
     * @returns Canonical JSON string
     */
    private canonicalizeReceipt;
    /**
     * Determine assurance level based on warrant
     * @param warrant The warrant
     * @returns Assurance level (0-2)
     */
    private determineAssuranceLevel;
    /**
     * Send warrant to enterprise endpoint
     * @param warrant The warrant
     * @returns Enterprise response
     */
    private sendWarrantToEnterprise;
    /**
     * Generate receipt for successful deletion
     * @param attestation The attestation
     * @returns Receipt generation result
     */
    private generateReceipt;
    /**
     * Get status of a processing request
     * @param id The request ID
     * @returns Status information
     */
    getStatus(id: string): Promise<any>;
}
//# sourceMappingURL=RelayerService.d.ts.map