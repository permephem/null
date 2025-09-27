// Mock for @noble/secp256k1 with deterministic behavior
const { randomBytes } = require('node:crypto');

const signatureStore = new Map();
const toHex = bytes => Buffer.from(bytes).toString('hex');

module.exports = {
  sign: jest.fn(async (message, privateKey) => {
    const signatureBytes = Uint8Array.from(randomBytes(64));
    const entry = {
      message: toHex(message),
      publicKey: toHex(privateKey),
    };
    signatureStore.set(toHex(signatureBytes), entry);
    return {
      toCompactRawBytes: () => Uint8Array.from(signatureBytes),
    };
  }),
  verify: jest.fn((signature, message, publicKey) => {
    const key = typeof signature.toCompactRawBytes === 'function' ? toHex(signature.toCompactRawBytes()) : toHex(signature);
    const record = signatureStore.get(key);
    if (!record) {
      return false;
    }
    return record.message === toHex(message) && record.publicKey === toHex(publicKey);
  }),
  getPublicKey: jest.fn(privateKey => Uint8Array.from(privateKey)),
  utils: {
    randomPrivateKey: jest.fn(() => Uint8Array.from(randomBytes(32))),
    bytesToHex: jest.fn(bytes => Buffer.from(bytes).toString('hex')),
    hexToBytes: jest.fn(hex => Uint8Array.from(Buffer.from(hex, 'hex'))),
    isValidPrivateKey: jest.fn(() => true),
  },
};