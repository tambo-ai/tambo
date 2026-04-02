import { memoryExtractionResponseSchema } from "./memory-extraction-schema";

describe("memoryExtractionResponseSchema", () => {
  it("parses valid extraction response", () => {
    const result = memoryExtractionResponseSchema.safeParse({
      memories: [
        {
          content: "The user prefers dark mode",
          category: "preference",
          importance: 4,
        },
        {
          content: "The user works at Acme Corp",
          category: "fact",
          importance: 3,
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.memories).toHaveLength(2);
      expect(result.data.memories[0].content).toBe(
        "The user prefers dark mode",
      );
    }
  });

  it("parses empty memories array", () => {
    const result = memoryExtractionResponseSchema.safeParse({
      memories: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.memories).toHaveLength(0);
    }
  });

  it("defaults importance to 3 when not provided", () => {
    const result = memoryExtractionResponseSchema.safeParse({
      memories: [{ content: "A fact", category: "fact" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.memories[0].importance).toBe(3);
    }
  });

  it("rejects invalid category", () => {
    const result = memoryExtractionResponseSchema.safeParse({
      memories: [{ content: "test", category: "instruction", importance: 3 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects content exceeding 1000 chars", () => {
    const result = memoryExtractionResponseSchema.safeParse({
      memories: [
        { content: "x".repeat(1001), category: "fact", importance: 3 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects importance outside 1-5 range", () => {
    const tooLow = memoryExtractionResponseSchema.safeParse({
      memories: [{ content: "test", category: "fact", importance: 0 }],
    });
    expect(tooLow.success).toBe(false);

    const tooHigh = memoryExtractionResponseSchema.safeParse({
      memories: [{ content: "test", category: "fact", importance: 6 }],
    });
    expect(tooHigh.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = memoryExtractionResponseSchema.safeParse({
      memories: [{ content: "", category: "fact", importance: 3 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer importance", () => {
    const result = memoryExtractionResponseSchema.safeParse({
      memories: [{ content: "test", category: "fact", importance: 3.5 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing memories field", () => {
    const result = memoryExtractionResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-object input", () => {
    const result = memoryExtractionResponseSchema.safeParse("not an object");
    expect(result.success).toBe(false);
  });
});
