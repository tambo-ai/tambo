import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@tambo-ai/react$": "<rootDir>/../react-sdk/src/index.ts",
    "^@tambo-ai/react/(.*)$": "<rootDir>/../react-sdk/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/components/tambo/(.*)$": "<rootDir>/src/registry/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
  },
  testMatch: [
    "<rootDir>/src/**/*.test.ts",
    "<rootDir>/__tests__/**/*.test.tsx",
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
