import { createRequire } from "node:module";
import path from "node:path";
import type { Config } from "jest";

const require = createRequire(import.meta.url);
const mcpSdkCjsDirectory = path.dirname(
  path.dirname(require.resolve("@modelcontextprotocol/sdk/client/index.js")),
);

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // pkce-challenge's browser build is ESM-only; force the CJS Node.js version
    "^pkce-challenge$":
      "<rootDir>/../node_modules/pkce-challenge/dist/index.node.cjs",
    // dedupe MCP SDK so jest.mock() in this package also mocks imports made
    // from the @tambo-ai/client workspace, which has its own nested copy
    "^@modelcontextprotocol/sdk/(.*)\\.js$": `${mcpSdkCjsDirectory}/$1.js`,
  },
  testMatch: ["<rootDir>/src/**/*.test.ts?(x)"],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{js,jsx,ts,tsx}",
    "!<rootDir>/src/**/*.test.{js,jsx,ts,tsx}",
    "!<rootDir>/src/**/__tests__/**",
    "!<rootDir>/src/**/__mocks__/**",
    "!<rootDir>/src/setupTests.ts",
    "!<rootDir>/dist/**",
    "!<rootDir>/esm/**",
  ],
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
      branches: 84,
      lines: 88,
    },
  },
};

export default config;
