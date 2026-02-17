/**
 * Tests for tool registry
 */

import { z } from "zod";
import { createToolRegistry } from "./tools";

describe("createToolRegistry", () => {
  it("registers and executes a tool with valid args", async () => {
    const registry = createToolRegistry();

    registry.register({
      name: "add",
      description: "Add two numbers",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      execute: async ({ a, b }) => ({ sum: a + b }),
    });

    const result = await registry.execute(
      "add",
      "call_1",
      JSON.stringify({ a: 2, b: 3 }),
    );

    expect(result.toolUseId).toBe("call_1");
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({ sum: 5 });
  });

  it("throws on duplicate registration", () => {
    const registry = createToolRegistry();

    registry.register({
      name: "test",
      description: "Test",
      inputSchema: z.object({}),
      execute: async () => ({}),
    });

    expect(() =>
      registry.register({
        name: "test",
        description: "Test 2",
        inputSchema: z.object({}),
        execute: async () => ({}),
      }),
    ).toThrow('Tool "test" is already registered');
  });

  it("returns error result for unknown tool", async () => {
    const registry = createToolRegistry();

    const result = await registry.execute("nonexistent", "call_1", "{}");

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Unknown tool: nonexistent");
  });

  it("returns error result for invalid args", async () => {
    const registry = createToolRegistry();

    registry.register({
      name: "greet",
      description: "Greet someone",
      inputSchema: z.object({ name: z.string() }),
      execute: async ({ name }) => ({ greeting: `Hello ${name}` }),
    });

    const result = await registry.execute(
      "greet",
      "call_1",
      JSON.stringify({ name: 123 }),
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Expected string");
  });

  it("catches execution errors and returns as error result", async () => {
    const registry = createToolRegistry();

    registry.register({
      name: "fail",
      description: "Always fails",
      inputSchema: z.object({}),
      execute: async () => {
        throw new Error("Boom!");
      },
    });

    const result = await registry.execute("fail", "call_1", "{}");

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Boom!");
  });

  it("returns error on malformed JSON args", async () => {
    const registry = createToolRegistry();

    registry.register({
      name: "test",
      description: "Test",
      inputSchema: z.object({}),
      execute: async () => ({}),
    });

    const result = await registry.execute("test", "call_1", "not-json");

    expect(result.isError).toBe(true);
  });

  it("has() returns correct values", () => {
    const registry = createToolRegistry();

    expect(registry.has("test")).toBe(false);

    registry.register({
      name: "test",
      description: "Test",
      inputSchema: z.object({}),
      execute: async () => ({}),
    });

    expect(registry.has("test")).toBe(true);
  });

  it("toApiFormat returns correct shape", () => {
    const registry = createToolRegistry();

    registry.register({
      name: "search",
      description: "Search for things",
      inputSchema: z.object({ query: z.string() }),
      execute: async () => ({ results: [] }),
    });

    const apiFormat = registry.toApiFormat();

    expect(apiFormat).toHaveLength(1);
    expect(apiFormat[0].name).toBe("search");
    expect(apiFormat[0].description).toBe("Search for things");
    expect(apiFormat[0].inputSchema).toBeDefined();
    // JSON Schema should have the query property
    expect((apiFormat[0].inputSchema as Record<string, unknown>).type).toBe(
      "object",
    );
  });

  it("clear removes all tools", () => {
    const registry = createToolRegistry();

    registry.register({
      name: "test",
      description: "Test",
      inputSchema: z.object({}),
      execute: async () => ({}),
    });

    expect(registry.has("test")).toBe(true);
    registry.clear();
    expect(registry.has("test")).toBe(false);
  });
});
