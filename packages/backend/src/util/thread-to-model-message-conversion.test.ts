import {
  ContentPartType,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { threadMessagesToModelMessages } from "./thread-to-model-message-conversion";

function createUserMessage(content: ThreadMessage["content"]): ThreadMessage {
  return {
    id: "msg-1",
    threadId: "thread-1",
    role: MessageRole.User,
    content,
    createdAt: new Date(),
  };
}

describe("threadMessagesToModelMessages", () => {
  describe("Resource content part with URI", () => {
    const supportedMimeTypes = new Set([
      "text/plain",
      "text/markdown",
      "application/pdf",
    ]);
    const isSupportedMimeType = (mimeType: string) =>
      supportedMimeTypes.has(mimeType);

    it("should convert image resource to image part", () => {
      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "https://storage.example.com/image.png?token=xyz",
            name: "image.png",
            mimeType: "image/png",
          },
        },
      ]);

      const result = threadMessagesToModelMessages(
        [message],
        isSupportedMimeType,
      );

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe("user");

      const content = result[0].content as Array<{
        type: string;
        image?: string;
        text?: string;
      }>;
      // Find the image part (skip the <User> wrappers)
      const imagePart = content.find((p) => p.type === "image");
      expect(imagePart).toBeDefined();
      expect(imagePart?.image).toBe(
        "https://storage.example.com/image.png?token=xyz",
      );
    });

    it("should convert supported file type to file part with URL", () => {
      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "https://storage.example.com/doc.pdf?token=xyz",
            name: "document.pdf",
            mimeType: "application/pdf",
          },
        },
      ]);

      const result = threadMessagesToModelMessages(
        [message],
        isSupportedMimeType,
      );

      expect(result).toHaveLength(1);
      const content = result[0].content as Array<{
        type: string;
        data?: URL;
        mediaType?: string;
        filename?: string;
      }>;

      const filePart = content.find((p) => p.type === "file");
      expect(filePart).toBeDefined();
      expect(filePart?.data).toBeInstanceOf(URL);
      expect(filePart?.data?.href).toBe(
        "https://storage.example.com/doc.pdf?token=xyz",
      );
      expect(filePart?.mediaType).toBe("application/pdf");
      expect(filePart?.filename).toBe("document.pdf");
    });

    it("should convert text/markdown to file part when supported", () => {
      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "https://storage.example.com/readme.md?token=xyz",
            name: "README.md",
            mimeType: "text/markdown",
          },
        },
      ]);

      const result = threadMessagesToModelMessages(
        [message],
        isSupportedMimeType,
      );

      const content = result[0].content as Array<{
        type: string;
        data?: URL;
        mediaType?: string;
      }>;

      const filePart = content.find((p) => p.type === "file");
      expect(filePart).toBeDefined();
      expect(filePart?.mediaType).toBe("text/markdown");
    });

    it("should return text placeholder for unsupported file type", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "https://storage.example.com/archive.zip?token=xyz",
            name: "archive.zip",
            mimeType: "application/zip",
          },
        },
      ]);

      const result = threadMessagesToModelMessages(
        [message],
        isSupportedMimeType,
      );

      const content = result[0].content as Array<{
        type: string;
        text?: string;
      }>;

      // Should NOT have a file part
      const filePart = content.find((p) => p.type === "file");
      expect(filePart).toBeUndefined();

      // Should have a text placeholder
      const textParts = content.filter((p) => p.type === "text");
      const unsupportedText = textParts.find((p) =>
        p.text?.includes("Unsupported file type"),
      );
      expect(unsupportedText).toBeDefined();
      expect(unsupportedText?.text).toContain("archive.zip");
      expect(unsupportedText?.text).toContain("application/zip");

      // Should have logged warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Model does not support file type: application/zip",
        ),
      );

      consoleSpy.mockRestore();
    });

    it("should use filename from resource name", () => {
      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "https://storage.example.com/12345-doc.pdf",
            name: "my-document.pdf",
            mimeType: "application/pdf",
          },
        },
      ]);

      const result = threadMessagesToModelMessages(
        [message],
        isSupportedMimeType,
      );

      const content = result[0].content as Array<{
        type: string;
        filename?: string;
      }>;

      const filePart = content.find((p) => p.type === "file");
      expect(filePart?.filename).toBe("my-document.pdf");
    });

    it("should convert image blob to image part with data URL", () => {
      const base64Data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk";
      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "storage:project/image.png",
            name: "image.png",
            mimeType: "image/png",
            blob: base64Data,
          },
        },
      ]);

      const result = threadMessagesToModelMessages(
        [message],
        isSupportedMimeType,
      );

      const content = result[0].content as Array<{
        type: string;
        image?: string;
      }>;
      const imagePart = content.find((p) => p.type === "image");
      expect(imagePart).toBeDefined();
      expect(imagePart?.image).toBe(`data:image/png;base64,${base64Data}`);
    });

    it("should convert PDF blob to file part with buffer data", () => {
      const base64Data = "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2c";
      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "storage:project/doc.pdf",
            name: "document.pdf",
            mimeType: "application/pdf",
            blob: base64Data,
          },
        },
      ]);

      const result = threadMessagesToModelMessages(
        [message],
        isSupportedMimeType,
      );

      const content = result[0].content as Array<{
        type: string;
        data?: Buffer;
        mediaType?: string;
      }>;
      const filePart = content.find((p) => p.type === "file");
      expect(filePart).toBeDefined();
      expect(filePart?.mediaType).toBe("application/pdf");
      expect(filePart?.data).toBeInstanceOf(Buffer);
    });

    it("should decode CSV blob to text when model does not support text/csv", () => {
      // CSV data: "name,value\nfoo,1\nbar,2"
      const csvContent = "name,value\nfoo,1\nbar,2";
      const base64Data = Buffer.from(csvContent).toString("base64");
      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "local://csv-123",
            name: "data.csv",
            mimeType: "text/csv",
            blob: base64Data,
          },
        },
      ]);

      // Use a predicate that doesn't support text/csv
      const noCSVSupport = () => false;
      const result = threadMessagesToModelMessages([message], noCSVSupport);

      const content = result[0].content as Array<{
        type: string;
        text?: string;
      }>;
      const textParts = content.filter((p) => p.type === "text");

      // Should have a resource tag with the decoded CSV content
      const resourceText = textParts.find((p) => p.text?.includes("<resource"));
      expect(resourceText).toBeDefined();
      expect(resourceText?.text).toContain("name,value");
      expect(resourceText?.text).toContain("foo,1");
      expect(resourceText?.text).toContain("bar,2");
    });

    it("should decode JSON blob to text when model does not support application/json", () => {
      const jsonContent = '{"key": "value", "number": 42}';
      const base64Data = Buffer.from(jsonContent).toString("base64");
      const message = createUserMessage([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "local://json-123",
            name: "data.json",
            mimeType: "application/json",
            blob: base64Data,
          },
        },
      ]);

      // Use a predicate that doesn't support application/json
      const noJSONSupport = () => false;
      const result = threadMessagesToModelMessages([message], noJSONSupport);

      const content = result[0].content as Array<{
        type: string;
        text?: string;
      }>;
      const textParts = content.filter((p) => p.type === "text");

      // Should have a resource tag with the decoded JSON content
      const resourceText = textParts.find((p) => p.text?.includes("<resource"));
      expect(resourceText).toBeDefined();
      expect(resourceText?.text).toContain('"key": "value"');
      expect(resourceText?.text).toContain('"number": 42');
    });
  });
});
