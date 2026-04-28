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
    "^.+\\.[jt]s$": "ts-jest",
  },
  transformIgnorePatterns: [
    // ESM-only deps must be transformed by ts-jest. pnpm symlinks deps under
    // .pnpm/, so the negative lookahead allows matches anywhere in the path.
    "node_modules/(?!.*?(?:quansync|@standard-community|local-pkg|unconfig-core)[/\\\\@])",
  ],
  prettierPath: "prettier-2",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  clearMocks: true,
  resetMocks: true,
};

export default config;
