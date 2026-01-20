import { describe, expect, it } from "@jest/globals";
import {
  findAllTamboApiKeys,
  findTamboApiKey,
  parseDotenvContent,
  removeTamboApiKeys,
  setTamboApiKey,
} from "./dotenv-utils.js";

describe("parseDotenvContent", () => {
  it("parses simple key-value pairs", () => {
    const content = "FOO=bar\nBAZ=qux";
    const result = parseDotenvContent(content);
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("handles quoted values", () => {
    const content = "FOO=\"bar baz\"\nQUX='single quotes'";
    const result = parseDotenvContent(content);
    expect(result).toEqual({ FOO: "bar baz", QUX: "single quotes" });
  });

  it("handles empty values", () => {
    const content = "FOO=\nBAR=value";
    const result = parseDotenvContent(content);
    expect(result).toEqual({ FOO: "", BAR: "value" });
  });

  it("ignores comments", () => {
    const content = "# This is a comment\nFOO=bar";
    const result = parseDotenvContent(content);
    expect(result).toEqual({ FOO: "bar" });
  });

  it("ignores empty lines", () => {
    const content = "FOO=bar\n\nBAZ=qux";
    const result = parseDotenvContent(content);
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });
});

describe("findTamboApiKey", () => {
  it("finds NEXT_PUBLIC_TAMBO_API_KEY", () => {
    const content = "OTHER=value\nNEXT_PUBLIC_TAMBO_API_KEY=my-key\n";
    const result = findTamboApiKey(content);
    expect(result).toEqual({
      keyName: "NEXT_PUBLIC_TAMBO_API_KEY",
      value: "my-key",
    });
  });

  it("finds VITE_TAMBO_API_KEY", () => {
    const content = "VITE_TAMBO_API_KEY=vite-key";
    const result = findTamboApiKey(content);
    expect(result).toEqual({
      keyName: "VITE_TAMBO_API_KEY",
      value: "vite-key",
    });
  });

  it("finds REACT_APP_TAMBO_API_KEY", () => {
    const content = "REACT_APP_TAMBO_API_KEY=cra-key";
    const result = findTamboApiKey(content);
    expect(result).toEqual({
      keyName: "REACT_APP_TAMBO_API_KEY",
      value: "cra-key",
    });
  });

  it("finds TAMBO_API_KEY (no prefix)", () => {
    const content = "TAMBO_API_KEY=plain-key";
    const result = findTamboApiKey(content);
    expect(result).toEqual({
      keyName: "TAMBO_API_KEY",
      value: "plain-key",
    });
  });

  it("returns first match in priority order", () => {
    const content =
      "TAMBO_API_KEY=plain\nNEXT_PUBLIC_TAMBO_API_KEY=next\nVITE_TAMBO_API_KEY=vite";
    const result = findTamboApiKey(content);
    // NEXT_PUBLIC comes first in priority order
    expect(result).toEqual({
      keyName: "NEXT_PUBLIC_TAMBO_API_KEY",
      value: "next",
    });
  });

  it("returns null when no key is found", () => {
    const content = "OTHER_KEY=value\nANOTHER=thing";
    const result = findTamboApiKey(content);
    expect(result).toBeNull();
  });

  it("returns null for empty content", () => {
    const result = findTamboApiKey("");
    expect(result).toBeNull();
  });
});

describe("findAllTamboApiKeys", () => {
  it("finds all key variants", () => {
    const content =
      "NEXT_PUBLIC_TAMBO_API_KEY=a\nVITE_TAMBO_API_KEY=b\nTAMBO_API_KEY=c";
    const result = findAllTamboApiKeys(content);
    expect(result).toEqual([
      "NEXT_PUBLIC_TAMBO_API_KEY",
      "VITE_TAMBO_API_KEY",
      "TAMBO_API_KEY",
    ]);
  });

  it("returns empty array when no keys found", () => {
    const content = "OTHER=value";
    const result = findAllTamboApiKeys(content);
    expect(result).toEqual([]);
  });

  it("finds single key", () => {
    const content = "VITE_TAMBO_API_KEY=only-one";
    const result = findAllTamboApiKeys(content);
    expect(result).toEqual(["VITE_TAMBO_API_KEY"]);
  });
});

describe("setTamboApiKey", () => {
  it("appends key to empty content", () => {
    const result = setTamboApiKey("", "NEXT_PUBLIC_TAMBO_API_KEY", "new-key");
    expect(result).toBe("NEXT_PUBLIC_TAMBO_API_KEY=new-key\n");
  });

  it("appends key to content without existing Tambo key", () => {
    const content = "OTHER=value\n";
    const result = setTamboApiKey(
      content,
      "NEXT_PUBLIC_TAMBO_API_KEY",
      "new-key",
    );
    expect(result).toBe("OTHER=value\nNEXT_PUBLIC_TAMBO_API_KEY=new-key\n");
  });

  it("replaces existing key with same name", () => {
    const content = "OTHER=value\nNEXT_PUBLIC_TAMBO_API_KEY=old-key\n";
    const result = setTamboApiKey(
      content,
      "NEXT_PUBLIC_TAMBO_API_KEY",
      "new-key",
    );
    expect(result).toBe("OTHER=value\nNEXT_PUBLIC_TAMBO_API_KEY=new-key\n");
  });

  it("replaces existing key with different variant", () => {
    const content = "OTHER=value\nVITE_TAMBO_API_KEY=old-key\n";
    const result = setTamboApiKey(
      content,
      "NEXT_PUBLIC_TAMBO_API_KEY",
      "new-key",
    );
    expect(result).toBe("OTHER=value\nNEXT_PUBLIC_TAMBO_API_KEY=new-key\n");
  });

  it("removes all existing variants and adds new one", () => {
    const content =
      "NEXT_PUBLIC_TAMBO_API_KEY=a\nOTHER=value\nVITE_TAMBO_API_KEY=b\nTAMBO_API_KEY=c\n";
    const result = setTamboApiKey(content, "VITE_TAMBO_API_KEY", "new-key");
    expect(result).toBe("OTHER=value\nVITE_TAMBO_API_KEY=new-key\n");
  });

  it("preserves comments", () => {
    const content = "# Environment vars\nOTHER=value\n# API key below\n";
    const result = setTamboApiKey(
      content,
      "NEXT_PUBLIC_TAMBO_API_KEY",
      "new-key",
    );
    expect(result).toBe(
      "# Environment vars\nOTHER=value\n# API key below\nNEXT_PUBLIC_TAMBO_API_KEY=new-key\n",
    );
  });

  it("preserves empty lines", () => {
    const content = "FOO=bar\n\nBAZ=qux\n";
    const result = setTamboApiKey(
      content,
      "NEXT_PUBLIC_TAMBO_API_KEY",
      "new-key",
    );
    expect(result).toBe(
      "FOO=bar\n\nBAZ=qux\nNEXT_PUBLIC_TAMBO_API_KEY=new-key\n",
    );
  });

  it("handles content without trailing newline", () => {
    const content = "OTHER=value";
    const result = setTamboApiKey(
      content,
      "NEXT_PUBLIC_TAMBO_API_KEY",
      "new-key",
    );
    expect(result).toBe("OTHER=value\nNEXT_PUBLIC_TAMBO_API_KEY=new-key\n");
  });
});

describe("removeTamboApiKeys", () => {
  it("removes single key", () => {
    const content = "OTHER=value\nNEXT_PUBLIC_TAMBO_API_KEY=key\nFOO=bar";
    const result = removeTamboApiKeys(content);
    expect(result).toBe("OTHER=value\nFOO=bar");
  });

  it("removes all key variants", () => {
    const content =
      "NEXT_PUBLIC_TAMBO_API_KEY=a\nOTHER=value\nVITE_TAMBO_API_KEY=b";
    const result = removeTamboApiKeys(content);
    expect(result).toBe("OTHER=value");
  });

  it("returns unchanged content when no keys present", () => {
    const content = "FOO=bar\nBAZ=qux";
    const result = removeTamboApiKeys(content);
    expect(result).toBe("FOO=bar\nBAZ=qux");
  });

  it("preserves comments and empty lines", () => {
    const content = "# Comment\nNEXT_PUBLIC_TAMBO_API_KEY=key\n\nFOO=bar";
    const result = removeTamboApiKeys(content);
    expect(result).toBe("# Comment\n\nFOO=bar");
  });
});
