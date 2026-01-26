import { registerAgentTools } from "./agent-tools";
import type { ToolContext } from "./types";

function createTestCtx() {
  const mutate = jest.fn(async () => ({ ok: true }));

  const ctx = {
    trpcClient: {
      project: {
        updateProjectAgentSettings: {
          mutate,
        },
      },
    },
    utils: {
      project: {
        getProjectLlmSettings: {
          invalidate: jest.fn(async () => undefined),
        },
        getProjectById: {
          invalidate: jest.fn(async () => undefined),
        },
        getUserProjects: {
          invalidate: jest.fn(async () => undefined),
        },
      },
    },
  } as unknown as ToolContext;

  return { ctx, mutate };
}

function getUpdateProjectAgentSettingsTool(ctx: ToolContext) {
  type RegisteredToolDefinition = {
    tool: (input: any) => Promise<unknown>;
  };

  let toolDef: RegisteredToolDefinition | undefined;
  registerAgentTools((def: any) => {
    toolDef = def as RegisteredToolDefinition;
  }, ctx);

  if (!toolDef) {
    throw new Error("Tool was not registered");
  }

  return toolDef;
}

describe("registerAgentTools", () => {
  it("normalizes and passes through valid agentHeaders", async () => {
    const { ctx, mutate } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    await tool.tool({
      projectId: "proj_1",
      providerType: "AGENT",
      agentProviderType: "CUSTOM",
      agentUrl: "https://example.com",
      agentName: "test-agent",
      agentHeaders: { Authorization: "Bearer abc", "x-api-key": "k" },
    });

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        agentHeaders: expect.objectContaining({
          Authorization: "Bearer abc",
          "x-api-key": "k",
        }),
      }),
    );
  });

  it("accepts null-prototype header objects", async () => {
    const { ctx, mutate } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    const agentHeaders = Object.create(null) as Record<string, string>;
    agentHeaders.Authorization = "Bearer abc";

    await tool.tool({
      projectId: "proj_1",
      providerType: "AGENT",
      agentProviderType: "CUSTOM",
      agentUrl: "https://example.com",
      agentName: "test-agent",
      agentHeaders,
    });

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("rejects symbol header keys", async () => {
    const { ctx } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    const agentHeaders: Record<string, string> & Record<symbol, string> = {
      Authorization: "Bearer abc",
    };
    agentHeaders[Symbol("meta")] = "x";

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders,
      }),
    ).rejects.toThrow("symbol keys are not allowed");
  });

  it("rejects non-plain header objects", async () => {
    const { ctx } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    const agentHeaders = Object.create({}) as Record<string, string>;
    agentHeaders.Authorization = "Bearer abc";

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders,
      }),
    ).rejects.toThrow("must be a plain object");
  });

  it("rejects prototype-pollution keys", async () => {
    const { ctx } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    const agentHeaders = Object.create(null) as Record<string, string>;
    Object.defineProperty(agentHeaders, "__proto__", {
      value: "x",
      enumerable: true,
    });

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders,
      }),
    ).rejects.toThrow("forbidden key");
  });

  it("rejects invalid header names", async () => {
    const { ctx } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders: { "bad:name": "x" },
      }),
    ).rejects.toThrow("invalid header name");

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders: { "x,bad": "x" },
      }),
    ).rejects.toThrow("invalid header name");

    for (const badName of ['x"bad', "x\\bad", "x;bad"]) {
      await expect(
        tool.tool({
          projectId: "proj_1",
          providerType: "AGENT",
          agentProviderType: "CUSTOM",
          agentUrl: "https://example.com",
          agentName: "test-agent",
          agentHeaders: { [badName]: "x" },
        }),
      ).rejects.toThrow("invalid header name");
    }
  });

  it("accepts safe visible ASCII header names", async () => {
    const { ctx, mutate } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    await tool.tool({
      projectId: "proj_1",
      providerType: "AGENT",
      agentProviderType: "CUSTOM",
      agentUrl: "https://example.com",
      agentName: "test-agent",
      agentHeaders: {
        "X-._|!#$%&'*+^`~09Az": "x",
      },
    });

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("accepts headers exactly at the max count", async () => {
    const { ctx, mutate } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    const agentHeaders: Record<string, string> = {};
    for (let i = 0; i < 50; i++) {
      agentHeaders[`x-h${i}`] = "x";
    }

    await tool.tool({
      projectId: "proj_1",
      providerType: "AGENT",
      agentProviderType: "CUSTOM",
      agentUrl: "https://example.com",
      agentName: "test-agent",
      agentHeaders,
    });

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("accepts headers at the max total-bytes limit", async () => {
    const { ctx, mutate } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    await tool.tool({
      projectId: "proj_1",
      providerType: "AGENT",
      agentProviderType: "CUSTOM",
      agentUrl: "https://example.com",
      agentName: "test-agent",
      agentHeaders: {
        a: "a".repeat(7_999),
        b: "b".repeat(7_999),
      },
    });

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("rejects header name and value length limits", async () => {
    const { ctx } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders: {
          ["a".repeat(201)]: "x",
        },
      }),
    ).rejects.toThrow("header name too long");

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders: {
          a: "a".repeat(8_001),
        },
      }),
    ).rejects.toThrow("header value too long");
  });

  it("rejects too many headers", async () => {
    const { ctx } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    const agentHeaders: Record<string, string> = {};
    for (let i = 0; i < 51; i++) {
      agentHeaders[`x-h${i}`] = "x";
    }

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders,
      }),
    ).rejects.toThrow("too many headers");
  });

  it("rejects total headers size limit", async () => {
    const { ctx } = createTestCtx();
    const tool = getUpdateProjectAgentSettingsTool(ctx);

    await expect(
      tool.tool({
        projectId: "proj_1",
        providerType: "AGENT",
        agentProviderType: "CUSTOM",
        agentUrl: "https://example.com",
        agentName: "test-agent",
        agentHeaders: {
          a: "a".repeat(8_000),
          b: "b".repeat(8_000),
        },
      }),
    ).rejects.toThrow("total header names + values too large");
  });
});
