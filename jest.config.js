module.exports = {
  clearMocks: true,
  collectCoverage: false,
  collectCoverageFrom: [
    'entrypoints/fullScreen.content/fullscreenState.ts',
    'entrypoints/fullScreen.content/wbi.ts',
    'utils/color.ts',
    'utils/deletedSc.ts',
    'utils/event.ts',
    'utils/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/$1',
  },
  preset: 'ts-jest',
  setupFilesAfterEnv: ['./tests/jest-setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
}
