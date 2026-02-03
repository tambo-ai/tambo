import {
  ChatCompletionContentPart,
  ContentPartType,
} from "@tambo-ai-cloud/core";
import {
  AudioFormat,
  ChatCompletionContentPartDto,
  ImageDetail,
} from "../dto/message.dto";
import {
  convertContentDtoToContentPart,
  convertContentPartToDto,
  tryParseJson,
} from "./content";

describe("content utilities", () => {
  describe("convertContentDtoToContentPart", () => {
    it("should convert string to text content part", () => {
      const result = convertContentDtoToContentPart("test message");
      expect(result).toEqual([
        { type: ContentPartType.Text, text: "test message" },
      ]);
    });

    it("should convert array of text parts", () => {
      const input = [
        { type: ContentPartType.Text, text: "part 1" },
        { type: ContentPartType.Text, text: "part 2" },
      ];
      const result = convertContentDtoToContentPart(input);
      expect(result).toEqual(input);
    });

    it("should handle image url parts", () => {
      const input = [
        {
          type: ContentPartType.ImageUrl,
          image_url: { url: "test.jpg", detail: ImageDetail.Low },
        },
      ];
      const result = convertContentDtoToContentPart(input);
      expect(result).toEqual(input);
    });

    it("should handle audio input parts", () => {
      const input = [
        {
          type: ContentPartType.InputAudio,
          input_audio: { data: "base64data", format: AudioFormat.MP3 },
        },
      ];
      const result = convertContentDtoToContentPart(input);
      expect(result).toEqual(input);
    });

    it("should convert resource parts with resource data", () => {
      const input = [
        {
          type: "resource" as ContentPartType,
          resource: {
            uri: "file://test.txt",
            name: "test",
            text: "resource content",
          },
        },
        { type: ContentPartType.Text, text: "text" },
      ];
      const result = convertContentDtoToContentPart(input);
      expect(result).toEqual([
        {
          type: ContentPartType.Resource,
          resource: {
            uri: "file://test.txt",
            name: "test",
            text: "resource content",
          },
        },
        { type: ContentPartType.Text, text: "text" },
      ]);
    });

    it("should throw error for unknown content type", () => {
      const input = [{ type: "unknown" as ContentPartType, text: "test" }];
      expect(() => convertContentDtoToContentPart(input)).toThrow(
        "Unknown content part type: unknown",
      );
    });

    it("should allow empty string for text content", () => {
      const input = [{ type: ContentPartType.Text, text: "" }];
      const result = convertContentDtoToContentPart(input);
      expect(result).toEqual([{ type: ContentPartType.Text, text: "" }]);
    });

    it("should throw error when text is undefined", () => {
      const input = [
        { type: ContentPartType.Text, text: undefined as unknown as string },
      ];
      expect(() => convertContentDtoToContentPart(input)).toThrow(
        "Text content is required for text type",
      );
    });

    it("should throw error when text is null", () => {
      const input = [
        { type: ContentPartType.Text, text: null as unknown as string },
      ];
      expect(() => convertContentDtoToContentPart(input)).toThrow(
        "Text content is required for text type",
      );
    });

    it("should throw error when image_url is missing", () => {
      const input = [
        {
          type: ContentPartType.ImageUrl,
          image_url: undefined as unknown as { url: string },
        },
      ];
      expect(() => convertContentDtoToContentPart(input)).toThrow(
        "image_url with a non-empty 'url' is required for image_url type",
      );
    });

    it("should throw error when image_url.url is empty", () => {
      const input = [
        {
          type: ContentPartType.ImageUrl,
          image_url: { url: "" },
        },
      ];
      expect(() => convertContentDtoToContentPart(input)).toThrow(
        "image_url with a non-empty 'url' is required for image_url type",
      );
    });

    it("should throw error when input_audio is missing", () => {
      const input: ChatCompletionContentPartDto[] = [
        {
          type: ContentPartType.InputAudio,
          input_audio: undefined,
        } as ChatCompletionContentPartDto,
      ];
      expect(() => convertContentDtoToContentPart(input)).toThrow(
        "input_audio with base64 'data' is required for input_audio type",
      );
    });

    it("should throw error when input_audio.data is empty", () => {
      const input = [
        {
          type: ContentPartType.InputAudio,
          input_audio: { data: "", format: AudioFormat.MP3 },
        },
      ];
      expect(() => convertContentDtoToContentPart(input)).toThrow(
        "input_audio with base64 'data' is required for input_audio type",
      );
    });

    it("should throw error when resource is missing", () => {
      const input = [
        {
          type: ContentPartType.Resource,
          resource: undefined as unknown as { uri: string },
        },
      ];
      expect(() => convertContentDtoToContentPart(input)).toThrow(
        "resource is required for resource type",
      );
    });
  });

  describe("convertContentPartToDto", () => {
    it("should convert string to text content part dto", () => {
      const result = convertContentPartToDto("test message");
      expect(result).toEqual([
        { type: ContentPartType.Text, text: "test message" },
      ]);
    });

    it("should pass through array of content parts", () => {
      const input: ChatCompletionContentPart[] = [
        { type: ContentPartType.Text, text: "test" },
        {
          type: ContentPartType.ImageUrl,
          image_url: { url: "test.jpg", detail: ImageDetail.Low },
        },
      ];
      const result = convertContentPartToDto(input);
      expect(result).toEqual(input);
    });

    it("should filter out component content parts", () => {
      const input: ChatCompletionContentPart[] = [
        { type: ContentPartType.Text, text: "before component" },
        {
          type: "component",
          id: "comp-123",
          name: "TestComponent",
          props: { title: "Hello" },
          state: { expanded: true },
        } as ChatCompletionContentPart,
        { type: ContentPartType.Text, text: "after component" },
      ];
      const result = convertContentPartToDto(input);
      expect(result).toEqual([
        { type: ContentPartType.Text, text: "before component" },
        { type: ContentPartType.Text, text: "after component" },
      ]);
    });

    it("should handle array with only component parts", () => {
      const input: ChatCompletionContentPart[] = [
        {
          type: "component",
          id: "comp-456",
          name: "OnlyComponent",
          props: {},
        } as ChatCompletionContentPart,
      ];
      const result = convertContentPartToDto(input);
      expect(result).toEqual([]);
    });
  });

  describe("tryParseJson", () => {
    it("should parse valid JSON object", () => {
      const result = tryParseJson('{"key": "value"}');
      expect(result).toEqual({ key: "value" });
    });

    it("should parse valid JSON array", () => {
      const result = tryParseJson("[1, 2, 3]");
      expect(result).toEqual([1, 2, 3]);
    });

    it("should return original string for non-JSON input", () => {
      const input = "plain text";
      const result = tryParseJson(input);
      expect(result).toBe(input);
    });

    it("should return original string for invalid JSON", () => {
      const input = "{invalid json}";
      const result = tryParseJson(input);
      expect(result).toBe(input);
    });
  });
});
