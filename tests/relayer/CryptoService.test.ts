import { describe, expect, it } from '@jest/globals';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';

import { CryptoService } from '../../relayer/src/crypto/crypto';

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
