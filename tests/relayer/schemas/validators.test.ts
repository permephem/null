import {
  DeletionAttestationSchema,
  MaskReceiptSchema,
  NullWarrantSchema,
} from '../../../relayer/src/schemas/validators';
import { createMockAttestation, createMockWarrant } from '../fixtures';

const createMockMaskReceipt = () => ({
  type: 'MaskReceipt@v0.2',
  receipt_id: 'receipt-1',
  warrant_hash: '0xabcdef1234567890abcdef1234567890',
  attestation_hash: '0xabcdef1234567890abcdef1234567890',
  subject_handle: '0x1234567890abcdef1234567890abcdef12345678',
  status: 'deleted' as const,
  completed_at: new Date().toISOString(),
  evidence_hash: '0xabcdef1234567890abcdef1234567890',
  signature: {
    sig: 'mask-receipt-signature',
    kid: 'test-key-id',
    alg: 'ed25519' as const,
  },
  version: '1',
  controller_did_hash: 'controller-hash',
  jurisdiction_bits: 1,
  evidence_class_bits: 1,
  timestamp: Math.floor(Date.now() / 1000),
});

describe('Signature algorithm normalization', () => {
  it('accepts lowercase ed25519 for deletion attestations and normalizes casing', () => {
    const attestation = createMockAttestation({
      signature: {
        sig: 'attestation-signature',
        kid: 'test-key-id',
        alg: 'ed25519',
      },
    });

    const parsed = DeletionAttestationSchema.parse(attestation);
    expect(parsed.signature.alg).toBe('EdDSA');
  });

  it('rejects unsupported algorithms for deletion attestations', () => {
    const attestation = createMockAttestation();
    // @ts-expect-error intentionally set invalid algorithm to verify validation failure
    attestation.signature.alg = 'rsa';

    expect(() => DeletionAttestationSchema.parse(attestation)).toThrowError(/Invalid enum value/);
  });

  it('normalizes lowercase ed25519 for mask receipts', () => {
    const parsed = MaskReceiptSchema.parse(createMockMaskReceipt());
    expect(parsed.signature.alg).toBe('EdDSA');
  });

  it('normalizes p256 to ES256 for warrants', () => {
    const warrant = createMockWarrant();
    (warrant.signature as any).alg = 'p256';

    const parsed = NullWarrantSchema.parse(warrant);
    expect(parsed.signature.alg).toBe('ES256');
  });
});

describe('Status enums', () => {
  it.each(['deleted', 'suppressed', 'not_found', 'rejected'] as const)(
    'allows %s status for deletion attestations',
    status => {
      const attestation = createMockAttestation({ status });
      expect(DeletionAttestationSchema.parse(attestation).status).toBe(status);
    }
  );

  it.each(['deleted', 'suppressed', 'not_found', 'rejected'] as const)(
    'allows %s status for mask receipts',
    status => {
      const maskReceipt = { ...createMockMaskReceipt(), status };
      expect(MaskReceiptSchema.parse(maskReceipt).status).toBe(status);
    }
  );

  it('rejects unknown statuses for deletion attestations', () => {
    const attestation = createMockAttestation({ status: 'pending' as any });
    expect(() => DeletionAttestationSchema.parse(attestation)).toThrowError(/Invalid enum value/);
  });

  it('rejects unknown statuses for mask receipts', () => {
    const maskReceipt = { ...createMockMaskReceipt(), status: 'pending' };
    expect(() => MaskReceiptSchema.parse(maskReceipt)).toThrowError(/Invalid enum value/);
  });
});
