import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    // Subpath exports (e.g. `@tambo-ai-cloud/core/safe-fetch`) must come first
    // so the broad pattern below doesn't swallow them.
    "^@tambo-ai-cloud/core/safe-fetch$":
      "<rootDir>/../../packages/core/src/safe-fetch",
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../packages/$1/src",
  },
  prettierPath: "prettier-2",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{js,jsx,ts,tsx}",
    "!<rootDir>/src/**/*.test.{js,jsx,ts,tsx}",
    "!<rootDir>/src/**/__tests__/**",
    "!<rootDir>/src/**/__mocks__/**",
    "!<rootDir>/dist/**",
  ],
  coverageThreshold: {
    global: {
      branches: 49,
      lines: 60,
    },
  },
};

export default config;
