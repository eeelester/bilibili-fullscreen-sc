const baseConfig = require('./jest.config')

module.exports = {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
  testPathIgnorePatterns: [],
  setupFilesAfterEnv: [],
  testTimeout: 30_000,
}
