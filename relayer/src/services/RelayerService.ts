/**
 * RelayerService
 * Core service for processing warrants, attestations, and receipts
 * @author Null Foundation
 */

import { ethers } from 'ethers';
import { hash } from 'blake3';
// import { createHash } from 'crypto';
import logger from '../utils/logger.js';
import { CanonService } from '../canon/CanonService.js';
import { SBTService } from '../sbt/SBTService.js';
import { EmailService } from '../email/EmailService.js';
import type {
  NullWarrant,
  DeletionAttestation,
  MaskReceipt,
  ProcessingResult,
  ValidationResult,
} from '../types/index.js';
import { validateWarrant, validateAttestation } from '../schemas/validators.js';
import { CryptoService } from '../crypto/crypto.js';

export class RelayerService {
  private canonService: CanonService;
  private sbtService: SBTService;
  private _emailService: EmailService;
  private provider: ethers.Provider;
  private _wallet: ethers.Wallet;

  constructor(canonService: CanonService, sbtService: SBTService, emailService: EmailService) {
    this.canonService = canonService;
    this.sbtService = sbtService;
    this._emailService = emailService;

    // Initialize Ethereum provider and wallet
    this.provider = new ethers.JsonRpcProvider(process.env['ETHEREUM_RPC_URL']);
    this._wallet = new ethers.Wallet(process.env['RELAYER_PRIVATE_KEY']!, this.provider);
  }

  /**
   * Process a deletion warrant
   * @param warrant The warrant to process
   * @returns Processing result
   */
  async processWarrant(warrant: NullWarrant): Promise<ProcessingResult> {
    try {
      logger.info('Processing warrant:', { warrantId: warrant.warrant_id });

      // Validate warrant
      const validation = await this.validateWarrant(warrant);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
        };
      }

      // Generate privacy-preserving subject tag
      const subjectTag = CryptoService.generateSubjectTag(
        warrant.subject.subject_handle,
        warrant.enterprise_id,
        warrant.warrant_id
      );

      // Compute warrant digest
      const warrantDigest = this.computeWarrantDigest(warrant);

      // Anchor warrant to Canon Registry
      const anchorTxHash = await this.canonService.anchorWarrant(
        warrantDigest,
        warrantDigest, // subjectHandleHash placeholder
        warrantDigest, // enterpriseHash placeholder
        warrant.enterprise_id,
        warrant.warrant_id,
        warrantDigest, // controllerDidHash placeholder
        subjectTag,
        this.determineAssuranceLevel(warrant)
      );

      // Send warrant to enterprise endpoint
      const enterpriseResult = await this.sendWarrantToEnterprise(warrant);

