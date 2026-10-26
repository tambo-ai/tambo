import type { TamboTool } from "../model/component-metadata";
import { executeClientTool } from "./tool-executor";

function createTool(
  transformToContent: NonNullable<TamboTool["transformToContent"]>,
): TamboTool {
  return {
    name: "test-tool",
    description: "Test tool",
    tool: async () => undefined,
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    transformToContent,
  };
}

describe("executeClientTool", () => {
  it("preserves empty text content", async () => {
    const result = await executeClientTool(
      createTool(() => [{ type: "text", text: "" }]),
      "call_1",
      {},
    );

    expect(result.content).toEqual([{ type: "text", text: "" }]);
  });

  it.each([
    [
      "URI resource",
      {
        uri: "file:///report.txt",
        text: "report contents",
        mimeType: "text/plain",
      },
    ],
    [
      "inline resource",
      {
        uri: "file:///report.txt",
        text: "report contents",
      },
    ],
    [
      "blob resource",
      {
        uri: "file:///report.bin",
        blob: "YWJj",
        mimeType: "application/octet-stream",
      },
    ],
  ])("preserves %s content", async (_name, resource) => {
    const resourceBlock = { type: "resource" as const, resource };
    const result = await executeClientTool(
      createTool(() => [resourceBlock]),
      "call_1",
      {},
    );

    expect(result.content).toEqual([resourceBlock]);
  });

  it("preserves mixed text and resource blocks", async () => {
    const content = [
      { type: "text" as const, text: "Report follows" },
      {
        type: "resource" as const,
        resource: {
          uri: "file:///report.txt",
          text: "report contents",
          mimeType: "text/plain",
        },
      },
    ];
    const result = await executeClientTool(
      createTool(() => content),
      "call_1",
      {},
    );

    expect(result.content).toEqual(content);
  });

  it("keeps stringifying beta-only content types", async () => {
    const imageContent = {
      type: "image_url" as const,
      image_url: { url: "https://example.com/image.png" },
    };
    const result = await executeClientTool(
      createTool(() => [imageContent]),
      "call_1",
      {},
    );

    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(imageContent) },
    ]);
  });
});
