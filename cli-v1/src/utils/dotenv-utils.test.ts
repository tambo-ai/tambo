import { describe, expect, it } from "@jest/globals";
import {
  parseDotenvContent,
  findTamboApiKey,
  findAllTamboApiKeys,
  setTamboApiKey,
  removeTamboApiKeys,
  TAMBO_API_KEY_NAMES,
} from "./dotenv-utils.js";

describe("dotenv-utils", () => {
  describe("parseDotenvContent", () => {
    it("parses simple key-value pairs", () => {
      const content = "FOO=bar\nBAZ=qux";
      const result = parseDotenvContent(content);
      expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
    });

    it("handles quoted values", () => {
      const content = 'FOO="bar with spaces"';
      const result = parseDotenvContent(content);
      expect(result.FOO).toBe("bar with spaces");
    });

    it("handles empty content", () => {
      const result = parseDotenvContent("");
      expect(result).toEqual({});
    });

    it("ignores comments", () => {
      const content = "# comment\nFOO=bar";
      const result = parseDotenvContent(content);
      expect(result).toEqual({ FOO: "bar" });
    });

    it("handles empty values", () => {
      const content = "FOO=";
      const result = parseDotenvContent(content);
      expect(result.FOO).toBe("");
    });
  });

  describe("findTamboApiKey", () => {
    it("finds NEXT_PUBLIC_TAMBO_API_KEY", () => {
      const content = "NEXT_PUBLIC_TAMBO_API_KEY=key123";
      const result = findTamboApiKey(content);
      expect(result).toEqual({
        keyName: "NEXT_PUBLIC_TAMBO_API_KEY",
        value: "key123",
      });
    });

    it("finds VITE_TAMBO_API_KEY", () => {
      const content = "VITE_TAMBO_API_KEY=key456";
      const result = findTamboApiKey(content);
      expect(result).toEqual({
        keyName: "VITE_TAMBO_API_KEY",
        value: "key456",
      });
    });

    it("finds REACT_APP_TAMBO_API_KEY", () => {
      const content = "REACT_APP_TAMBO_API_KEY=key789";
      const result = findTamboApiKey(content);
      expect(result).toEqual({
        keyName: "REACT_APP_TAMBO_API_KEY",
        value: "key789",
      });
    });

    it("finds TAMBO_API_KEY", () => {
      const content = "TAMBO_API_KEY=keyabc";
      const result = findTamboApiKey(content);
      expect(result).toEqual({
        keyName: "TAMBO_API_KEY",
        value: "keyabc",
      });
    });

    it("returns first match in priority order", () => {
      const content =
        "TAMBO_API_KEY=low\nNEXT_PUBLIC_TAMBO_API_KEY=high\nVITE_TAMBO_API_KEY=mid";
      const result = findTamboApiKey(content);
      // NEXT_PUBLIC_TAMBO_API_KEY has higher priority
      expect(result?.keyName).toBe("NEXT_PUBLIC_TAMBO_API_KEY");
    });

    it("returns null when no Tambo key found", () => {
      const content = "OTHER_KEY=value";
      const result = findTamboApiKey(content);
      expect(result).toBeNull();
    });

    it("returns null for empty content", () => {
      const result = findTamboApiKey("");
      expect(result).toBeNull();
    });
  });

  describe("findAllTamboApiKeys", () => {
    it("finds all Tambo key variants", () => {
      const content =
        "NEXT_PUBLIC_TAMBO_API_KEY=a\nVITE_TAMBO_API_KEY=b\nTAMBO_API_KEY=c";
      const result = findAllTamboApiKeys(content);
      expect(result).toContain("NEXT_PUBLIC_TAMBO_API_KEY");
      expect(result).toContain("VITE_TAMBO_API_KEY");
      expect(result).toContain("TAMBO_API_KEY");
    });

    it("returns empty array when no Tambo keys", () => {
      const content = "OTHER_KEY=value";
      const result = findAllTamboApiKeys(content);
      expect(result).toEqual([]);
    });

    it("returns empty array for empty content", () => {
      const result = findAllTamboApiKeys("");
      expect(result).toEqual([]);
    });
  });

  describe("setTamboApiKey", () => {
    it("adds key to empty content", () => {
      const result = setTamboApiKey("", "TAMBO_API_KEY", "newkey");
      expect(result).toBe("TAMBO_API_KEY=newkey\n");
    });

    it("appends key to existing content", () => {
      const content = "OTHER_KEY=value\n";
      const result = setTamboApiKey(content, "TAMBO_API_KEY", "newkey");
      expect(result).toBe("OTHER_KEY=value\nTAMBO_API_KEY=newkey\n");
    });

    it("replaces existing Tambo key", () => {
      const content = "TAMBO_API_KEY=oldkey\n";
      const result = setTamboApiKey(content, "TAMBO_API_KEY", "newkey");
      expect(result).toBe("TAMBO_API_KEY=newkey\n");
      expect(result).not.toContain("oldkey");
    });

    it("removes all existing Tambo keys when setting new one", () => {
      const content =
        "NEXT_PUBLIC_TAMBO_API_KEY=a\nOTHER=b\nVITE_TAMBO_API_KEY=c";
      const result = setTamboApiKey(content, "TAMBO_API_KEY", "newkey");
      expect(result).not.toContain("NEXT_PUBLIC_TAMBO_API_KEY");
      expect(result).not.toContain("VITE_TAMBO_API_KEY");
      expect(result).toContain("OTHER=b");
      expect(result).toContain("TAMBO_API_KEY=newkey");
    });

    it("preserves comments and blank lines", () => {
      const content = "# comment\n\nOTHER=value";
      const result = setTamboApiKey(content, "TAMBO_API_KEY", "newkey");
      expect(result).toContain("# comment");
      expect(result).toContain("OTHER=value");
    });

    it("handles content without trailing newline", () => {
      const content = "OTHER_KEY=value";
      const result = setTamboApiKey(content, "TAMBO_API_KEY", "newkey");
      expect(result).toBe("OTHER_KEY=value\nTAMBO_API_KEY=newkey\n");
    });
  });

  describe("removeTamboApiKeys", () => {
    it("removes single Tambo key", () => {
      const content = "TAMBO_API_KEY=key\nOTHER=value";
      const result = removeTamboApiKeys(content);
      expect(result).not.toContain("TAMBO_API_KEY");
      expect(result).toContain("OTHER=value");
    });

    it("removes all Tambo key variants", () => {
      const content =
        "NEXT_PUBLIC_TAMBO_API_KEY=a\nVITE_TAMBO_API_KEY=b\nREACT_APP_TAMBO_API_KEY=c\nTAMBO_API_KEY=d";
      const result = removeTamboApiKeys(content);
      for (const keyName of TAMBO_API_KEY_NAMES) {
        expect(result).not.toContain(keyName);
      }
    });

    it("preserves other content", () => {
      const content = "# comment\nOTHER=value\nTAMBO_API_KEY=key\nMORE=stuff";
      const result = removeTamboApiKeys(content);
      expect(result).toContain("# comment");
      expect(result).toContain("OTHER=value");
      expect(result).toContain("MORE=stuff");
    });

    it("returns empty string for empty content", () => {
      const result = removeTamboApiKeys("");
      expect(result).toBe("");
    });

    it("returns original content when no Tambo keys", () => {
      const content = "OTHER=value";
      const result = removeTamboApiKeys(content);
      expect(result).toBe(content);
    });
  });

  describe("TAMBO_API_KEY_NAMES", () => {
    it("contains all expected key names", () => {
      expect(TAMBO_API_KEY_NAMES).toContain("NEXT_PUBLIC_TAMBO_API_KEY");
      expect(TAMBO_API_KEY_NAMES).toContain("VITE_TAMBO_API_KEY");
      expect(TAMBO_API_KEY_NAMES).toContain("REACT_APP_TAMBO_API_KEY");
      expect(TAMBO_API_KEY_NAMES).toContain("TAMBO_API_KEY");
    });

    it("has correct priority order", () => {
      // NEXT_PUBLIC should be first (Next.js), then Vite, then React (CRA), then generic
      expect(TAMBO_API_KEY_NAMES[0]).toBe("NEXT_PUBLIC_TAMBO_API_KEY");
      expect(TAMBO_API_KEY_NAMES[1]).toBe("VITE_TAMBO_API_KEY");
      expect(TAMBO_API_KEY_NAMES[2]).toBe("REACT_APP_TAMBO_API_KEY");
      expect(TAMBO_API_KEY_NAMES[3]).toBe("TAMBO_API_KEY");
    });
  });
});
