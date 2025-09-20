/**
 * Type definitions for Null Protocol
 * @author Null Foundation
 */
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
        alg: 'ed25519' | 'secp256k1' | 'p256';
        kid: string;
        sig: string;
    };
    aud: string;
    jti: string;
    nbf: number;
    exp: number;
    audience_bindings: string[];
    version: string;
    evidence_requested: string[];
    sla_seconds: number;
}
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
        alg: 'ed25519' | 'secp256k1' | 'p256';
        kid: string;
        sig: string;
    };
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
        alg: 'ed25519' | 'secp256k1' | 'p256';
        kid: string;
        sig: string;
    };
    version: string;
    controller_did_hash: string;
    jurisdiction_bits: number;
    evidence_class_bits: number;
    timestamp: number;
}
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
export declare class RelayerError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class ValidationError extends RelayerError {
    constructor(message: string);
}
export declare class AuthenticationError extends RelayerError {
    constructor(message: string);
}
export declare class AuthorizationError extends RelayerError {
    constructor(message: string);
}
export declare class NotFoundError extends RelayerError {
    constructor(message: string);
}
export declare class ConflictError extends RelayerError {
    constructor(message: string);
}
export declare class RateLimitError extends RelayerError {
    constructor(message: string);
}
//# sourceMappingURL=index.d.ts.map