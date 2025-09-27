import { describe, expect, it } from '@jest/globals';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';

import { CryptoService } from '../../relayer/src/crypto/crypto';

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
