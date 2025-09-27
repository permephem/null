/**
 * RelayerService
 * Core service for processing warrants, attestations, and receipts
 * @author Null Foundation
 */

import { hash } from 'blake3';
import { ethers } from 'ethers';
// import { createHash } from 'crypto';
import logger from '../utils/logger';
import { CanonService } from '../canon/CanonService';
import { SBTService } from '../sbt/SBTService';
import { EmailService } from '../email/EmailService';
import type {
  NullWarrant,
  DeletionAttestation,
  MaskReceipt,
  ProcessingResult,
  ValidationResult,
} from '../types/index.js';
import { validateWarrant, validateAttestation } from '../schemas/validators.js';
import { CryptoService } from '../crypto/crypto.js';
import {
  FileWarrantDigestStore,
  InMemoryWarrantDigestStore,
  type WarrantDigestStore,
} from './WarrantDigestStore.js';

export class RelayerService {
  private canonService: CanonService;
  private sbtService: SBTService;
  private readonly controllerSecret: string;
  private warrantDigestStore: WarrantDigestStore;

  constructor(
    canonService: CanonService,
    sbtService: SBTService,
    _emailService: EmailService,
    controllerSecret?: string,
    warrantDigestStore?: WarrantDigestStore
  ) {
    this.canonService = canonService;
    this.sbtService = sbtService;
    const resolvedSecret = controllerSecret ?? process.env['RELAYER_CONTROLLER_SECRET'];
    if (!resolvedSecret) {
      throw new Error('Relayer controller secret must be provided');
    }
    this.controllerSecret = resolvedSecret;
    this.warrantDigestStore = warrantDigestStore ?? new FileWarrantDigestStore();
  }

