// Mock for @noble/ed25519 with simple deterministic behavior
const { randomBytes } = require('node:crypto');

const signatureStore = new Map();

const toHex = bytes => Buffer.from(bytes).toString('hex');

module.exports = {
  sign: jest.fn(async (message, privateKey) => {
    const signature = Uint8Array.from(randomBytes(64));
    signatureStore.set(toHex(signature), {
      message: toHex(message),
      publicKey: toHex(privateKey),
    });
    return signature;
  }),
  verify: jest.fn((signature, message, publicKey) => {
    const record = signatureStore.get(toHex(signature));
    if (!record) {
      return false;
    }
    return record.message === toHex(message) && record.publicKey === toHex(publicKey);
  }),
  getPublicKey: jest.fn(async privateKey => Uint8Array.from(privateKey)),
  utils: {
    randomPrivateKey: jest.fn(() => Uint8Array.from(randomBytes(32))),
    bytesToHex: jest.fn(bytes => Buffer.from(bytes).toString('hex')),
    hexToBytes: jest.fn(hex => Uint8Array.from(Buffer.from(hex, 'hex'))),
  },
};