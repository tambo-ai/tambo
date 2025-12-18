import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  // Make jest globals available in ESM mode
  injectGlobals: true,
  moduleNameMapper: {
    // Mock @tambo-ai/react for testing - must come before the real module mapping
    "^@tambo-ai/react$": "<rootDir>/__tests__/__mocks__/@tambo-ai-react.ts",
    // Specific file mappings for files in nested directories but imported with flat paths
    "^@/components/tambo/markdown-components$":
      "<rootDir>/src/registry/message/markdown-components",
    // More specific patterns must come before general @/ pattern
    "^@/components/tambo/(.*)$": "<rootDir>/src/registry/$1",
    // lib files: utils is in src/lib, thread-hooks is in src/registry/lib
    "^@/lib/utils$": "<rootDir>/src/lib/utils",
    "^@/lib/thread-hooks$": "<rootDir>/src/registry/lib/thread-hooks",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Mock CSS imports
    "\\.(css|less|scss|sass)$": "<rootDir>/__tests__/__mocks__/styleMock.js",
    // Mock react-media-recorder - not needed for message tests, causes jsdom issues
    "^react-media-recorder$":
      "<rootDir>/__tests__/__mocks__/react-media-recorder.ts",
    // pkce-challenge's browser build is ESM-only; force the CJS Node.js version
    "^pkce-challenge$":
      "<rootDir>/../node_modules/pkce-challenge/dist/index.node.cjs",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.tsx"],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  // Transform ESM packages that Jest can't handle
  // Streamdown and its dependencies are ESM-only
  transformIgnorePatterns: [
    "/node_modules/(?!(json-stringify-pretty-compact|streamdown|rehype-harden|unist-util-visit|unist-util-is|hast-util-sanitize|unified|bail|devlop|is-plain-obj|trough|vfile|vfile-message|micromark|mdast-util-from-markdown|mdast-util-to-hast|hast-util-to-jsx-runtime|estree-util-is-identifier-name|comma-separated-tokens|property-information|space-separated-tokens|ccount|escape-string-regexp|markdown-table|zwitch|longest-streak|hast-util-whitespace|unist-util-position|unist-util-stringify-position|micromark-util-.*|mdast-util-.*|hast-util-.*|estree-util-.*|unist-util-.*)/)",
  ],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{js,jsx,ts,tsx}",
    "!<rootDir>/src/**/*.test.{js,jsx,ts,tsx}",
    "!<rootDir>/src/**/__tests__/**",
    "!<rootDir>/src/**/__mocks__/**",
    "!<rootDir>/dist/**",
  ],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  coverageThreshold: {
    global: {
      branches: 0,
      lines: 0,
    },
  },
};

export default config;
