import { plainToInstance } from "class-transformer";
import { validate, Equals, IsString } from "class-validator";
import { ApiDiscriminatedUnion } from "./api-discriminated-union.decorator";

// Test DTOs
class TestTextDto {
  @Equals("text")
  type!: "text";

  @IsString()
  text!: string;
}

class TestResourceDto {
  @Equals("resource")
  type!: "resource";

  @IsString()
  url!: string;
}

class TestContainerDto {
  @ApiDiscriminatedUnion({
    types: [
      { dto: TestTextDto, name: "text" },
      { dto: TestResourceDto, name: "resource" },
    ],
    description: "Test content",
    isArray: true,
  })
  content!: Array<TestTextDto | TestResourceDto>;
}

describe("ApiDiscriminatedUnion", () => {
  describe("runtime deserialization", () => {
    it("should deserialize text content correctly", () => {
      const plain = {
        content: [
          { type: "text", text: "hello" },
          { type: "text", text: "world" },
        ],
      };

      const instance = plainToInstance(TestContainerDto, plain);

      expect(instance.content).toHaveLength(2);
      expect(instance.content[0]).toBeInstanceOf(TestTextDto);
      expect(instance.content[1]).toBeInstanceOf(TestTextDto);
      expect((instance.content[0] as TestTextDto).text).toBe("hello");
    });

    it("should deserialize mixed content types correctly", () => {
      const plain = {
        content: [
          { type: "text", text: "hello" },
          { type: "resource", url: "https://example.com" },
        ],
      };

      const instance = plainToInstance(TestContainerDto, plain);

      expect(instance.content).toHaveLength(2);
      expect(instance.content[0]).toBeInstanceOf(TestTextDto);
      expect(instance.content[1]).toBeInstanceOf(TestResourceDto);
      expect((instance.content[0] as TestTextDto).text).toBe("hello");
      expect((instance.content[1] as TestResourceDto).url).toBe(
        "https://example.com",
      );
    });

    it("should preserve type discriminator property", () => {
      const plain = {
        content: [{ type: "text", text: "hello" }],
      };

      const instance = plainToInstance(TestContainerDto, plain);

      expect((instance.content[0] as TestTextDto).type).toBe("text");
    });
  });

  describe("runtime validation", () => {
    it("should validate correct content", async () => {
      const plain = {
        content: [
          { type: "text", text: "hello" },
          { type: "resource", url: "https://example.com" },
        ],
      };

      const instance = plainToInstance(TestContainerDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
    });

    it("should fail validation for incorrect type", async () => {
      const plain = {
        content: [{ type: "invalid", text: "hello" }],
      };

      const instance = plainToInstance(TestContainerDto, plain);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should fail validation for missing required fields", async () => {
      const plain = {
        content: [{ type: "text" }], // Missing 'text' field
      };

      const instance = plainToInstance(TestContainerDto, plain);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
    });

    it("should fail validation when content is not an array", async () => {
      const plain = {
        content: { type: "text", text: "hello" },
      };

      const instance = plainToInstance(TestContainerDto, plain);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("non-array content", () => {
    class SingleValueDto {
      @ApiDiscriminatedUnion({
        types: [
          { dto: TestTextDto, name: "text" },
          { dto: TestResourceDto, name: "resource" },
        ],
        description: "Single content value",
        isArray: false,
      })
      value!: TestTextDto | TestResourceDto;
    }

    it("should deserialize single value correctly", () => {
      const plain = {
        value: { type: "text", text: "hello" },
      };

      const instance = plainToInstance(SingleValueDto, plain);

      expect(instance.value).toBeInstanceOf(TestTextDto);
      expect((instance.value as TestTextDto).text).toBe("hello");
    });
  });
});
