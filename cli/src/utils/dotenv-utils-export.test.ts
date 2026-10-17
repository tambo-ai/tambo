import { describe, expect, it } from "@jest/globals";
import { removeTamboApiKeys, setTamboApiKey } from "./dotenv-utils.js";

const oldKeys = [
  "export TAMBO_API_KEY=old-secret",
  "  VITE_TAMBO_API_KEY = old-vite-secret",
  "OTHER=value",
  "# export TAMBO_API_KEY=keep-comment",
].join("\n");

describe("dotenv API key assignment forms", () => {
  it("removes exported and whitespace-padded assignments without deleting comments", () => {
    expect(removeTamboApiKeys(oldKeys)).toBe(
      "OTHER=value\n# export TAMBO_API_KEY=keep-comment",
    );
  });

  it("replaces all old key variants when rotating the API key", () => {
    expect(setTamboApiKey(oldKeys, "NEXT_PUBLIC_TAMBO_API_KEY", "fresh-secret")).toBe(
      "OTHER=value\n# export TAMBO_API_KEY=keep-comment\nNEXT_PUBLIC_TAMBO_API_KEY=fresh-secret\n",
    );
  });
});
