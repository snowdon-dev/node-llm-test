/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\.(ts|tsx)$": "babel-jest",
  },
  testPathIgnorePatterns: ["/dist", "/benchmark", "/src/__tests__/utils.ts"],
  coverageReporters: ["lcov", "json-summary"],
};
