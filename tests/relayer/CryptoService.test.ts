import { beforeAll, describe, expect, it } from '@jest/globals';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import * as ed25519 from '@noble/ed25519';
import * as secp256k1 from '@noble/secp256k1';
import { p256 } from '@noble/curves/p256';

import { CryptoService } from '../../relayer/src/crypto/crypto';

const ed25519Lib = ed25519 as unknown as typeof import('@noble/ed25519');
const secp256k1Lib = secp256k1 as unknown as typeof import('@noble/secp256k1');


const encoder = new TextEncoder();
const verificationPayload = 'signature verification payload';

type SignatureFixture = { valid: string; invalid: string; publicKey: string };

const toBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64');

async function createEd25519Fixture(): Promise<SignatureFixture> {
  const privateKey = ed25519Lib.utils.randomPrivateKey();
  const privateKeyHex = ethers.hexlify(privateKey);
  const signatureHex = await CryptoService.signCanonicalData(
    verificationPayload,
    privateKeyHex,
    'ed25519'
  );
  const publicKeyHex = await CryptoService.derivePublicKey(privateKeyHex, 'ed25519');

  const invalidPrivateKey = ed25519Lib.utils.randomPrivateKey();
  const invalidSignatureHex = await CryptoService.signCanonicalData(
    verificationPayload,
    ethers.hexlify(invalidPrivateKey),
    'ed25519'
  );

  return {
    valid: toBase64(ethers.getBytes(signatureHex)),
    invalid: toBase64(ethers.getBytes(invalidSignatureHex)),
    publicKey: publicKeyHex,
  };
}

async function createSecp256k1Fixture(): Promise<SignatureFixture> {
  const privateKey = secp256k1Lib.utils.randomPrivateKey();
  const publicKeyBytes = secp256k1Lib.getPublicKey(privateKey);
  const messageBytes = encoder.encode(verificationPayload);
  const signatureResult = await secp256k1Lib.sign(messageBytes, privateKey);
  const signatureBytes =
    typeof (signatureResult as any).toCompactRawBytes === 'function'
      ? (signatureResult as any).toCompactRawBytes()
      : Uint8Array.from(signatureResult as Uint8Array);

  const invalidPrivateKey = secp256k1Lib.utils.randomPrivateKey();
  const invalidSignatureResult = await secp256k1Lib.sign(messageBytes, invalidPrivateKey);
  const invalidSignatureBytes =
    typeof (invalidSignatureResult as any).toCompactRawBytes === 'function'
      ? (invalidSignatureResult as any).toCompactRawBytes()
      : Uint8Array.from(invalidSignatureResult as Uint8Array);

  return {
    valid: toBase64(signatureBytes),
    invalid: toBase64(invalidSignatureBytes),
    publicKey: ethers.hexlify(publicKeyBytes),
  };
}

async function createES256Fixture(): Promise<SignatureFixture> {
  const privateKey = p256.utils.randomPrivateKey();
  const publicKeyBytes = p256.getPublicKey(privateKey, false);
  const messageBytes = encoder.encode(verificationPayload);
  const signature = p256.sign(messageBytes, privateKey);
  const signatureBytes =
    typeof (signature as any).toCompactRawBytes === 'function'
      ? (signature as any).toCompactRawBytes()
      : Uint8Array.from(signature as Uint8Array);

  const invalidPrivateKey = p256.utils.randomPrivateKey();
  const invalidSignature = p256.sign(messageBytes, invalidPrivateKey);
  const invalidSignatureBytes =
    typeof (invalidSignature as any).toCompactRawBytes === 'function'
      ? (invalidSignature as any).toCompactRawBytes()
      : Uint8Array.from(invalidSignature as Uint8Array);

  return {
    valid: toBase64(signatureBytes),
    invalid: toBase64(invalidSignatureBytes),
    publicKey: ethers.hexlify(publicKeyBytes),
  };
}

describe('CryptoService.hmacBlake3', () => {
  it('matches the known keyed BLAKE3 digest for a test vector', () => {
    const key = Buffer.from(Array.from({ length: 32 }, (_, i) => i));
    const message = 'The quick brown fox jumps over the lazy dog';
    const expectedDigest = 'f1c78a63454ec51f42b9d88ac49133942182b5ecb380dc9ec90dcd7e6ad675e8';

    expect(CryptoService.hmacBlake3(key, message)).toBe(expectedDigest);
  });
});

