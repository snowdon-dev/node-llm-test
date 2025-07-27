/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\.(ts|tsx)$' : 'babel-jest',
  },
  "coverageReporters": [
    "lcov",
    "json-summary"
  ]
};