  /**
   * Process a deletion warrant
   * @param warrant The warrant to process
   * @returns Processing result
   */
  async processWarrant(warrant: NullWarrant): Promise<ProcessingResult> {
    const startTime = Date.now();
    try {
      logger.info('Processing warrant:', { warrantId: warrant.warrant_id });

      // Validate warrant
      const validation = await this.validateWarrant(warrant);
      if (!validation.valid) {
        logger.warn('Warrant validation failed', {
          warrantId: warrant.warrant_id,
          error: validation.error,
        });
        return {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
        };
      }

      // Generate privacy-preserving subject tag using keyed Blake3
      const contextIdentifier = `${warrant.enterprise_id}:${warrant.warrant_id}`;
      const subjectTag = CryptoService.generateSubjectTag(
        this.controllerSecret,
        warrant.subject.subject_handle,
        contextIdentifier
      );

      // Compute distinct hashes for proper referential information
      const warrantDigest = this.computeWarrantDigest(warrant);
      const subjectHandleHash = CryptoService.generateSubjectHandleHash(warrant.subject.subject_handle);
      const enterpriseHash = CryptoService.generateEnterpriseHash(warrant.enterprise_id);
      const controllerDidHash = CryptoService.generateControllerDidHash(warrant.aud);

      // Anchor warrant to Canon Registry with retry logic
      let anchorTxHash: string = '';
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          anchorTxHash = await this.canonService.anchorWarrant(
            warrantDigest,
            subjectHandleHash,
            enterpriseHash,
            warrant.enterprise_id,
            warrant.warrant_id,
            controllerDidHash,
            subjectTag,
            this.determineAssuranceLevel(warrant)
          );
          break;
        } catch (error) {
          retryCount++;
          logger.warn(`Failed to anchor warrant (attempt ${retryCount}/${maxRetries})`, {
            warrantId: warrant.warrant_id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          if (retryCount >= maxRetries) {
            throw new Error(`Failed to anchor warrant after ${maxRetries} attempts: ${error}`);
          }

          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      await this.storeWarrantDigest(warrant.warrant_id, warrantDigest);

      // Send warrant to enterprise endpoint with timeout
      const enterpriseResult = await this.sendWarrantToEnterprise(warrant);

      const processingTime = Date.now() - startTime;
      logger.info('Warrant processed successfully', {
        warrantId: warrant.warrant_id,
        processingTime,
        anchorTxHash,
      });

      return {
        success: true,
        data: {
          warrantDigest,
          subjectHandleHash,
          enterpriseHash,
          controllerDidHash,
          subjectTag,
          anchorTxHash,
          enterpriseResponse: enterpriseResult,
          processingTime,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Error processing warrant:', {
        warrantId: warrant.warrant_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      });

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

      // Compute distinct hashes for proper referential information
      const attestationDigest = this.computeAttestationDigest(attestation);
      const warrantDigest = await this.getCanonicalWarrantDigest(attestation.warrant_id);
      if (!warrantDigest) {
        const errorMessage = 'Canonical warrant digest not found for attestation';
        logger.error(errorMessage, {
          warrantId: attestation.warrant_id,
          attestationId: attestation.attestation_id,
        });
        return {
          success: false,
          error: errorMessage,
          code: 'WARRANT_DIGEST_NOT_FOUND',
        };
      }
      const enterpriseHash = CryptoService.generateEnterpriseHash(attestation.enterprise_id);
      const controllerDidHash = CryptoService.generateControllerDidHash(attestation.aud);

      // Anchor attestation to Canon Registry
      const anchorResult = await this.canonService.anchorAttestation(
        attestationDigest,
        warrantDigest,
        enterpriseHash,
        attestation.enterprise_id,
        attestation.attestation_id,
        controllerDidHash,
        attestation.subject_handle,
        this.determineAssuranceLevel({ evidence_requested: [] } as any)
      );

      if (!anchorResult.success) {
        return {
          success: false,
          error: anchorResult.error || 'Anchor failed',
          code: 'ANCHOR_ERROR',
        };
      }

      // Generate receipt if deletion was successful
      if (attestation.status === 'deleted') {
        const receiptResult = await this.generateReceipt(attestation, warrantDigest, attestationDigest);
        return {
          success: true,
          data: {
            attestationDigest,
            warrantDigest,
            receipt: receiptResult,
            anchorBlock: anchorResult.blockNumber,
          },
        };
      }

      return {
        success: true,
        data: {
          attestationDigest,
          warrantDigest,
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

      // Signature verification using real crypto
      if (warrant.signature?.sig && warrant.signature?.kid) {
        const canonicalData = CryptoService.canonicalizeJSON(warrant);
        const signatureValid = await CryptoService.verifySignature(
          canonicalData,
          warrant.signature.sig,
          warrant.signature.kid,
          warrant.signature.alg || 'EdDSA'
        );
        if (!signatureValid) {
          return {
            valid: false,
            error: 'Invalid signature',
          };
        }
      } else {
        return {
          valid: false,
          error: 'Missing signature or key ID',
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

      // Signature verification using real crypto
      if (attestation.signature?.sig && attestation.signature?.kid) {
        const canonicalData = CryptoService.canonicalizeJSON(attestation);
        const signatureValid = await CryptoService.verifySignature(
          canonicalData,
          attestation.signature.sig,
          attestation.signature.kid,
          attestation.signature.alg || 'EdDSA'
        );
        if (!signatureValid) {
          return {
            valid: false,
            error: 'Invalid signature',
          };
        }
      } else {
        return {
          valid: false,
          error: 'Missing signature or key ID',
        };
      }

      const storedDigest = await this.getCanonicalWarrantDigest(attestation.warrant_id);
      if (!storedDigest) {
        return {
          valid: false,
          error: 'Canonical warrant digest not found for attestation',
        };
      }

      const warrantExists = await this.canonService.warrantExists(storedDigest);
      if (!warrantExists) {
        return {
          valid: false,
          error: 'Referenced warrant has not been anchored',
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
    return ethers.hexlify(hash(canonicalWarrant));
  }

  /**
   * Compute attestation digest
   * @param attestation The attestation
   * @returns The digest
   */
  private computeAttestationDigest(attestation: DeletionAttestation): string {
    const canonicalAttestation = this.canonicalizeAttestation(attestation);
    return ethers.hexlify(hash(canonicalAttestation));
  }

  /**
   * Compute receipt digest
   * @param receipt The receipt
   * @returns The digest
   */
  private computeReceiptDigest(receipt: MaskReceipt): string {
    const canonicalReceipt = this.canonicalizeReceipt(receipt);
    return ethers.hexlify(hash(canonicalReceipt));
  }

  /**
   * Canonicalize warrant for hashing
   * @param warrant The warrant
   * @returns Canonical JSON string
   */
  private canonicalizeWarrant(warrant: NullWarrant): string {
    // Remove signature for canonicalization
    const { signature: _signature, ...canonicalWarrant } = warrant;
    return CryptoService.canonicalizeJSON(canonicalWarrant);
  }

  /**
   * Canonicalize attestation for hashing
   * @param attestation The attestation
   * @returns Canonical JSON string
   */
  private canonicalizeAttestation(attestation: DeletionAttestation): string {
    // Remove signature for canonicalization
    const { signature: _signature, ...canonicalAttestation } = attestation;
    return CryptoService.canonicalizeJSON(canonicalAttestation);
  }

  /**
   * Canonicalize receipt for hashing
   * @param receipt The receipt
   * @returns Canonical JSON string
   */
  private canonicalizeReceipt(receipt: MaskReceipt): string {
    // Remove signature for canonicalization
    const { signature: _signature, ...canonicalReceipt } = receipt;
    return CryptoService.canonicalizeJSON(canonicalReceipt);
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
  private async generateReceipt(
    attestation: DeletionAttestation,
    warrantDigest: string,
    attestationDigest: string
  ): Promise<any> {
    try {
      const receipt: MaskReceipt = {
        type: 'MaskReceipt@v0.2',
        receipt_id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        warrant_hash: warrantDigest,
        attestation_hash: attestationDigest,
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

  private async storeWarrantDigest(warrantId: string, digest: string): Promise<void> {
    await this.warrantDigestStore.set(warrantId, digest);
  }

  private async getStoredWarrantDigest(warrantId: string): Promise<string | undefined> {
    return this.warrantDigestStore.get(warrantId);
  }

  private async getCanonicalWarrantDigest(warrantId: string): Promise<string | undefined> {
    const stored = await this.getStoredWarrantDigest(warrantId);
    if (stored) {
      return stored;
    }

    logger.info('Warrant digest not found in local store, attempting blockchain lookup', {
      warrantId,
    });

    const onChainDigest = await this.canonService.getWarrantDigestById(warrantId);
    if (onChainDigest) {
      await this.storeWarrantDigest(warrantId, onChainDigest);
    }

    return onChainDigest;
  }
}
