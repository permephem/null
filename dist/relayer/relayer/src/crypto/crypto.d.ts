export declare class CryptoService {
    private static didResolver;
    /**
     * Generate a Blake3 hash of the input data
     */
    static hashBlake3(data: string): string;
    /**
     * Generate a SHA-256 hash of the input data
     */
    static hashSha256(data: string): string;
    /**
     * Generate a Keccak256 hash of the input data
     */
    static hashKeccak256(data: string): string;
    /**
     * Generate HMAC using Blake3
     */
    static hmacBlake3(key: string, data: string): string;
    /**
     * Generate a canonical hash for a warrant
     */
    static generateWarrantHash(warrant: any): string;
    /**
     * Generate a canonical hash for an attestation
     */
    static generateAttestationHash(attestation: any): string;
    /**
     * Generate a canonical hash for a receipt
     */
    static generateReceiptHash(receipt: any): string;
    /**
     * Generate a subject tag using HMAC-Blake3 as specified in the whitepaper
     */
    static generateSubjectTag(controllerKey: string, subjectDID: string, context: string): string;
    /**
     * Generate a JWS (JSON Web Signature) for a payload
     */
    static createJWS(payload: any, privateKey: string, algorithm?: string): Promise<string>;
    /**
     * Verify a JWS signature
     */
    static verifyJWS(token: string, publicKey: string): Promise<any>;
    /**
     * Resolve a DID and return the DID document
     */
    static resolveDID(did: string): Promise<any>;
    /**
     * Verify a signature using Ed25519
     */
    static verifyEd25519Signature(data: string, signature: string, publicKey: string): Promise<boolean>;
    /**
     * Verify a signature using Secp256k1
     */
    static verifySecp256k1Signature(data: string, signature: string, publicKey: string): Promise<boolean>;
    /**
     * Verify a signature based on the algorithm specified
     */
    static verifySignature(data: string, signature: string, publicKey: string, algorithm?: string): Promise<boolean>;
    /**
     * Generate a random nonce
     */
    static generateNonce(): string;
    /**
     * Canonicalize JSON data according to JCS (JSON Canonicalization Scheme)
     */
    static canonicalizeJSON(data: any): string;
}
//# sourceMappingURL=crypto.d.ts.map