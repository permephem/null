/**
 * Type definitions for Null Protocol
 * @author Null Foundation
 */

// Base types
export type SignatureAlgorithm = 'EdDSA' | 'ES256' | 'secp256k1';

export interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Warrant types
export interface NullWarrant {
  type: 'NullWarrant@v0.2';
  warrant_id: string;
  enterprise_id: string;
  subject: {
    subject_handle: string;
    anchors: Array<{
      namespace: string;
      hash: string;
      hint?: string;
    }>;
  };
  scope: string[];
  jurisdiction: string;
  legal_basis: string;
  issued_at: string;
  expires_at: string;
  return_channels: {
    email: string;
    callback_url: string;
    subject_receipt_wallet?: string;
  };
  nonce: string;
  policy?: {
    include_backup_sets?: boolean;
    include_processors?: boolean;
    suppress_reharvest?: boolean;
    evidence_required?: boolean;
  };
  signature: {
    alg: SignatureAlgorithm;
    kid: string;
    sig: string;
  };
  // Security controls
  aud: string;
  jti: string;
  nbf: number;
  exp: number;
  audience_bindings: string[];
  version: string;
  evidence_requested: string[];
  sla_seconds: number;
}

// Attestation types
export interface DeletionAttestation {
  type: 'DeletionAttestation@v0.2';
  attestation_id: string;
  warrant_id: string;
  enterprise_id: string;
  subject_handle: string;
  status: 'deleted' | 'suppressed' | 'not_found' | 'rejected';
  completed_at: string;
  evidence_hash: string;
  retention_policy?: string;
  signature: {
    alg: SignatureAlgorithm;
    kid: string;
    sig: string;
  };
  // Security controls
  aud: string;
  ref: string;
  processing_window: number;
  accepted_claims: string[];
  denial_reason?: 'not_found' | 'legal_obligation' | 'technical_constraint' | 'policy_violation';
  controller_policy_digest: string;
  evidence: {
    TEE_QUOTE?: {
      vendor: string;
      mrenclave: string;
      reportDigest: string;
    };
    API_LOG?: {
      logService: string;
      range: string;
      digest: string;
    };
    KEY_DESTROY?: {
      hsmVendor: string;
      keyIdHash: string;
      time: number;
    };
    DKIM_ATTESTATION?: {
      domain: string;
      selector: string;
      signature: string;
      headers: string;
    };
  };
}

// Receipt types
export interface MaskReceipt {
  type: 'MaskReceipt@v0.2';
  receipt_id: string;
  warrant_hash: string;
  attestation_hash: string;
  subject_handle: string;
  status: 'deleted' | 'suppressed' | 'not_found' | 'rejected';
  completed_at: string;
  evidence_hash: string;
  signature: {
    alg: SignatureAlgorithm;
    kid: string;
    sig: string;
  };
  // Enhanced fields
  version: string;
  controller_did_hash: string;
  jurisdiction_bits: number;
  evidence_class_bits: number;
  timestamp: number;
}

// Canon Registry types
export interface CanonEntry {
  warrantDigest: string;
  attestationDigest: string;
  subjectTag: string;
  controllerDidHash: string;
  assurance: number;
  timestamp: number;
  blockNumber: number;
}

export interface AnchorRequest {
  warrantDigest: string;
  subjectTag: string;
  enterpriseId: string;
  warrantId: string;
  assurance: number;
}

export interface AttestationAnchorRequest {
  attestationDigest: string;
  warrantId: string;
  enterpriseId: string;
  attestationId: string;
  status: string;
}

// SBT types
export interface SBTMintRequest {
  to: string;
  receiptHash: string;
}

export interface SBTMintResult {
  tokenId: number;
  receiptHash: string;
  transactionHash: string;
  blockNumber: number;
}

// Email types
export interface EmailWarrant {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  dkimSignature?: string;
  spfResult?: string;
  dmarcResult?: string;
}

export interface EmailProcessingResult {
  success: boolean;
  warrant?: NullWarrant;
  error?: string;
  assurance: number;
}

// API types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Configuration types
export interface RelayerConfig {
  ethereum: {
    rpcUrl: string;
    privateKey: string;
    chainId: number;
  };
  contracts: {
    canonRegistry: string;
    maskSBT: string;
  };
  security: {
    sbtMintingEnabled: boolean;
    transferEnabled: boolean;
    rateLimitEnabled: boolean;
  };
  email: {
    enabled: boolean;
    dkimRequired: boolean;
    spfRequired: boolean;
    dmarcRequired: boolean;
  };
  logging: {
    level: string;
    format: string;
  };
}

// Error types
export class RelayerError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'RelayerError';
  }
}

export class ValidationError extends RelayerError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class AuthenticationError extends RelayerError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends RelayerError {
  constructor(message: string) {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends RelayerError {
  constructor(message: string) {
    super(message, 'NOT_FOUND_ERROR', 404);
  }
}

export class ConflictError extends RelayerError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR', 409);
  }
}

export class RateLimitError extends RelayerError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT_ERROR', 429);
  }
}
