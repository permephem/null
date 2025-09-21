import type { DeletionAttestation, NullWarrant } from '../../relayer/src/types/index';

export const createMockWarrant = (overrides: Partial<NullWarrant> = {}): NullWarrant => {
  const base: NullWarrant = {
    type: 'NullWarrant@v0.2',
    warrant_id: 'test-warrant-1',
    enterprise_id: 'test-enterprise',
    subject: {
      subject_handle: '0x1234567890abcdef1234567890abcdef12345678',
      anchors: [
        {
          namespace: 'email',
          hash: '0xabcdef1234567890abcdef1234567890abcdef12',
          hint: 'test@example.com',
        },
      ],
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
    policy: undefined,
    signature: {
      sig: 'test-signature',
      kid: 'test-key-id',
      alg: 'ed25519',
    },
    aud: 'test-controller',
    jti: 'test-jti',
    nbf: Math.floor(Date.now() / 1000) - 3600,
    exp: Math.floor(Date.now() / 1000) + 3600,
    audience_bindings: ['test-enterprise.com'],
    version: 'v0.2',
    evidence_requested: ['API_LOG'],
    sla_seconds: 3600,
  };

  return {
    ...base,
    ...overrides,
    subject: overrides.subject ?? base.subject,
    return_channels: overrides.return_channels ?? base.return_channels,
    signature: overrides.signature ?? base.signature,
  };
};

export const createMockAttestation = (
  overrides: Partial<DeletionAttestation> = {}
): DeletionAttestation => {
  const base: DeletionAttestation = {
    type: 'DeletionAttestation@v0.2',
    attestation_id: 'test-attestation-1',
    warrant_id: 'test-warrant-1',
    enterprise_id: 'test-enterprise',
    subject_handle: '0x1234567890abcdef1234567890abcdef12345678',
    status: 'deleted',
    completed_at: new Date().toISOString(),
    evidence_hash: '0xevidencehash',
    signature: {
      sig: 'attestation-signature',
      kid: 'test-key-id',
      alg: 'ed25519',
    },
    aud: 'test-controller',
    ref: 'test-ref',
    processing_window: 3600,
    accepted_claims: ['delete_all'],
    controller_policy_digest: 'policy-digest',
    evidence: {},
  };

  return {
    ...base,
    ...overrides,
    signature: overrides.signature ?? base.signature,
    evidence: overrides.evidence ?? base.evidence,
  };
};
