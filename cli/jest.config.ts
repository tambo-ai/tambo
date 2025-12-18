import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    // Mock @tambo-ai/react for testing
    "^@tambo-ai/react$": "<rootDir>/__tests__/__mocks__/@tambo-ai-react.ts",
    // Path mappings for registry components
    "^@/components/tambo/markdown-components$":
      "<rootDir>/src/registry/message/markdown-components",
    "^@/components/tambo/(.*)$": "<rootDir>/src/registry/$1",
    "^@/lib/utils$": "<rootDir>/src/lib/utils",
    "^@/lib/thread-hooks$": "<rootDir>/src/registry/lib/thread-hooks",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Mock CSS imports
    "\\.(css|less|scss|sass)$": "<rootDir>/__tests__/__mocks__/styleMock.js",
    // Mock react-media-recorder - uses browser APIs not available in jsdom
    "^react-media-recorder$":
      "<rootDir>/__tests__/__mocks__/react-media-recorder.ts",
    // pkce-challenge's browser build is ESM-only; force the CJS Node.js version
    "^pkce-challenge$":
      "<rootDir>/../node_modules/pkce-challenge/dist/index.node.cjs",
    // ESM import mapping
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  // Match both CLI tests in src/ and React component tests in __tests__/
  testMatch: [
    "<rootDir>/src/**/*.test.ts",
    "<rootDir>/__tests__/**/*.test.tsx",
  ],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  // Transform ESM packages - many packages are ESM-only now
  transformIgnorePatterns: [
    "/node_modules/(?!(json-stringify-pretty-compact|streamdown|unified|bail|devlop|is-plain-obj|trough|vfile|vfile-message|micromark|micromark-util-.*|mdast-util-.*|hast-util-.*|estree-util-.*|unist-util-.*|comma-separated-tokens|property-information|space-separated-tokens|ccount|escape-string-regexp|markdown-table|zwitch|longest-streak|rxjs)/)",
  ],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{js,jsx,ts,tsx}",
    "!<rootDir>/src/**/*.test.{js,jsx,ts,tsx}",
    "!<rootDir>/src/**/__tests__/**",
    "!<rootDir>/src/**/__mocks__/**",
    "!<rootDir>/dist/**",
  ],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  coverageThreshold: {
    global: {
      branches: 12,
      lines: 16,
    },
  },
};

export default config;
