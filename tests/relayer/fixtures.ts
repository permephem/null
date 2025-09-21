import type { NullWarrant, DeletionAttestation } from '../../relayer/src/types/index.js';

/**
 * Create a mock warrant for testing
 * @param overrides Optional overrides for specific fields
 * @returns Mock warrant object
 */
export function createMockWarrant(overrides: Partial<NullWarrant> = {}): NullWarrant {
  return {
    type: 'NullWarrant@v0.2' as const,
    warrant_id: 'test-warrant-1',
    enterprise_id: 'test-enterprise',
    subject: {
      subject_handle: '0x1234567890abcdef1234567890abcdef12345678',
      anchors: [{
        namespace: 'email',
        hash: '0xabcdef1234567890abcdef1234567890abcdef12',
        hint: 'test@example.com'
      }],
    },
    scope: ['delete_all'],
    jurisdiction: 'GDPR',
    legal_basis: 'GDPR',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    return_channels: {
      email: 'test@example.com',
      callback_url: 'https://example.com/callback',
    },
    nonce: 'test-nonce',
    signature: {
      sig: 'test-signature',
      kid: 'test-key-id',
      alg: 'ed25519' as const,
    },
    aud: 'test-controller',
    jti: 'test-jti',
    nbf: Math.floor(Date.now() / 1000) - 3600,
    exp: Math.floor(Date.now() / 1000) + 3600,
    audience_bindings: ['test-enterprise.com'],
    version: 'v0.2',
    evidence_requested: ['API_LOG'],
    sla_seconds: 3600,
    ...overrides,
  };
}

/**
 * Create a mock attestation for testing
 * @param overrides Optional overrides for specific fields
 * @returns Mock attestation object
 */
export function createMockAttestation(overrides: Partial<DeletionAttestation> = {}): DeletionAttestation {
  return {
    type: 'DeletionAttestation@v0.2' as const,
    attestation_id: 'test-attestation-1',
    warrant_id: 'test-warrant-1',
    enterprise_id: 'test-enterprise',
    subject_handle: '0x1234567890abcdef1234567890abcdef12345678',
    status: 'deleted',
    completed_at: new Date().toISOString(),
    evidence_hash: '0xevidence1234567890abcdef1234567890abcdef12',
    signature: {
      sig: 'test-attestation-signature',
      kid: 'test-key-id',
      alg: 'ed25519' as const,
    },
    aud: 'test-controller',
    jti: 'test-attestation-jti',
    nbf: Math.floor(Date.now() / 1000) - 3600,
    exp: Math.floor(Date.now() / 1000) + 3600,
    version: 'v0.2',
    ...overrides,
  };
}
