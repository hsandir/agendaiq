const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  // Test environments
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: [
        '<rootDir>/src/**/*.test.{ts,tsx}',
        '<rootDir>/src/**/*.spec.{ts,tsx}',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/**/*.test.{ts,js}',
        '<rootDir>/src/**/*.spec.{ts,js}',
      ],
      testPathIgnorePatterns: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.spec.tsx'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/types/**',
    '!src/**/index.{js,ts}', // Ignore barrel exports
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Individual file thresholds
    './src/lib/auth/**/*.{ts,tsx}': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/app/api/**/*.{ts,tsx}': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results/junit',
      outputName: 'junit.xml',
      classNameTemplate: '{classname} - {title}',
      titleTemplate: '{classname} - {title}',
      ancestorSeparator: ' › ',
    }],
    ['jest-html-reporter', {
      pageTitle: 'AgendaIQ Test Report',
      outputPath: './test-results/test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
    }],
    ['jest-sonar-reporter', {
      outputDirectory: './test-results/sonar',
      outputName: 'sonar-report.xml',
    }],
  ],

  // Test utilities
  testTimeout: 30000,
  maxWorkers: '50%',
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],

  // Global setup/teardown
  globalSetup: '<rootDir>/test-utils/global-setup.ts',
  globalTeardown: '<rootDir>/test-utils/global-teardown.ts',

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],

  // Module paths
  modulePaths: ['<rootDir>'],
  
  // Test sequencer for optimized test runs
  testSequencer: '<rootDir>/test-utils/test-sequencer.js',

  // Notification settings
  notify: true,
  notifyMode: 'failure-change',

  // Error handling
  bail: false,
  errorOnDeprecated: true,

  // Performance tracking
  collectCoverage: process.env.CI === 'true',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Cache
  cacheDirectory: '<rootDir>/.jest-cache',
}

module.exports = createJestConfig(customJestConfig)