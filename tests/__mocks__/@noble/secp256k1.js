// Mock for @noble/secp256k1
module.exports = {
  sign: jest.fn(() => ({ r: BigInt(1), s: BigInt(1), recovery: 0 })),
  verify: jest.fn(() => true),
  getPublicKey: jest.fn(() => new Uint8Array(33)),
  utils: {
    randomPrivateKey: jest.fn(() => new Uint8Array(32)),
    bytesToHex: jest.fn((bytes) => Buffer.from(bytes).toString('hex')),
    hexToBytes: jest.fn((hex) => new Uint8Array(Buffer.from(hex, 'hex'))),
    isValidPrivateKey: jest.fn(() => true),
  },
};
