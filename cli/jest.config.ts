import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // pkce-challenge's browser build is ESM-only; force the CJS Node.js version
    "^pkce-challenge$":
      "<rootDir>/../node_modules/pkce-challenge/dist/index.node.cjs",
    // ESM import mapping
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  // Transform ESM packages - many packages are ESM-only now
  transformIgnorePatterns: [
    "/node_modules/(?!(json-stringify-pretty-compact|streamdown|unified|bail|devlop|is-plain-obj|trough|vfile|vfile-message|micromark|micromark-util-.*|mdast-util-.*|hast-util-.*|estree-util-.*|unist-util-.*|comma-separated-tokens|property-information|space-separated-tokens|ccount|escape-string-regexp|markdown-table|zwitch|longest-streak|rxjs)/)",
  ],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.(ts|tsx)",
    "!<rootDir>/src/**/*.test.(ts|tsx)",
  ],
  coverageThreshold: {
    global: {
      branches: 18,
      lines: 23,
    },
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