describe('CryptoService.createJWS', () => {
  it.each([
    {
      algorithm: 'EdDSA',
      curve: 'Ed25519',
      keyPair: () => generateKeyPairSync('ed25519'),
      payload: { foo: 'bar' },
    },
    {
      algorithm: 'ES256',
      curve: 'P-256',
      keyPair: () => generateKeyPairSync('ec', { namedCurve: 'P-256' }),
      payload: { foo: 'baz' },
    },
  ])('signs and verifies $algorithm tokens', async scenario => {
    const { privateKey, publicKey } = scenario.keyPair();

    const privateKeyPem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();

    const token = await CryptoService.createJWS(
      scenario.payload,
      privateKeyPem,
      scenario.algorithm
    );

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded).not.toBeNull();
    expect(decoded && typeof decoded === 'object' ? decoded.header : undefined).toMatchObject({
      alg: scenario.algorithm,
      typ: 'JWT',
      crv: scenario.curve,
    });

    const verified = await CryptoService.verifyJWS(token, publicKeyPem);
    expect(verified).toMatchObject(scenario.payload);
    expect(typeof (verified as jwt.JwtPayload).iat).toBe('number');
  });
});

describe('CryptoService.verifyEd25519Signature', () => {
  let fixture: SignatureFixture;

  beforeAll(async () => {
    fixture = await createEd25519Fixture();
  });

  it('accepts a valid Ed25519 signature encoded as base64', async () => {
    await expect(
      CryptoService.verifyEd25519Signature(verificationPayload, fixture.valid, fixture.publicKey)
    ).resolves.toBe(true);
  });

  it('rejects an invalid Ed25519 signature encoded as base64', async () => {
    await expect(
      CryptoService.verifyEd25519Signature(verificationPayload, fixture.invalid, fixture.publicKey)
    ).resolves.toBe(false);
  });
});

describe('CryptoService.verifySecp256k1Signature', () => {
  let fixture: SignatureFixture;

  beforeAll(async () => {
    fixture = await createSecp256k1Fixture();
  });

  it('accepts a valid secp256k1 signature encoded as base64', async () => {
    await expect(
      CryptoService.verifySecp256k1Signature(verificationPayload, fixture.valid, fixture.publicKey)
    ).resolves.toBe(true);
  });

  it('rejects an invalid secp256k1 signature encoded as base64', async () => {
    await expect(
      CryptoService.verifySecp256k1Signature(verificationPayload, fixture.invalid, fixture.publicKey)
    ).resolves.toBe(false);
  });
});

describe('CryptoService.verifyES256Signature', () => {
  let fixture: SignatureFixture;

  beforeAll(async () => {
    fixture = await createES256Fixture();
  });

  it('accepts a valid ES256 signature encoded as base64', async () => {
    await expect(
      CryptoService.verifyES256Signature(verificationPayload, fixture.valid, fixture.publicKey)
    ).resolves.toBe(true);
  });

  it('rejects an invalid ES256 signature encoded as base64', async () => {
    await expect(
      CryptoService.verifyES256Signature(verificationPayload, fixture.invalid, fixture.publicKey)
    ).resolves.toBe(false);
  });
});

describe('CryptoService.verifySignature', () => {
  it.each([
    { algorithm: 'EdDSA', factory: createEd25519Fixture },
    { algorithm: 'secp256k1', factory: createSecp256k1Fixture },
    { algorithm: 'ES256', factory: createES256Fixture },
    { algorithm: 'p256', factory: createES256Fixture },
  ])('routes %s signatures through the appropriate verifier', async ({ algorithm, factory }) => {
    const fixture = await factory();

    await expect(
      CryptoService.verifySignature(verificationPayload, fixture.valid, fixture.publicKey, algorithm)
    ).resolves.toBe(true);

    await expect(
      CryptoService.verifySignature(verificationPayload, fixture.invalid, fixture.publicKey, algorithm)
    ).resolves.toBe(false);
  });
});