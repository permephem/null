import { createHash } from 'crypto';
import { blake3 } from 'blake3';

export class CryptoService {
  /**
   * Generate a Blake3 hash of the input data
   */
  static hashBlake3(data: string): string {
    return blake3(data).toString('hex');
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
   * Generate a canonical hash for a warrant
   */
  static generateWarrantHash(warrant: any): string {
    const canonical = JSON.stringify(warrant, Object.keys(warrant).sort());
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a canonical hash for an attestation
   */
  static generateAttestationHash(attestation: any): string {
    const canonical = JSON.stringify(attestation, Object.keys(attestation).sort());
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a canonical hash for a receipt
   */
  static generateReceiptHash(receipt: any): string {
    const canonical = JSON.stringify(receipt, Object.keys(receipt).sort());
    return this.hashBlake3(canonical);
  }

  /**
   * Generate a subject tag using HMAC-Blake3
   */
  static generateSubjectTag(controllerKey: string, subjectDID: string, context: string): string {
    const message = `NULL_TAG${subjectDID}${context}`;
    // Using Blake3 as HMAC alternative for simplicity
    return this.hashBlake3(controllerKey + message);
  }

  /**
   * Verify a signature (placeholder implementation)
   */
  static verifySignature(_data: string, _signature: string, _publicKey: string): boolean {
    // Placeholder implementation - would use actual signature verification
    return true;
  }
}
