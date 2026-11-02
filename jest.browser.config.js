module.exports = {
  ...require('./jest.config'),
  testMatch: ['<rootDir>/tests/**/*.e2e.ts'],
  testTimeout: 30000,
}
