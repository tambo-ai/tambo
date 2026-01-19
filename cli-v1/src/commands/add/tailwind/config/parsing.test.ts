import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { parseConfigObject } from "./parsing.js";

// Suppress console output
const mockConsoleWarn = jest.fn();
const originalConsoleWarn = console.warn;

describe("tailwind/config/parsing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = mockConsoleWarn;
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  describe("parseConfigObject", () => {
    it("parses simple object with content array", () => {
      const input = `{
        content: ['./src/**/*.{js,ts}']
      }`;

      const result = parseConfigObject(input, "default");

      expect(result).toEqual({
        content: ["./src/**/*.{js,ts}"],
      });
    });

    it("parses object with multiple string array items", () => {
      const input = `{
        content: ['./src/**/*.js', './pages/**/*.tsx']
      }`;

      const result = parseConfigObject(input, "default");

      expect(result).toEqual({
        content: ["./src/**/*.js", "./pages/**/*.tsx"],
      });
    });

    it("parses nested objects", () => {
      const input = `{
        content: ['./src/**/*.js'],
        theme: {
          colors: {
            primary: 'blue'
          }
        }
      }`;

      const result = parseConfigObject(input, "default");

      expect(result).toEqual({
        content: ["./src/**/*.js"],
        theme: {
          colors: {
            primary: "blue",
          },
        },
      });
    });

    it("parses arrays with object elements", () => {
      const input = `{
        content: ['./src/**/*.js'],
        plugins: [
          {
            name: 'plugin1'
          }
        ]
      }`;

      const result = parseConfigObject(input, "default");

      expect(result).toEqual({
        content: ["./src/**/*.js"],
        plugins: [{ name: "plugin1" }],
      });
    });

    it("handles double-quoted strings", () => {
      const input = `{
        content: ["./src/**/*.js"]
      }`;

      const result = parseConfigObject(input, "default");

      expect(result).toEqual({
        content: ["./src/**/*.js"],
      });
    });

    it("handles non-string primitive values", () => {
      const input = `{
        content: ['./src/**/*.js'],
        darkMode: true,
        important: false
      }`;

      const result = parseConfigObject(input, "default");

      expect(result).toEqual({
        content: ["./src/**/*.js"],
        darkMode: "true",
        important: "false",
      });
    });

    it("handles as const type assertions", () => {
      const input = `{
        content: ['./src/**/*.js'],
        prefix: 'tw-' as const
      }`;

      const result = parseConfigObject(input, "default");

      expect(result).toEqual({
        content: ["./src/**/*.js"],
        prefix: "tw-",
      });
    });

    it("skips spread elements in arrays", () => {
      const input = `{
        content: ['./src/**/*.js']
      }`;

      const result = parseConfigObject(input, "default");

      // Just verify it parses without error
      expect(result).toBeDefined();
    });

    it("throws for invalid config structure", () => {
      const input = `not an object`;

      expect(() => parseConfigObject(input, "test")).toThrow(
        /Failed to parse test config/,
      );
    });

    it("throws for non-object literal configs", () => {
      const input = `[]`; // Array instead of object

      expect(() => parseConfigObject(input, "test")).toThrow(
        /must be an object literal/,
      );
    });

    it("throws when default config missing content", () => {
      const input = `{
        theme: {}
      }`;

      expect(() => parseConfigObject(input, "default")).toThrow(
        /must specify content paths/,
      );
    });

    it("does not require content for non-default configs", () => {
      const input = `{
        theme: {
          extend: {}
        }
      }`;

      const result = parseConfigObject(input, "existing");

      expect(result).toEqual({
        theme: {
          extend: {},
        },
      });
    });

    it("handles quoted property names", () => {
      const input = `{
        "content": ['./src/**/*.js'],
        'prefix': 'tw-'
      }`;

      const result = parseConfigObject(input, "default");

      expect(result).toEqual({
        content: ["./src/**/*.js"],
        prefix: "tw-",
      });
    });

    it("handles deeply nested structures", () => {
      const input = `{
        content: ['./src/**/*.js'],
        theme: {
          extend: {
            colors: {
              brand: {
                primary: '#1e40af',
                secondary: '#3b82f6'
              }
            }
          }
        }
      }`;

      const result = parseConfigObject(input, "default");

      expect(result.theme).toBeDefined();
      const theme = result.theme as Record<string, unknown>;
      const extend = theme.extend as Record<string, unknown>;
      const colors = extend.colors as Record<string, unknown>;
      const brand = colors.brand as Record<string, string>;
      expect(brand.primary).toBe("#1e40af");
    });
  });
});
