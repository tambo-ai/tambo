import {
  MCP_TOOL_PREFIX_SEPARATOR,
  prefixToolName,
  unprefixToolName,
} from "./systemTools";

describe("systemTools name helpers", () => {
  it("round-trips with serverKey", () => {
    expect(unprefixToolName(prefixToolName("svc", "search"), "svc")).toBe(
      "search",
    );
  });

  it("returns original when serverKey is falsy", () => {
    expect(prefixToolName(undefined, "t")).toBe("t");
    expect(unprefixToolName("t")).toBe("t");
  });

  it("does not strip when prefix doesn't match", () => {
    const name = `svc${MCP_TOOL_PREFIX_SEPARATOR}search`;
    expect(unprefixToolName(name, "other")).toBe(name);
  });

  it("handles separator in serverKey/toolName", () => {
    const sk = `svc${MCP_TOOL_PREFIX_SEPARATOR}x`;
    const tn = `search${MCP_TOOL_PREFIX_SEPARATOR}deep`;
    const prefixed = prefixToolName(sk, tn);
    expect(unprefixToolName(prefixed, sk)).toBe(tn);
  });
});
