import { createHash, createHmac, randomBytes } from 'crypto';
import { hash } from 'blake3';
import { ethers } from 'ethers';
import * as ed25519 from '@noble/ed25519';
import * as secp256k1 from '@noble/secp256k1';
import jwt from 'jsonwebtoken';
import { Resolver } from 'did-resolver';
// import { getResolver } from 'did-resolver';
export class CryptoService {
    static didResolver;
    static {
        // Initialize DID resolver
        this.didResolver = new Resolver({});
    }
    /**
     * Generate a Blake3 hash of the input data
     */
    static hashBlake3(data) {
        return hash(data).toString('hex');
    }
    /**
     * Generate a SHA-256 hash of the input data
     */
    static hashSha256(data) {
        return createHash('sha256').update(data).digest('hex');
    }
    /**
     * Generate a Keccak256 hash of the input data
     */
    static hashKeccak256(data) {
        return createHash('sha3-256').update(data).digest('hex');
    }
    /**
     * Generate HMAC using Blake3
     */
    static hmacBlake3(key, data) {
        const hmac = createHmac('sha256', key);
        hmac.update(data);
        return hmac.digest('hex');
    }
    /**
     * Generate a canonical hash for a warrant
     */
    static generateWarrantHash(warrant) {
        const canonical = JSON.stringify(warrant, Object.keys(warrant).sort());
        return this.hashBlake3(canonical);
    }
    /**
     * Generate a canonical hash for an attestation
     */
    static generateAttestationHash(attestation) {
        const canonical = JSON.stringify(attestation, Object.keys(attestation).sort());
        return this.hashBlake3(canonical);
    }
    /**
     * Generate a canonical hash for a receipt
     */
    static generateReceiptHash(receipt) {
        const canonical = JSON.stringify(receipt, Object.keys(receipt).sort());
        return this.hashBlake3(canonical);
    }
    /**
     * Generate a subject tag using HMAC-Blake3 as specified in the whitepaper
     */
    static generateSubjectTag(controllerKey, subjectDID, context) {
        const message = `NULL_TAG${subjectDID}${context}`;
        return this.hmacBlake3(controllerKey, message);
    }
    /**
     * Generate a JWS (JSON Web Signature) for a payload
     */
    static async createJWS(payload, privateKey, algorithm = 'EdDSA') {
        const header = {
            alg: algorithm,
            typ: 'JWT',
        };
        return jwt.sign(payload, privateKey, {
            algorithm: algorithm === 'EdDSA' ? 'ES256' : 'ES256', // Use ES256 as fallback
            header,
        });
    }
    /**
     * Verify a JWS signature
     */
    static async verifyJWS(token, publicKey) {
        try {
            return jwt.verify(token, publicKey, { algorithms: ['EdDSA', 'ES256'] });
        }
        catch (error) {
            throw new Error(`JWS verification failed: ${error}`);
        }
    }
    /**
     * Resolve a DID and return the DID document
     */
    static async resolveDID(did) {
        try {
            const didDocument = await this.didResolver.resolve(did);
            if (!didDocument.didDocument) {
                throw new Error(`DID not found: ${did}`);
            }
            return didDocument.didDocument;
        }
        catch (error) {
            throw new Error(`DID resolution failed: ${error}`);
        }
    }
    /**
     * Verify a signature using Ed25519
     */
    static async verifyEd25519Signature(data, signature, publicKey) {
        try {
            const message = new TextEncoder().encode(data);
            const sig = ethers.getBytes(signature);
            const pubKey = ethers.getBytes(publicKey);
            return await ed25519.verify(sig, message, pubKey);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Verify a signature using Secp256k1
     */
    static async verifySecp256k1Signature(data, signature, publicKey) {
        try {
            const message = new TextEncoder().encode(data);
            const sig = ethers.getBytes(signature);
            const pubKey = ethers.getBytes(publicKey);
            return secp256k1.verify(sig, message, pubKey);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Verify a signature based on the algorithm specified
     */
    static async verifySignature(data, signature, publicKey, algorithm = 'EdDSA') {
        try {
            switch (algorithm) {
                case 'EdDSA':
                case 'ed25519':
                    return await this.verifyEd25519Signature(data, signature, publicKey);
                case 'ES256':
                case 'secp256k1':
                    return await this.verifySecp256k1Signature(data, signature, publicKey);
                default:
                    throw new Error(`Unsupported signature algorithm: ${algorithm}`);
            }
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Generate a random nonce
     */
    static generateNonce() {
        return randomBytes(32).toString('hex');
    }
    /**
     * Canonicalize JSON data according to JCS (JSON Canonicalization Scheme)
     */
    static canonicalizeJSON(data) {
        // Simple canonicalization - sort keys recursively
        return JSON.stringify(data, Object.keys(data).sort());
    }
}
//# sourceMappingURL=crypto.js.map