import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  collectCoverageFrom: [
    "app/**/*.ts",
    "app/**/*.tsx",
    "components/**/*.ts",
    "components/**/*.tsx",
    "lib/**/*.ts",
    "lib/**/*.tsx",
    "providers/**/*.ts",
    "providers/**/*.tsx",
    "trpc/**/*.ts",
    "trpc/**/*.tsx",
    "hooks/**/*.ts",
    "hooks/**/*.tsx",
  ],
  rootDir: ".",
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$":
      "<rootDir>/__mocks__/fileMock.cjs",
    "^@/lib/env$": "<rootDir>/__mocks__/envMock.ts",
    "^@modelcontextprotocol/sdk/client/streamableHttp\\.js$":
      "<rootDir>/__mocks__/mcpStreamableHttpMock.ts",
    "^@modelcontextprotocol/sdk/client/sse\\.js$":
      "<rootDir>/__mocks__/mcpSseMock.ts",
    "^@/(.*)$": "<rootDir>/$1",
    "^@tambo-ai-cloud/(.*)$": "<rootDir>/../../packages/$1/src",
    "^@tambo-ai/react$": "<rootDir>/../../react-sdk/src/index.ts",
    "^@tambo-ai/react/(.*)$": "<rootDir>/../../react-sdk/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx",
          allowJs: true,
        },
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transformIgnorePatterns: [
    "/node_modules/(?!@modelcontextprotocol/sdk|pkce-challenge)/",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/dist/"],
  coverageThreshold: {
    global: {
      branches: 8,
      lines: 13,
    },
  },
};

export default config;
