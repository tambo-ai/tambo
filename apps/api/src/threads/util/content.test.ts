import {
  ChatCompletionContentPart,
  ContentPartType,
} from "@tambo-ai-cloud/core";
import { AudioFormat, ImageDetail } from "../dto/message.dto";
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
