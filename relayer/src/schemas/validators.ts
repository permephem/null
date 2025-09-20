import { z } from 'zod';
import { CryptoService } from '../crypto/crypto.js';

// Null Warrant Schema
export const NullWarrantSchema = z.object({
  type: z.literal('NullWarrant@v0.2'),
  warrant_id: z.string(),
  enterprise_id: z.string(),
  subject: z.string(),
  scope: z.array(z.string()),
  jurisdiction: z.string(),
  legal_basis: z.string(),
  issued_at: z.string(),
  expires_at: z.string(),
  return_channels: z.array(z.string()),
  nonce: z.string(),
  signature: z.object({
    alg: z.enum(['EdDSA', 'ES256', 'secp256k1']),
    kid: z.string(),
    sig: z.string(),
    type: z.string().optional(),
    created: z.string().optional(),
    verificationMethod: z.string().optional(),
    proofValue: z.string().optional(),
  }),
  aud: z.string(),
  jti: z.string(),
  nbf: z.number(),
  exp: z.number(),
  audience_bindings: z.array(z.string()),
  version: z.string(),
  evidence_requested: z.array(z.string()),
  sla_seconds: z.number(),
});

// Deletion Attestation Schema
export const DeletionAttestationSchema = z.object({
  type: z.literal('DeletionAttestation@v0.2'),
  attestation_id: z.string(),
  warrant_id: z.string(),
  enterprise_id: z.string(),
  subject_handle: z.string(),
  status: z.enum(['deleted', 'not_found', 'denied']),
  completed_at: z.string(),
  evidence_hash: z.string(),
  signature: z.object({
    alg: z.enum(['EdDSA', 'ES256', 'secp256k1']),
    kid: z.string(),
    sig: z.string(),
    type: z.string().optional(),
    created: z.string().optional(),
    verificationMethod: z.string().optional(),
    proofValue: z.string().optional(),
  }),
  aud: z.string(),
  ref: z.string(),
  processing_window: z.number(),
  accepted_claims: z.array(z.string()),
  controller_policy_digest: z.string(),
  evidence: z.record(z.any()).optional(),
  denial_reason: z
    .enum(['not_found', 'legal_obligation', 'technical_constraint', 'policy_violation'])
    .optional(),
});

// Mask Receipt Schema
export const MaskReceiptSchema = z.object({
  type: z.literal('MaskReceipt@v0.2'),
  receipt_id: z.string(),
  warrant_hash: z.string(),
  attestation_hash: z.string(),
  subject_handle: z.string(),
  status: z.enum(['deleted']),
  completed_at: z.string(),
  evidence_hash: z.string(),
  signature: z.object({
    alg: z.enum(['EdDSA', 'ES256', 'secp256k1']),
    kid: z.string(),
    sig: z.string(),
    type: z.string().optional(),
    created: z.string().optional(),
    verificationMethod: z.string().optional(),
    proofValue: z.string().optional(),
  }),
  version: z.string(),
  controller_did_hash: z.string(),
  jurisdiction_bits: z.number(),
  evidence_class_bits: z.number(),
  timestamp: z.number(),
});

// Processing Result Schema
export const ProcessingResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  code: z.string(),
  data: z.any().optional(),
});

export type NullWarrant = z.infer<typeof NullWarrantSchema>;
export type DeletionAttestation = z.infer<typeof DeletionAttestationSchema>;
export type MaskReceipt = z.infer<typeof MaskReceiptSchema>;
export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;

// Validation functions
export function validateWarrant(warrant: any): { valid: boolean; error?: string } {
  try {
    NullWarrantSchema.parse(warrant);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Validation error' };
  }
}

export function validateAttestation(attestation: any): { valid: boolean; error?: string } {
  try {
    DeletionAttestationSchema.parse(attestation);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Validation error' };
  }
}

// Enhanced validation functions with cryptographic verification
export async function validateWarrantWithCrypto(
  warrant: any
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic schema validation
    const schemaValidation = validateWarrant(warrant);
    if (!schemaValidation.valid) {
      return schemaValidation;
    }

    // Cryptographic validation
    if (warrant.signature?.sig && warrant.signature?.kid) {
      const canonicalData = CryptoService.canonicalizeJSON(warrant);
      const signatureValid = await CryptoService.verifySignature(
        canonicalData,
        warrant.signature.sig,
        warrant.signature.kid,
        warrant.signature.alg || 'EdDSA'
      );
      if (!signatureValid) {
        return { valid: false, error: 'Invalid signature' };
      }
    } else {
      return { valid: false, error: 'Missing signature or key ID' };
    }

    // Validate timestamps
    const now = Math.floor(Date.now() / 1000);
    if (warrant.nbf && warrant.nbf > now) {
      return { valid: false, error: 'Warrant not yet valid (nbf)' };
    }
    if (warrant.exp && warrant.exp < now) {
      return { valid: false, error: 'Warrant has expired' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Validation error' };
  }
}

export async function validateAttestationWithCrypto(
  attestation: any
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic schema validation
    const schemaValidation = validateAttestation(attestation);
    if (!schemaValidation.valid) {
      return schemaValidation;
    }

    // Cryptographic validation
    if (attestation.signature?.sig && attestation.signature?.kid) {
      const canonicalData = CryptoService.canonicalizeJSON(attestation);
      const signatureValid = await CryptoService.verifySignature(
        canonicalData,
        attestation.signature.sig,
        attestation.signature.kid,
        attestation.signature.alg || 'EdDSA'
      );
      if (!signatureValid) {
        return { valid: false, error: 'Invalid signature' };
      }
    } else {
      return { valid: false, error: 'Missing signature or key ID' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Validation error' };
  }
}

// HMAC-Blake3 validation for subject tags
export function validateSubjectTag(
  subjectTag: string,
  controllerKey: string,
  subjectDID: string,
  context: string
): boolean {
  try {
    const expectedTag = CryptoService.generateSubjectTag(controllerKey, subjectDID, context);
    return subjectTag === expectedTag;
  } catch (error) {
    return false;
  }
}
