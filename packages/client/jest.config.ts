import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  passWithNoTests: true,
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{ts}",
    "!<rootDir>/src/**/*.test.{ts}",
    "!<rootDir>/src/**/__tests__/**",
    "!<rootDir>/src/**/__mocks__/**",
    "!<rootDir>/dist/**",
    "!<rootDir>/esm/**",
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  prettierPath: "prettier-2",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  setupFilesAfterSetup: [],
  clearMocks: true,
  resetMocks: true,
};

export default config;
