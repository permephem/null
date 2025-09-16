// Mock for @noble/ed25519
module.exports = {
  sign: jest.fn(() => new Uint8Array(64)),
  verify: jest.fn(() => true),
  getPublicKey: jest.fn(() => new Uint8Array(32)),
  utils: {
    randomPrivateKey: jest.fn(() => new Uint8Array(32)),
    bytesToHex: jest.fn((bytes) => Buffer.from(bytes).toString('hex')),
    hexToBytes: jest.fn((hex) => new Uint8Array(Buffer.from(hex, 'hex'))),
  },
};
