import {
  ChatCompletionContentPart,
  ContentPartType,
  MessageRole,
  Resource,
  ResourceFetchResult,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import {
  extractResourcesFromMessages,
  extractServerKeyFromResource,
  isResourceContentPart,
  prefetchAndCacheResources,
  ResourceFetcherMap,
} from "./resource-transformation";

// Helper to create a minimal ThreadMessage
function createMessage(
  content: ChatCompletionContentPart[],
  id = "msg-1",
): ThreadMessage {
  return {
    id,
    threadId: "thread-1",
    role: MessageRole.User,
    content,
    createdAt: new Date(),
  };
}

// Helper to create a resource content part
function createResourcePart(resource: Resource): ChatCompletionContentPart {
  return {
    type: ContentPartType.Resource,
    resource,
  };
}

// Helper to create a text content part
function createTextPart(text: string): ChatCompletionContentPart {
  return {
    type: ContentPartType.Text,
    text,
  };
}

// Helper to create a mock fetcher
function createMockFetcher(
  result: ResourceFetchResult,
): jest.Mock<Promise<ResourceFetchResult>, [string]> {
  return jest.fn().mockResolvedValue(result);
}

// Helper to create a failing fetcher
function createFailingFetcher(
  error: Error,
): jest.Mock<Promise<ResourceFetchResult>, [string]> {
  return jest.fn().mockRejectedValue(error);
}

describe("resource-transformation", () => {
  describe("isResourceContentPart", () => {
    it("should return true for resource content parts", () => {
      const part = createResourcePart({ uri: "github:file.txt" });
      expect(isResourceContentPart(part)).toBe(true);
    });

    it("should return false for text content parts", () => {
      const part = createTextPart("Hello");
      expect(isResourceContentPart(part)).toBe(false);
    });

    it("should return false for image content parts", () => {
      const part: ChatCompletionContentPart = {
        type: "image_url",
        image_url: { url: "https://example.com/image.png" },
      };
      expect(isResourceContentPart(part)).toBe(false);
    });
  });

  describe("extractServerKeyFromResource", () => {
    it("should extract serverKey from URI with colon", () => {
      const resource: Resource = { uri: "github:repos/owner/repo/file.txt" };
      expect(extractServerKeyFromResource(resource)).toBe("github");
    });

    it("should extract serverKey from simple URI", () => {
      const resource: Resource = { uri: "linear:issue-123" };
      expect(extractServerKeyFromResource(resource)).toBe("linear");
    });

    it("should throw for URI without colon", () => {
      const resource: Resource = { uri: "no-colon-here" };
      expect(() => extractServerKeyFromResource(resource)).toThrow(
        "No server key found in resource: no-colon-here",
      );
    });

    it("should throw for empty URI", () => {
      const resource: Resource = { uri: "" };
      expect(() => extractServerKeyFromResource(resource)).toThrow(
        "No server key found in resource: ",
      );
    });

    it("should throw for undefined URI", () => {
      const resource: Resource = {};
      expect(() => extractServerKeyFromResource(resource)).toThrow(
        "No server key found in resource: undefined",
      );
    });
  });

  describe("extractResourcesFromMessages", () => {
    it("should extract resource parts from messages", () => {
      const messages: ThreadMessage[] = [
        createMessage([
          createTextPart("Hello"),
          createResourcePart({ uri: "github:file.txt" }),
        ]),
        createMessage([createResourcePart({ uri: "linear:issue-1" })]),
      ];

      const resources = extractResourcesFromMessages(messages);
      expect(resources).toHaveLength(2);
      expect(resources[0].resource.uri).toBe("github:file.txt");
      expect(resources[1].resource.uri).toBe("linear:issue-1");
    });

    it("should return empty array for messages without resources", () => {
      const messages: ThreadMessage[] = [
        createMessage([createTextPart("Hello")]),
      ];

      const resources = extractResourcesFromMessages(messages);
      expect(resources).toHaveLength(0);
    });

    it("should return empty array for empty messages", () => {
      const resources = extractResourcesFromMessages([]);
      expect(resources).toHaveLength(0);
    });
  });

  describe("prefetchAndCacheResources", () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe("resource already has content", () => {
      it("should not fetch resources that already have text content", async () => {
        const fetcher = createMockFetcher({
          contents: [{ uri: "github:file.txt", text: "new content" }],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              uri: "github:file.txt",
              text: "existing content",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).not.toHaveBeenCalled();
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: { uri: "github:file.txt", text: "existing content" },
        });
      });

      it("should not fetch resources that already have blob content", async () => {
        const fetcher = createMockFetcher({
          contents: [{ uri: "github:file.png", blob: "newbase64" }],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              uri: "github:file.png",
              blob: "existingbase64",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).not.toHaveBeenCalled();
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: { uri: "github:file.png", blob: "existingbase64" },
        });
      });

      it("should not fetch resources that have both text and blob", async () => {
        const fetcher = createMockFetcher({
          contents: [{ uri: "github:file.txt", text: "new" }],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              uri: "github:file.txt",
              text: "existing text",
              blob: "existingblob",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).not.toHaveBeenCalled();
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: {
            uri: "github:file.txt",
            text: "existing text",
            blob: "existingblob",
          },
        });
      });
    });

    describe("resource needs fetching", () => {
      it("should fetch resource with URI and no content", async () => {
        const fetcher = createMockFetcher({
          contents: [
            {
              uri: "github:file.txt",
              text: "fetched content",
              mimeType: "text/plain",
            },
          ],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              uri: "github:file.txt",
              name: "file.txt",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).toHaveBeenCalledWith("github:file.txt");
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: {
            uri: "github:file.txt",
            name: "file.txt",
            text: "fetched content",
            mimeType: "text/plain",
          },
        });
      });

      it("should merge fetched content with existing resource fields", async () => {
        const fetcher = createMockFetcher({
          contents: [{ uri: "github:file.txt", text: "content" }],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              uri: "github:file.txt",
              name: "My File",
              description: "Important file",
              mimeType: "text/plain",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: {
            uri: "github:file.txt",
            name: "My File",
            description: "Important file",
            mimeType: "text/plain",
            text: "content",
          },
        });
      });

      it("should handle fetch returning multiple contents", async () => {
        const fetcher = createMockFetcher({
          contents: [
            { uri: "github:dir/file1.txt", text: "file1 content" },
            { uri: "github:dir/file2.txt", text: "file2 content" },
          ],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              uri: "github:dir/",
              name: "directory",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        // When fetch returns multiple contents, each becomes a separate resource part
        expect(result[0].content).toHaveLength(2);
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: {
            // Original resource fields preserved, then overridden by fetched content
            uri: "github:dir/file1.txt",
            name: "directory",
            text: "file1 content",
          },
        });
        expect(result[0].content[1]).toEqual({
          type: ContentPartType.Resource,
          resource: {
            uri: "github:dir/file2.txt",
            name: "directory",
            text: "file2 content",
          },
        });
      });

      it("should handle fetch returning blob content", async () => {
        const fetcher = createMockFetcher({
          contents: [
            {
              uri: "github:image.png",
              blob: "base64encodeddata",
              mimeType: "image/png",
            },
          ],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              uri: "github:image.png",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: {
            uri: "github:image.png",
            blob: "base64encodeddata",
            mimeType: "image/png",
          },
        });
      });
    });

    describe("no URI", () => {
      it("should return resource as-is if no URI but has text", async () => {
        const fetcher = createMockFetcher({ contents: [] });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              text: "inline content",
              name: "inline.txt",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).not.toHaveBeenCalled();
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: { text: "inline content", name: "inline.txt" },
        });
      });

      it("should return resource as-is if no URI but has blob", async () => {
        const fetcher = createMockFetcher({ contents: [] });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              blob: "base64data",
              mimeType: "image/png",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).not.toHaveBeenCalled();
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: { blob: "base64data", mimeType: "image/png" },
        });
      });

      it("should warn but return resource if no URI and no content", async () => {
        const fetcher = createMockFetcher({ contents: [] });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              name: "empty resource",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(consoleSpy).toHaveBeenCalledWith("Resource has no URI");
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: { name: "empty resource" },
        });
      });
    });

    describe("no fetcher for serverKey", () => {
      it("should warn and return empty when no fetcher available", async () => {
        const fetchers: ResourceFetcherMap = {};

        const messages = [
          createMessage([
            createResourcePart({
              uri: "unknown:file.txt",
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(consoleSpy).toHaveBeenCalledWith(
          "No fetcher available for resource with serverKey: unknown",
        );
        // Resource should return empty since no content and fetch failed
        expect(result[0].content).toHaveLength(0);
      });

      it("should fetch resources with fetchers and skip those without", async () => {
        const githubFetcher = createMockFetcher({
          contents: [{ uri: "github:file.txt", text: "github content" }],
        });
        const fetchers: ResourceFetcherMap = { github: githubFetcher };

        const messages = [
          createMessage([
            createResourcePart({ uri: "github:file.txt" }),
            createResourcePart({ uri: "unknown:file.txt" }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(githubFetcher).toHaveBeenCalledWith("github:file.txt");
        expect(result[0].content).toHaveLength(1);
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: { uri: "github:file.txt", text: "github content" },
        });
      });
    });

    describe("fetch errors", () => {
      it("should handle fetch error gracefully and continue with other fetches", async () => {
        const failingFetcher = createFailingFetcher(new Error("Network error"));
        const successFetcher = createMockFetcher({
          contents: [{ uri: "linear:issue-1", text: "issue content" }],
        });
        const fetchers: ResourceFetcherMap = {
          github: failingFetcher,
          linear: successFetcher,
        };

        const messages = [
          createMessage([
            createResourcePart({ uri: "github:file.txt" }),
            createResourcePart({ uri: "linear:issue-1" }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(failingFetcher).toHaveBeenCalled();
        expect(successFetcher).toHaveBeenCalled();
        // Failed fetch returns empty, successful fetch returns content
        expect(result[0].content).toHaveLength(1);
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: { uri: "linear:issue-1", text: "issue content" },
        });
      });

      it("should log error when fetch fails", async () => {
        const errorSpy = jest.spyOn(console, "error");
        const failingFetcher = createFailingFetcher(
          new Error("Connection refused"),
        );
        const fetchers: ResourceFetcherMap = { github: failingFetcher };

        const messages = [
          createMessage([createResourcePart({ uri: "github:file.txt" })]),
        ];

        await prefetchAndCacheResources(messages, fetchers);

        expect(errorSpy).toHaveBeenCalledWith(
          "Error fetching resource github:file.txt:",
          expect.any(Error),
        );
      });
    });

    describe("empty fetch results", () => {
      it("should return empty array when fetch returns empty contents", async () => {
        const fetcher = createMockFetcher({ contents: [] });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([createResourcePart({ uri: "github:empty" })]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).toHaveBeenCalled();
        // Empty contents means nothing to return
        expect(result[0].content).toHaveLength(0);
      });
    });

    describe("deduplication", () => {
      it("should fetch same URI only once when it appears multiple times", async () => {
        const fetcher = createMockFetcher({
          contents: [{ uri: "github:file.txt", text: "content" }],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({ uri: "github:file.txt" }),
            createResourcePart({ uri: "github:file.txt" }),
          ]),
          createMessage([createResourcePart({ uri: "github:file.txt" })]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        // Fetcher should only be called once despite URI appearing 3 times
        expect(fetcher).toHaveBeenCalledTimes(1);
        // All instances should get the cached content
        expect(result[0].content).toHaveLength(2);
        expect(result[1].content).toHaveLength(1);
      });

      it("should fetch different URIs separately", async () => {
        const fetcher = jest
          .fn<Promise<ResourceFetchResult>, [string]>()
          .mockImplementation(async (uri) => ({
            contents: [{ uri, text: `content for ${uri}` }],
          }));
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({ uri: "github:file1.txt" }),
            createResourcePart({ uri: "github:file2.txt" }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(fetcher).toHaveBeenCalledWith("github:file1.txt");
        expect(fetcher).toHaveBeenCalledWith("github:file2.txt");
        expect(result[0].content).toHaveLength(2);
      });
    });

    describe("multiple serverKeys", () => {
      it("should use correct fetcher for each serverKey", async () => {
        const githubFetcher = createMockFetcher({
          contents: [{ uri: "github:file.txt", text: "github content" }],
        });
        const linearFetcher = createMockFetcher({
          contents: [{ uri: "linear:issue-1", text: "linear content" }],
        });
        const fetchers: ResourceFetcherMap = {
          github: githubFetcher,
          linear: linearFetcher,
        };

        const messages = [
          createMessage([
            createResourcePart({ uri: "github:file.txt" }),
            createResourcePart({ uri: "linear:issue-1" }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(githubFetcher).toHaveBeenCalledWith("github:file.txt");
        expect(linearFetcher).toHaveBeenCalledWith("linear:issue-1");
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: { uri: "github:file.txt", text: "github content" },
        });
        expect(result[0].content[1]).toEqual({
          type: ContentPartType.Resource,
          resource: { uri: "linear:issue-1", text: "linear content" },
        });
      });
    });

    describe("mixed content parts", () => {
      it("should preserve non-resource content parts", async () => {
        const fetcher = createMockFetcher({
          contents: [{ uri: "github:file.txt", text: "content" }],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createTextPart("Hello"),
            createResourcePart({ uri: "github:file.txt" }),
            createTextPart("World"),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(result[0].content).toHaveLength(3);
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Text,
          text: "Hello",
        });
        expect(result[0].content[1]).toEqual({
          type: ContentPartType.Resource,
          resource: { uri: "github:file.txt", text: "content" },
        });
        expect(result[0].content[2]).toEqual({
          type: ContentPartType.Text,
          text: "World",
        });
      });

      it("should handle messages with only non-resource content", async () => {
        const fetcher = createMockFetcher({ contents: [] });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([createTextPart("Hello"), createTextPart("World")]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).not.toHaveBeenCalled();
        expect(result[0].content).toHaveLength(2);
      });
    });

    describe("edge cases", () => {
      it("should handle empty messages array", async () => {
        const fetcher = createMockFetcher({ contents: [] });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const result = await prefetchAndCacheResources([], fetchers);

        expect(fetcher).not.toHaveBeenCalled();
        expect(result).toHaveLength(0);
      });

      it("should handle message with empty content array", async () => {
        const fetcher = createMockFetcher({ contents: [] });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [createMessage([])];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(fetcher).not.toHaveBeenCalled();
        expect(result[0].content).toHaveLength(0);
      });

      it("should handle empty fetchers map", async () => {
        const fetchers: ResourceFetcherMap = {};

        const messages = [
          createMessage([createResourcePart({ uri: "github:file.txt" })]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        expect(consoleSpy).toHaveBeenCalled();
        expect(result[0].content).toHaveLength(0);
      });

      it("should preserve message properties other than content", async () => {
        const fetcher = createMockFetcher({
          contents: [{ uri: "github:file.txt", text: "content" }],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const originalMessage: ThreadMessage = {
          id: "custom-id",
          threadId: "custom-thread",
          role: MessageRole.Assistant,
          content: [createResourcePart({ uri: "github:file.txt" })],
          createdAt: new Date("2024-01-01"),
        };

        const result = await prefetchAndCacheResources(
          [originalMessage],
          fetchers,
        );

        expect(result[0].id).toBe("custom-id");
        expect(result[0].threadId).toBe("custom-thread");
        expect(result[0].role).toBe(MessageRole.Assistant);
        expect(result[0].createdAt).toEqual(new Date("2024-01-01"));
      });

      it("should handle resource with all fields populated", async () => {
        const fetcher = createMockFetcher({
          contents: [
            {
              uri: "github:file.txt",
              text: "fetched text",
              mimeType: "text/markdown",
            },
          ],
        });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({
              uri: "github:file.txt",
              name: "My File",
              description: "A description",
              mimeType: "text/plain",
              annotations: { priority: 1 },
            }),
          ]),
        ];

        const result = await prefetchAndCacheResources(messages, fetchers);

        // Fetched content should override mimeType but preserve other fields
        expect(result[0].content[0]).toEqual({
          type: ContentPartType.Resource,
          resource: {
            uri: "github:file.txt",
            name: "My File",
            description: "A description",
            mimeType: "text/markdown",
            text: "fetched text",
            annotations: { priority: 1 },
          },
        });
      });
    });

    describe("parallel fetching", () => {
      it("should fetch all resources in parallel", async () => {
        const fetchOrder: string[] = [];
        const fetcher = jest
          .fn<Promise<ResourceFetchResult>, [string]>()
          .mockImplementation(async (uri) => {
            fetchOrder.push(`start:${uri}`);
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 10));
            fetchOrder.push(`end:${uri}`);
            return { contents: [{ uri, text: `content for ${uri}` }] };
          });
        const fetchers: ResourceFetcherMap = { github: fetcher };

        const messages = [
          createMessage([
            createResourcePart({ uri: "github:file1.txt" }),
            createResourcePart({ uri: "github:file2.txt" }),
            createResourcePart({ uri: "github:file3.txt" }),
          ]),
        ];

        await prefetchAndCacheResources(messages, fetchers);

        // All fetches should start before any ends (parallel execution)
        expect(fetchOrder.slice(0, 3)).toEqual([
          "start:github:file1.txt",
          "start:github:file2.txt",
          "start:github:file3.txt",
        ]);
      });
    });
  });
});
