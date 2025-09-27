import { DeletionAttestationSchema, MaskReceiptSchema } from '../../../relayer/src/schemas/validators';
import { createMockAttestation } from '../fixtures';

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
    const maskReceipt = {
      type: 'MaskReceipt@v0.2',
      receipt_id: 'receipt-1',
      warrant_hash: '0xwarrant',
      attestation_hash: '0xattestation',
      subject_handle: '0x1234567890abcdef1234567890abcdef12345678',
      status: 'deleted',
      completed_at: new Date().toISOString(),
      evidence_hash: '0xevidencehash',
      signature: {
        sig: 'mask-receipt-signature',
        kid: 'test-key-id',
        alg: 'ed25519',
      },
      version: '1',
      controller_did_hash: 'controller-hash',
      jurisdiction_bits: 1,
      evidence_class_bits: 1,
      timestamp: Date.now(),
    } as const;

    const parsed = MaskReceiptSchema.parse(maskReceipt);
    expect(parsed.signature.alg).toBe('EdDSA');
  });
});
