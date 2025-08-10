// Mock for openid-client library
module.exports = {
  Issuer: {
    discover: jest.fn().mockResolvedValue({
      Client: jest.fn(),
      metadata: {}
    })
  },
  Client: jest.fn(),
  generators: {
    codeVerifier: jest.fn(),
    codeChallenge: jest.fn(),
    state: jest.fn(),
    nonce: jest.fn()
  },
  custom: {
    setHttpOptionsDefaults: jest.fn()
  }
};