      return {
        success: true,
        data: {
          warrantDigest,
          subjectTag,
          anchorTxHash,
          enterpriseResponse: enterpriseResult,
        },
      };
    } catch (error) {
      logger.error('Error processing warrant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'PROCESSING_ERROR',
      };
    }
  }

  /**
   * Process a deletion attestation
   * @param attestation The attestation to process
   * @returns Processing result
   */
  async processAttestation(attestation: DeletionAttestation): Promise<ProcessingResult> {
    try {
      logger.info('Processing attestation:', { attestationId: attestation.attestation_id });

      // Validate attestation
      const validation = await this.validateAttestation(attestation);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
        };
      }

      // Compute attestation digest
      const attestationDigest = this.computeAttestationDigest(attestation);

      // Anchor attestation to Canon Registry
      const anchorResult = await this.canonService.anchorAttestation({
        attestationDigest,
        warrantId: attestation.warrant_id,
        enterpriseId: attestation.enterprise_id,
        attestationId: attestation.attestation_id,
        status: attestation.status,
      });

      if (!anchorResult.success) {
        return {
          success: false,
          error: anchorResult.error || 'Anchor failed',
          code: 'ANCHOR_ERROR',
        };
      }

      // Generate receipt if deletion was successful
      if (attestation.status === 'deleted') {
        const receiptResult = await this.generateReceipt(attestation);
        return {
          success: true,
          data: {
            attestationDigest,
            receipt: receiptResult,
            anchorBlock: anchorResult.blockNumber,
          },
        };
      }

      return {
        success: true,
        data: {
          attestationDigest,
          anchorBlock: anchorResult.blockNumber,
        },
      };
    } catch (error) {
      logger.error('Error processing attestation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'PROCESSING_ERROR',
      };
    }
  }

  /**
   * Validate a warrant
   * @param warrant The warrant to validate
   * @returns Validation result
   */
  private async validateWarrant(warrant: NullWarrant): Promise<ValidationResult> {
    try {
      // Schema validation
      const schemaValidation = validateWarrant(warrant);
      if (!schemaValidation.valid) {
        return schemaValidation;
      }

      // Signature verification
      const signatureValid = CryptoService.verifySignature(
        JSON.stringify(warrant),
        warrant.signature?.sig || '',
        warrant.signature?.kid || ''
      );
      if (!signatureValid) {
        return {
          valid: false,
          error: 'Invalid signature',
        };
      }

      // Check for replay attacks
      const warrantDigest = this.computeWarrantDigest(warrant);
      const isAnchored = await this.canonService.isAnchored(warrantDigest);
      if (isAnchored) {
        return {
          valid: false,
          error: 'Warrant already processed (replay attack)',
        };
      }

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (warrant.exp && warrant.exp < now) {
        return {
          valid: false,
          error: 'Warrant has expired',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation error',
      };
    }
  }

  /**
   * Validate an attestation
   * @param attestation The attestation to validate
   * @returns Validation result
   */
  private async validateAttestation(attestation: DeletionAttestation): Promise<ValidationResult> {
    try {
      // Schema validation
      const schemaValidation = validateAttestation(attestation);
      if (!schemaValidation.valid) {
        return schemaValidation;
      }

      // Signature verification
      const signatureValid = CryptoService.verifySignature(
        JSON.stringify(attestation),
        attestation.signature?.sig || '',
        attestation.signature?.kid || ''
      );
      if (!signatureValid) {
        return {
          valid: false,
          error: 'Invalid signature',
        };
      }

      // Verify warrant exists
      const warrantExists = await this.canonService.warrantExists(attestation.warrant_id);
      if (!warrantExists) {
        return {
          valid: false,
          error: 'Referenced warrant does not exist',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation error',
      };
    }
  }

  /**
   * Compute warrant digest
   * @param warrant The warrant
   * @returns The digest
   */
  private computeWarrantDigest(warrant: NullWarrant): string {
    const canonicalWarrant = this.canonicalizeWarrant(warrant);
    return hash(canonicalWarrant).toString('hex');
  }

  /**
   * Compute attestation digest
   * @param attestation The attestation
   * @returns The digest
   */
  private computeAttestationDigest(attestation: DeletionAttestation): string {
    const canonicalAttestation = this.canonicalizeAttestation(attestation);
    return hash(canonicalAttestation).toString('hex');
  }

  /**
   * Compute receipt digest
   * @param receipt The receipt
   * @returns The digest
   */
  private computeReceiptDigest(receipt: MaskReceipt): string {
    const canonicalReceipt = this.canonicalizeReceipt(receipt);
    return hash(canonicalReceipt).toString('hex');
  }

  /**
   * Canonicalize warrant for hashing
   * @param warrant The warrant
   * @returns Canonical JSON string
   */
  private canonicalizeWarrant(warrant: NullWarrant): string {
    // Remove signature for canonicalization
    const { signature: _signature, ...canonicalWarrant } = warrant;
    return JSON.stringify(canonicalWarrant, Object.keys(canonicalWarrant).sort());
  }

  /**
   * Canonicalize attestation for hashing
   * @param attestation The attestation
   * @returns Canonical JSON string
   */
  private canonicalizeAttestation(attestation: DeletionAttestation): string {
    // Remove signature for canonicalization
    const { signature: _signature, ...canonicalAttestation } = attestation;
    return JSON.stringify(canonicalAttestation, Object.keys(canonicalAttestation).sort());
  }

  /**
   * Canonicalize receipt for hashing
   * @param receipt The receipt
   * @returns Canonical JSON string
   */
  private canonicalizeReceipt(receipt: MaskReceipt): string {
    // Remove signature for canonicalization
    const { signature: _signature, ...canonicalReceipt } = receipt;
    return JSON.stringify(canonicalReceipt, Object.keys(canonicalReceipt).sort());
  }

  /**
   * Determine assurance level based on warrant
   * @param warrant The warrant
   * @returns Assurance level (0-2)
   */
  private determineAssuranceLevel(warrant: NullWarrant): number {
    // High assurance: TEE or HSM evidence requested
    if (
      warrant.evidence_requested?.includes('TEE_QUOTE') ||
      warrant.evidence_requested?.includes('KEY_DESTROY')
    ) {
      return 2;
    }

    // Medium assurance: API logs or DKIM
    if (
      warrant.evidence_requested?.includes('API_LOG') ||
      warrant.evidence_requested?.includes('DKIM_ATTESTATION')
    ) {
      return 1;
    }

    // Low assurance: Basic deletion
    return 0;
  }

  /**
   * Send warrant to enterprise endpoint
   * @param warrant The warrant
   * @returns Enterprise response
   */
  private async sendWarrantToEnterprise(warrant: NullWarrant): Promise<any> {
    // Implementation for sending warrant to enterprise
    // This would typically make an HTTP request to the enterprise's /null/closure endpoint
    logger.info('Sending warrant to enterprise:', {
      enterpriseId: warrant.enterprise_id,
      warrantId: warrant.warrant_id,
    });

    // Placeholder implementation
    return { status: 'sent', timestamp: new Date().toISOString() };
  }

  /**
   * Generate receipt for successful deletion
   * @param attestation The attestation
   * @returns Receipt generation result
   */
  private async generateReceipt(attestation: DeletionAttestation): Promise<any> {
    try {
      const receipt: MaskReceipt = {
        type: 'MaskReceipt@v0.2',
        receipt_id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        warrant_hash: this.computeWarrantDigest({ warrant_id: attestation.warrant_id } as any),
        attestation_hash: this.computeAttestationDigest(attestation),
        subject_handle: attestation.subject_handle,
        status: 'deleted',
        completed_at: attestation.completed_at,
        evidence_hash: attestation.evidence_hash,
        signature: {
          alg: 'ed25519',
          kid: 'relayer-key-1',
          sig: 'placeholder-signature', // Would be actual signature
        },
        version: 'v0.2',
        controller_did_hash: 'placeholder-controller-hash',
        jurisdiction_bits: 0,
        evidence_class_bits: 0,
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Mint SBT if enabled
      if (process.env['SBT_MINTING_ENABLED'] === 'true') {
        const receiptHash = this.computeReceiptDigest(receipt);
        const sbtResult = await this.sbtService.mintReceipt(
          attestation.subject_handle,
          receiptHash
        );
        return { receipt, sbt: sbtResult };
      }

      return { receipt };
    } catch (error) {
      logger.error('Error generating receipt:', error);
      throw error;
    }
  }

  /**
   * Get status of a processing request
   * @param id The request ID
   * @returns Status information
   */
  async getStatus(id: string): Promise<any> {
    try {
      logger.info('Getting status for request:', { id });
      // Placeholder implementation
      return {
        id,
        status: 'processing',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting status:', error);
      throw error;
    }
  }
}
