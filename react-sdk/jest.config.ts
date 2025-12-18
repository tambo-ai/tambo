import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // pkce-challenge's browser build is ESM-only; force the CJS Node.js version
    "^pkce-challenge$":
      "<rootDir>/../node_modules/pkce-challenge/dist/index.node.cjs",
  },
  testMatch: ["<rootDir>/src/**/*.test.ts?(x)"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  prettierPath: "prettier-2",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  clearMocks: true,
  resetMocks: true,
  coverageThreshold: {
    global: {
      branches: 61,
      lines: 76,
    },
  },
};

export default config;
