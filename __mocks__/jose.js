// Mock for jose library
module.exports = {
  compactDecrypt: jest.fn(),
  CompactEncrypt: jest.fn(),
  EncryptJWT: jest.fn(),
  jwtDecrypt: jest.fn(),
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
  importJWK: jest.fn(),
  importSPKI: jest.fn(),
  importPKCS8: jest.fn(),
  generateKeyPair: jest.fn()
};