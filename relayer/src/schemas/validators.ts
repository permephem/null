import { z } from 'zod';
import { CryptoService } from '../crypto/crypto.js';

const SignatureAlgorithmSchema = z
  .string()
  .transform(alg => alg.trim())
  .transform(alg => alg.toLowerCase())
  .pipe(z.enum(['eddsa', 'ed25519', 'es256', 'p256', 'secp256k1']))
  .transform(alg => {
    switch (alg) {
      case 'eddsa':
      case 'ed25519':
        return 'EdDSA' as const;
      case 'es256':
      case 'p256':
        return 'ES256' as const;
      case 'secp256k1':
        return 'secp256k1' as const;
    }
  });

// Null Warrant Schema
export const NullWarrantSchema = z.object({
  type: z.literal('NullWarrant@v0.2'),
  warrant_id: z.string(),
  enterprise_id: z.string(),
  subject: z.object({
    subject_handle: z.string().regex(/^0x[0-9a-fA-F]{16,}$/, 'Invalid subject handle format'),
    anchors: z.array(z.object({
      namespace: z.enum(['email', 'phone', 'name+dob+zip', 'account_id', 'gov_id_redacted', 'custom']),
      hash: z.string().regex(/^0x[0-9a-fA-F]{16,}$/, 'Invalid hash format'),
      hint: z.string().max(64).optional(),
    })).min(1, 'At least one anchor is required'),
  }),
  scope: z.array(z.enum([
    'delete_all',
    'suppress_resale', 
    'marketing',
    'analytics',
    'credit_header',
    'background_screening',
    'data_broker_profile',
    'location',
    'inference'
  ])).min(1, 'At least one scope is required'),
  jurisdiction: z.enum(['GDPR', 'CCPA/CPRA', 'VCDPA', 'CPA', 'PIPEDA', 'LGPD', 'DPDP-India', 'Other']),
  legal_basis: z.string().max(160),
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  return_channels: z.object({
    email: z.string().email(),
    callback_url: z.string().url(),
    subject_receipt_wallet: z.string().optional(),
  }),
  nonce: z.string(),
  policy: z.object({
    include_backup_sets: z.boolean().optional(),
    include_processors: z.boolean().optional(),
    suppress_reharvest: z.boolean().optional(),
    evidence_required: z.boolean().optional(),
  }).optional(),
  signature: z.object({
    alg: SignatureAlgorithmSchema,
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
  subject_handle: z
    .string()
    .regex(/^0x[0-9a-fA-F]{16,}$/, 'Invalid subject handle format'),
  status: z.enum(['deleted', 'suppressed', 'not_found', 'rejected']),
  completed_at: z.string().datetime(),
  evidence_hash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{16,}$/, 'Invalid evidence hash format'),
  retention_policy: z.string().max(200).optional(),
  signature: z.object({
    alg: SignatureAlgorithmSchema,
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
  evidence: z
    .object({
      TEE_QUOTE: z
        .object({
          vendor: z.string(),
          mrenclave: z.string(),
          reportDigest: z.string(),
        })
        .optional(),
      API_LOG: z
        .object({
          logService: z.string(),
          range: z.string(),
          digest: z.string(),
        })
        .optional(),
      KEY_DESTROY: z
        .object({
          hsmVendor: z.string(),
          keyIdHash: z.string(),
          time: z.number(),
        })
        .optional(),
      DKIM_ATTESTATION: z
        .object({
          domain: z.string(),
          selector: z.string(),
          signature: z.string(),
          headers: z.string(),
        })
        .optional(),
    })
    .optional(),
  denial_reason: z
    .enum(['not_found', 'legal_obligation', 'technical_constraint', 'policy_violation'])
    .optional(),
});

// Mask Receipt Schema
export const MaskReceiptSchema = z.object({
  type: z.literal('MaskReceipt@v0.2'),
  receipt_id: z.string(),
  warrant_hash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{16,}$/, 'Invalid warrant hash format'),
  attestation_hash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{16,}$/, 'Invalid attestation hash format'),
  subject_handle: z
    .string()
    .regex(/^0x[0-9a-fA-F]{16,}$/, 'Invalid subject handle format'),
  status: z.enum(['deleted', 'suppressed', 'not_found', 'rejected']),
  completed_at: z.string().datetime(),
  evidence_hash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{16,}$/, 'Invalid evidence hash format'),
  signature: z.object({
    alg: SignatureAlgorithmSchema,
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
