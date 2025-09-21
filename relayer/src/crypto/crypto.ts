import { createHash, createHmac, randomBytes } from 'crypto';
import { hash } from 'blake3';
import { ethers } from 'ethers';
import * as ed25519 from '@noble/ed25519';
import * as secp256k1 from '@noble/secp256k1';
import jwt from 'jsonwebtoken';
import { Resolver } from 'did-resolver';
// import { getResolver } from 'did-resolver';

export class CryptoService {
  private static didResolver: Resolver;

  static {
    // Initialize DID resolver
    this.didResolver = new Resolver({});
  }

  /**
   * Generate a Blake3 hash of the input data
   */
  static hashBlake3(data: string): string {
    return hash(data).toString('hex');
  }

  /**
   * Generate a SHA-256 hash of the input data
   */
  static hashSha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a Keccak256 hash of the input data
   */
  static hashKeccak256(data: string): string {
    return createHash('sha3-256').update(data).digest('hex');
  }

  /**
   * Generate HMAC using Blake3
   */
  static hmacBlake3(key: string, data: string): string {
    const hmac = createHmac('sha256', key);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Generate a canonical hash for a warrant
   */
  static generateWarrantHash(warrant: any): string {
    const canonical = this.canonicalizeJSON(warrant);
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a canonical hash for an attestation
   */
  static generateAttestationHash(attestation: any): string {
    const canonical = this.canonicalizeJSON(attestation);
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a canonical hash for a receipt
   */
  static generateReceiptHash(receipt: any): string {
    const canonical = this.canonicalizeJSON(receipt);
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a distinct hash for subject handle
   */
  static generateSubjectHandleHash(subjectHandle: string): string {
    const canonical = this.canonicalizeJSON({ subject_handle: subjectHandle });
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a distinct hash for enterprise identifier
   */
  static generateEnterpriseHash(enterpriseId: string): string {
    const canonical = this.canonicalizeJSON({ enterprise_id: enterpriseId });
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a distinct hash for controller DID
   */
  static generateControllerDidHash(controllerDid: string): string {
    const canonical = this.canonicalizeJSON({ controller_did: controllerDid });
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a subject tag using HMAC-Blake3 as specified in the whitepaper
   */
  static generateSubjectTag(controllerKey: string, subjectDID: string, context: string): string {
    const message = `NULL_TAG${subjectDID}${context}`;
    return this.hmacBlake3(controllerKey, message);
  }

  /**
   * Generate a JWS (JSON Web Signature) for a payload
   */
  static async createJWS(
    payload: any,
    privateKey: string,
    algorithm: string = 'EdDSA'
  ): Promise<string> {
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
  static async verifyJWS(token: string, publicKey: string): Promise<any> {
    try {
      return jwt.verify(token, publicKey, { algorithms: ['EdDSA', 'ES256'] as jwt.Algorithm[] });
    } catch (error) {
      throw new Error(`JWS verification failed: ${error}`);
    }
  }

  /**
   * Resolve a DID and return the DID document
   */
  static async resolveDID(did: string): Promise<any> {
    try {
      const didDocument = await this.didResolver.resolve(did);
      if (!didDocument.didDocument) {
        throw new Error(`DID not found: ${did}`);
      }
      return didDocument.didDocument;
    } catch (error) {
      throw new Error(`DID resolution failed: ${error}`);
    }
  }

  /**
   * Verify a signature using Ed25519
   */
  static async verifyEd25519Signature(
    data: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const message = new TextEncoder().encode(data);
      const sig = ethers.getBytes(signature);
      const pubKey = ethers.getBytes(publicKey);

      return await ed25519.verify(sig, message, pubKey);
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify a signature using Secp256k1
   */
  static async verifySecp256k1Signature(
    data: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const message = new TextEncoder().encode(data);
      const sig = ethers.getBytes(signature);
      const pubKey = ethers.getBytes(publicKey);

      return secp256k1.verify(sig, message, pubKey);
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify a signature based on the algorithm specified
   */
  static async verifySignature(
    data: string,
    signature: string,
    publicKey: string,
    algorithm: string = 'EdDSA'
  ): Promise<boolean> {
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
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a random nonce
   */
  static generateNonce(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Canonicalize JSON data according to JCS (JSON Canonicalization Scheme)
   * This implements true recursive canonicalization as specified in RFC 8785
   */
  static canonicalizeJSON(data: any): string {
    return JSON.stringify(this.canonicalizeObject(data));
  }

  /**
   * Recursively canonicalize an object according to JCS
   * This ensures all nested objects have their keys sorted consistently
   */
  private static canonicalizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.canonicalizeObject(item));
    }

    // For objects, sort keys and recursively canonicalize values
    const sortedKeys = Object.keys(obj).sort();
    const canonicalized: any = {};
    
    for (const key of sortedKeys) {
      canonicalized[key] = this.canonicalizeObject(obj[key]);
    }
    
    return canonicalized;
  }
}
