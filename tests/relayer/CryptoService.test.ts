import { describe, expect, it } from '@jest/globals';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';

import { CryptoService } from '../../relayer/src/crypto/crypto';

describe('CryptoService.createJWS', () => {
  it('signs and verifies EdDSA (Ed25519) tokens', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');

    const payload = {
      foo: 'bar',
    };

    const privateKeyPem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();

    const token = await CryptoService.createJWS(payload, privateKeyPem, 'EdDSA');

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded).not.toBeNull();
    expect(decoded && typeof decoded === 'object' ? decoded.header : undefined).toMatchObject({
      alg: 'EdDSA',
      typ: 'JWT',
      crv: 'Ed25519',
    });

    const verified = await CryptoService.verifyJWS(token, publicKeyPem);
    expect(verified).toMatchObject(payload);
    expect(typeof (verified as jwt.JwtPayload).iat).toBe('number');
  });

  it('signs and verifies ES256 (P-256) tokens', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

    const payload = {
      foo: 'baz',
    };

    const privateKeyPem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const publicKeyPem = publicKey.export({ format: 'pem', type: 'spki' }).toString();

    const token = await CryptoService.createJWS(payload, privateKeyPem, 'ES256');

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded).not.toBeNull();
    expect(decoded && typeof decoded === 'object' ? decoded.header : undefined).toMatchObject({
      alg: 'ES256',
      typ: 'JWT',
      crv: 'P-256',
    });

    const verified = await CryptoService.verifyJWS(token, publicKeyPem);
    expect(verified).toMatchObject(payload);
    expect(typeof (verified as jwt.JwtPayload).iat).toBe('number');
  });
});
