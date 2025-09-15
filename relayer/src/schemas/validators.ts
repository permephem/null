import { z } from 'zod';

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
    type: z.string(),
    created: z.string(),
    verificationMethod: z.string(),
    proofValue: z.string()
  }),
  aud: z.string(),
  jti: z.string(),
  nbf: z.number(),
  exp: z.number(),
  audience_bindings: z.array(z.string()),
  version: z.string(),
  evidence_requested: z.array(z.string()),
  sla_seconds: z.number()
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
    type: z.string(),
    created: z.string(),
    verificationMethod: z.string(),
    proofValue: z.string()
  }),
  aud: z.string(),
  ref: z.string(),
  processing_window: z.number(),
  accepted_claims: z.array(z.string()),
  controller_policy_digest: z.string(),
  evidence: z.record(z.any()).optional(),
  denial_reason: z.enum(['not_found', 'legal_obligation', 'technical_constraint', 'policy_violation']).optional()
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
    type: z.string(),
    created: z.string(),
    verificationMethod: z.string(),
    proofValue: z.string()
  }),
  version: z.string(),
  controller_did_hash: z.string(),
  jurisdiction_bits: z.number(),
  evidence_class_bits: z.number(),
  timestamp: z.number()
});

// Processing Result Schema
export const ProcessingResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  code: z.string(),
  data: z.any().optional()
});

export type NullWarrant = z.infer<typeof NullWarrantSchema>;
export type DeletionAttestation = z.infer<typeof DeletionAttestationSchema>;
export type MaskReceipt = z.infer<typeof MaskReceiptSchema>;
export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;
