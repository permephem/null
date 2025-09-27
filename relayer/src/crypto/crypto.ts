import { createHash, randomBytes, sign as signData, verify as verifyData } from 'crypto';
import { createKeyed, hash } from 'blake3';
import { ethers } from 'ethers';
import * as ed25519 from '@noble/ed25519';
import * as secp256k1 from '@noble/secp256k1';
import { p256 } from '@noble/curves/p256';
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
  static hmacBlake3(key: string | Buffer, data: string): string {
    const keyBuffer = Buffer.isBuffer(key) ? Buffer.from(key) : Buffer.from(key, 'utf8');
    const derivedKey = keyBuffer.length === 32 ? keyBuffer : hash(keyBuffer);
    if (!Buffer.isBuffer(derivedKey)) {
      throw new Error('Failed to derive BLAKE3 key material');
    }
    const hasher = createKeyed(derivedKey);
    hasher.update(data);
    return hasher.digest('hex');
  }

  /**
   * Generate a canonical hash for a warrant
   */
  static generateWarrantHash(warrant: any): string {
    const canonical = this.canonicalizeJSON(warrant);
    return ethers.hexlify(hash(canonical));
  }

  /**
   * Generate a canonical hash for an attestation
   */
  static generateAttestationHash(attestation: any): string {
    const canonical = this.canonicalizeJSON(attestation);
    return ethers.hexlify(hash(canonical));
  }

  /**
   * Generate a canonical hash for a receipt
   */
  static generateReceiptHash(receipt: any): string {
    const canonical = this.canonicalizeJSON(receipt);
    return ethers.hexlify(hash(canonical));
  }

  /**
   * Generate a distinct hash for subject handle
   */
  static generateSubjectHandleHash(subjectHandle: string): string {
    const canonical = this.canonicalizeJSON({ subject_handle: subjectHandle });
    return ethers.hexlify(hash(canonical));
  }

  /**
   * Generate a distinct hash for enterprise identifier
   */
  static generateEnterpriseHash(enterpriseId: string): string {
    const canonical = this.canonicalizeJSON({ enterprise_id: enterpriseId });
    return ethers.hexlify(hash(canonical));
  }

  /**
   * Generate a distinct hash for controller DID
   */
  static generateControllerDidHash(controllerDid: string): string {
    const canonical = this.canonicalizeJSON({ controller_did: controllerDid });
    return ethers.hexlify(hash(canonical));
  }

  /**
   * Generate a subject tag using keyed Blake3 as specified in the whitepaper
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
    const header: jwt.JwtHeader & { crv?: string } = {
      alg: algorithm,
      typ: 'JWT',
    };

    const curveByAlgorithm: Record<string, string> = {
      EdDSA: 'Ed25519',
      ES256: 'P-256',
    };

    if (curveByAlgorithm[algorithm]) {
      header.crv = curveByAlgorithm[algorithm];
    }

    if (algorithm === 'EdDSA') {
      if (typeof payload !== 'object' || payload === null) {
        throw new Error('EdDSA signing requires an object payload');
      }

      const payloadWithIat: Record<string, unknown> = {
        ...payload,
      };

      if (payloadWithIat.iat === undefined) {
        payloadWithIat.iat = Math.floor(Date.now() / 1000);
      }

      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(payloadWithIat)).toString('base64url');
      const signingInput = `${encodedHeader}.${encodedPayload}`;
      const signature = signData(null, Buffer.from(signingInput), privateKey);
      const encodedSignature = Buffer.from(signature).toString('base64url');

      return `${signingInput}.${encodedSignature}`;
    }

    if (!['ES256'].includes(algorithm)) {
      throw new Error(`Unsupported JWS algorithm: ${algorithm}`);
    }

    return jwt.sign(payload, privateKey, {
      algorithm: algorithm as jwt.Algorithm,
      header,
    });
  }

  /**
   * Verify a JWS signature
   */
  static async verifyJWS(token: string, publicKey: string): Promise<any> {
    try {
      const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

      if (!encodedHeader || !encodedPayload || !encodedSignature) {
        throw new Error('Invalid JWS format');
      }

      const headerJson = Buffer.from(encodedHeader, 'base64url').toString('utf8');
      const header = JSON.parse(headerJson) as jwt.JwtHeader & { alg?: string };

      if (header.alg === 'EdDSA') {
        const verified = verifyData(
          null,
          Buffer.from(`${encodedHeader}.${encodedPayload}`),
          publicKey,
          Buffer.from(encodedSignature, 'base64url')
        );

        if (!verified) {
          throw new Error('Invalid signature');
        }

        const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
        return JSON.parse(payloadJson);
      }

      return jwt.verify(token, publicKey, { algorithms: ['ES256'] as jwt.Algorithm[] });
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
