import { z } from 'zod';
export declare const NullWarrantSchema: z.ZodObject<{
    type: z.ZodLiteral<"NullWarrant@v0.2">;
    warrant_id: z.ZodString;
    enterprise_id: z.ZodString;
    subject: z.ZodString;
    scope: z.ZodArray<z.ZodString, "many">;
    jurisdiction: z.ZodString;
    legal_basis: z.ZodString;
    issued_at: z.ZodString;
    expires_at: z.ZodString;
    return_channels: z.ZodArray<z.ZodString, "many">;
    nonce: z.ZodString;
    signature: z.ZodObject<{
        alg: z.ZodEnum<["EdDSA", "ES256", "secp256k1"]>;
        kid: z.ZodString;
        sig: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        created: z.ZodOptional<z.ZodString>;
        verificationMethod: z.ZodOptional<z.ZodString>;
        proofValue: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    }, {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    }>;
    aud: z.ZodString;
    jti: z.ZodString;
    nbf: z.ZodNumber;
    exp: z.ZodNumber;
    audience_bindings: z.ZodArray<z.ZodString, "many">;
    version: z.ZodString;
    evidence_requested: z.ZodArray<z.ZodString, "many">;
    sla_seconds: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    signature: {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    };
    type: "NullWarrant@v0.2";
    nonce: string;
    warrant_id: string;
    enterprise_id: string;
    subject: string;
    scope: string[];
    jurisdiction: string;
    legal_basis: string;
    issued_at: string;
    expires_at: string;
    return_channels: string[];
    aud: string;
    jti: string;
    nbf: number;
    exp: number;
    audience_bindings: string[];
    version: string;
    evidence_requested: string[];
    sla_seconds: number;
}, {
    signature: {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    };
    type: "NullWarrant@v0.2";
    nonce: string;
    warrant_id: string;
    enterprise_id: string;
    subject: string;
    scope: string[];
    jurisdiction: string;
    legal_basis: string;
    issued_at: string;
    expires_at: string;
    return_channels: string[];
    aud: string;
    jti: string;
    nbf: number;
    exp: number;
    audience_bindings: string[];
    version: string;
    evidence_requested: string[];
    sla_seconds: number;
}>;
export declare const DeletionAttestationSchema: z.ZodObject<{
    type: z.ZodLiteral<"DeletionAttestation@v0.2">;
    attestation_id: z.ZodString;
    warrant_id: z.ZodString;
    enterprise_id: z.ZodString;
    subject_handle: z.ZodString;
    status: z.ZodEnum<["deleted", "not_found", "denied"]>;
    completed_at: z.ZodString;
    evidence_hash: z.ZodString;
    signature: z.ZodObject<{
        alg: z.ZodEnum<["EdDSA", "ES256", "secp256k1"]>;
        kid: z.ZodString;
        sig: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        created: z.ZodOptional<z.ZodString>;
        verificationMethod: z.ZodOptional<z.ZodString>;
        proofValue: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    }, {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    }>;
    aud: z.ZodString;
    ref: z.ZodString;
    processing_window: z.ZodNumber;
    accepted_claims: z.ZodArray<z.ZodString, "many">;
    controller_policy_digest: z.ZodString;
    evidence: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    denial_reason: z.ZodOptional<z.ZodEnum<["not_found", "legal_obligation", "technical_constraint", "policy_violation"]>>;
}, "strip", z.ZodTypeAny, {
    signature: {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    };
    type: "DeletionAttestation@v0.2";
    status: "deleted" | "not_found" | "denied";
    warrant_id: string;
    enterprise_id: string;
    aud: string;
    attestation_id: string;
    subject_handle: string;
    completed_at: string;
    evidence_hash: string;
    ref: string;
    processing_window: number;
    accepted_claims: string[];
    controller_policy_digest: string;
    evidence?: Record<string, any> | undefined;
    denial_reason?: "not_found" | "legal_obligation" | "technical_constraint" | "policy_violation" | undefined;
}, {
    signature: {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    };
    type: "DeletionAttestation@v0.2";
    status: "deleted" | "not_found" | "denied";
    warrant_id: string;
    enterprise_id: string;
    aud: string;
    attestation_id: string;
    subject_handle: string;
    completed_at: string;
    evidence_hash: string;
    ref: string;
    processing_window: number;
    accepted_claims: string[];
    controller_policy_digest: string;
    evidence?: Record<string, any> | undefined;
    denial_reason?: "not_found" | "legal_obligation" | "technical_constraint" | "policy_violation" | undefined;
}>;
export declare const MaskReceiptSchema: z.ZodObject<{
    type: z.ZodLiteral<"MaskReceipt@v0.2">;
    receipt_id: z.ZodString;
    warrant_hash: z.ZodString;
    attestation_hash: z.ZodString;
    subject_handle: z.ZodString;
    status: z.ZodEnum<["deleted"]>;
    completed_at: z.ZodString;
    evidence_hash: z.ZodString;
    signature: z.ZodObject<{
        alg: z.ZodEnum<["EdDSA", "ES256", "secp256k1"]>;
        kid: z.ZodString;
        sig: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        created: z.ZodOptional<z.ZodString>;
        verificationMethod: z.ZodOptional<z.ZodString>;
        proofValue: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    }, {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    }>;
    version: z.ZodString;
    controller_did_hash: z.ZodString;
    jurisdiction_bits: z.ZodNumber;
    evidence_class_bits: z.ZodNumber;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    signature: {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    };
    type: "MaskReceipt@v0.2";
    timestamp: number;
    status: "deleted";
    version: string;
    subject_handle: string;
    completed_at: string;
    evidence_hash: string;
    receipt_id: string;
    warrant_hash: string;
    attestation_hash: string;
    controller_did_hash: string;
    jurisdiction_bits: number;
    evidence_class_bits: number;
}, {
    signature: {
        alg: "secp256k1" | "EdDSA" | "ES256";
        kid: string;
        sig: string;
        type?: string | undefined;
        created?: string | undefined;
        verificationMethod?: string | undefined;
        proofValue?: string | undefined;
    };
    type: "MaskReceipt@v0.2";
    timestamp: number;
    status: "deleted";
    version: string;
    subject_handle: string;
    completed_at: string;
    evidence_hash: string;
    receipt_id: string;
    warrant_hash: string;
    attestation_hash: string;
    controller_did_hash: string;
    jurisdiction_bits: number;
    evidence_class_bits: number;
}>;
export declare const ProcessingResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    code: z.ZodString;
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    code: string;
    error?: string | undefined;
    data?: any;
}, {
    success: boolean;
    code: string;
    error?: string | undefined;
    data?: any;
}>;
export type NullWarrant = z.infer<typeof NullWarrantSchema>;
export type DeletionAttestation = z.infer<typeof DeletionAttestationSchema>;
export type MaskReceipt = z.infer<typeof MaskReceiptSchema>;
export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;
export declare function validateWarrant(warrant: any): {
    valid: boolean;
    error?: string;
};
export declare function validateAttestation(attestation: any): {
    valid: boolean;
    error?: string;
};
export declare function validateWarrantWithCrypto(warrant: any): Promise<{
    valid: boolean;
    error?: string;
}>;
export declare function validateAttestationWithCrypto(attestation: any): Promise<{
    valid: boolean;
    error?: string;
}>;
export declare function validateSubjectTag(subjectTag: string, controllerKey: string, subjectDID: string, context: string): boolean;
//# sourceMappingURL=validators.d.ts.map