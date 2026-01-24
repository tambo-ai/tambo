import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  // Only match test files ending in .test.ts or .test.tsx
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
  moduleNameMapper: {
    // Ensure single React instance - point to monorepo root node_modules
    "^react$": "<rootDir>/../../node_modules/react",
    "^react-dom$": "<rootDir>/../../node_modules/react-dom",
    "^react-dom/(.*)$": "<rootDir>/../../node_modules/react-dom/$1",
    "^react/jsx-runtime$": "<rootDir>/../../node_modules/react/jsx-runtime",
    "^react/jsx-dev-runtime$":
      "<rootDir>/../../node_modules/react/jsx-dev-runtime",
    // Internal package imports
    "^@tambo-ai/ui-registry/utils$": "<rootDir>/src/utils",
    "^@tambo-ai/ui-registry/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@tambo-ai/ui-registry/components/(.*)$": "<rootDir>/src/components/$1",
    // Mock @tambo-ai/react
    "^@tambo-ai/react$": "<rootDir>/__tests__/__mocks__/@tambo-ai-react.ts",
    // Mock @tambo-ai/react/mcp
    "^@tambo-ai/react/mcp$":
      "<rootDir>/__tests__/__mocks__/@tambo-ai-react-mcp.ts",
    // Mock CSS imports
    "\\.(css|less|scss|sass)$": "<rootDir>/__tests__/__mocks__/styleMock.js",
    // Mock react-media-recorder - uses browser APIs not available in jsdom
    "^react-media-recorder$":
      "<rootDir>/__tests__/__mocks__/react-media-recorder.ts",
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
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transformIgnorePatterns: [
    "/node_modules/(?!(json-stringify-pretty-compact|streamdown|unified|bail|devlop|is-plain-obj|trough|vfile|vfile-message|micromark|micromark-util-.*|mdast-util-.*|hast-util-.*|estree-util-.*|unist-util-.*|comma-separated-tokens|property-information|space-separated-tokens|ccount|escape-string-regexp|markdown-table|zwitch|longest-streak|rxjs)/)",
  ],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
