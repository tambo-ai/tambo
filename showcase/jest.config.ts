import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$":
      "<rootDir>/__mocks__/fileMock.cjs",
  },
  testMatch: ["<rootDir>/src/**/*.test.ts?(x)"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  clearMocks: true,
  resetMocks: true,
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/dist/"],
  coverageThreshold: {
    global: {
      branches: 52,
      lines: 79,
    },
  },
};

export default config;
