const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@auth/prisma-adapter$': '<rootDir>/src/__mocks__/@auth/prisma-adapter.ts',
    '^next-auth$': '<rootDir>/src/__mocks__/next-auth.ts',
    '^@/lib/auth$': '<rootDir>/src/__mocks__/auth.ts',
    '^next/server$': '<rootDir>/src/__mocks__/next-server.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@next-auth|@auth|@prisma|prisma|@auth/prisma-adapter|@auth/core|@auth/nextjs|@auth/prisma-adapter|next-auth/providers|@react-pdf)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/index.ts',
    '!src/**/index.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testTimeout: 10000,
  maxWorkers: 1, // Reduce concurrency to avoid memory issues
  // Force Jest to handle ES modules properly
  preset: undefined,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
