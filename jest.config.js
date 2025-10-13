/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\.(ts|tsx)$' : 'babel-jest',
  },
  testPathIgnorePatterns: [
    '/dist',
    "/src/__tests__/utils.ts",
  ],
  "coverageReporters": [
    "lcov",
    "json-summary"
  ]
};
