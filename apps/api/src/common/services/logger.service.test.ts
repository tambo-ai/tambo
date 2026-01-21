import { Test, TestingModule } from "@nestjs/testing";
import { CorrelationLoggerService } from "./logger.service";

describe("CorrelationLoggerService", () => {
  let module: TestingModule;
  let service: CorrelationLoggerService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [CorrelationLoggerService],
    }).compile();

    // Use resolve() for request-scoped providers
    service = await module.resolve(CorrelationLoggerService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe("stringifyMessage", () => {
    describe("string passthrough", () => {
      it("should return strings without modification", () => {
        const input = "Hello, world!";
        expect(service.stringifyMessage(input)).toBe(input);
      });

      it("should handle empty strings", () => {
        expect(service.stringifyMessage("")).toBe("");
      });

      it("should preserve strings with special characters", () => {
        const input = "Line1\nLine2\tTabbed";
        expect(service.stringifyMessage(input)).toBe(input);
      });
    });

    describe("Error objects", () => {
      it("should return stack trace when available", () => {
        const error = new Error("Test error");
        const result = service.stringifyMessage(error);
        expect(result).toBe(error.stack);
        expect(result).toContain("Test error");
      });

      it("should return message when stack is undefined", () => {
        const error = new Error("Test error");
        error.stack = undefined;
        expect(service.stringifyMessage(error)).toBe("Test error");
      });

      it("should handle Error subclasses", () => {
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = "CustomError";
          }
        }
        const error = new CustomError("Custom message");
        const result = service.stringifyMessage(error);
        expect(result).toContain("Custom message");
      });
    });

    describe("plain objects to JSON", () => {
      it("should convert objects to JSON strings", () => {
        const input = { key: "value", number: 42 };
        expect(service.stringifyMessage(input)).toBe(JSON.stringify(input));
      });

      it("should convert arrays to JSON strings", () => {
        const input = [1, 2, 3, "four"];
        expect(service.stringifyMessage(input)).toBe(JSON.stringify(input));
      });

      it("should handle nested objects", () => {
        const input = { outer: { inner: { deep: "value" } } };
        expect(service.stringifyMessage(input)).toBe(JSON.stringify(input));
      });
    });

    describe("circular/unserializable objects", () => {
      it("should return placeholder for circular references", () => {
        const circular: Record<string, unknown> = { prop: "value" };
        circular.self = circular;
        expect(service.stringifyMessage(circular)).toBe(
          "[unserializable object]",
        );
      });

      it("should return placeholder for BigInt values", () => {
        const input = { bigNumber: BigInt(9007199254740991) };
        expect(service.stringifyMessage(input)).toBe("[unserializable object]");
      });
    });

    describe("primitives", () => {
      it("should convert null to string", () => {
        expect(service.stringifyMessage(null)).toBe("null");
      });

      it("should convert undefined to string", () => {
        expect(service.stringifyMessage(undefined)).toBe("undefined");
      });

      it("should convert numbers to string", () => {
        expect(service.stringifyMessage(42)).toBe("42");
        expect(service.stringifyMessage(0)).toBe("0");
        expect(service.stringifyMessage(-1)).toBe("-1");
        expect(service.stringifyMessage(3.14)).toBe("3.14");
      });

      it("should convert booleans to string", () => {
        expect(service.stringifyMessage(true)).toBe("true");
        expect(service.stringifyMessage(false)).toBe("false");
      });

      it("should convert NaN to string", () => {
        expect(service.stringifyMessage(NaN)).toBe("NaN");
      });

      it("should convert Infinity to string", () => {
        expect(service.stringifyMessage(Infinity)).toBe("Infinity");
        expect(service.stringifyMessage(-Infinity)).toBe("-Infinity");
      });
    });
  });

  describe("formatMessage", () => {
    describe("without correlationId", () => {
      it("should return message as-is when correlationId is not set", () => {
        expect(service.formatMessage("Test message")).toBe("Test message");
      });

      it("should stringify and return non-string messages", () => {
        const obj = { key: "value" };
        expect(service.formatMessage(obj)).toBe(JSON.stringify(obj));
      });
    });

    describe("with correlationId", () => {
      it("should prepend correlationId prefix", () => {
        service.setCorrelationId("abc-123");
        expect(service.formatMessage("Test message")).toBe(
          "[correlationId: abc-123] Test message",
        );
      });

      it("should format non-string messages with correlationId", () => {
        service.setCorrelationId("xyz-789");
        const obj = { key: "value" };
        expect(service.formatMessage(obj)).toBe(
          '[correlationId: xyz-789] {"key":"value"}',
        );
      });

      it("should format Error messages with correlationId", () => {
        service.setCorrelationId("err-456");
        const error = new Error("Something went wrong");
        error.stack = undefined;
        expect(service.formatMessage(error)).toBe(
          "[correlationId: err-456] Something went wrong",
        );
      });

      it("should treat empty string correlationId as falsy", () => {
        service.setCorrelationId("");
        expect(service.formatMessage("Test message")).toBe("Test message");
      });
    });
  });

  describe("setCorrelationId", () => {
    it("should set correlationId for subsequent messages", () => {
      service.setCorrelationId("test-id");
      expect(service.formatMessage("msg")).toContain("test-id");
    });

    it("should allow updating correlationId", () => {
      service.setCorrelationId("first-id");
      expect(service.formatMessage("msg")).toContain("first-id");

      service.setCorrelationId("second-id");
      const result = service.formatMessage("msg");
      expect(result).toContain("second-id");
      expect(result).not.toContain("first-id");
    });
  });

  describe("request-scoped behavior", () => {
    it("should create isolated instances with resolve()", async () => {
      const service1 = await module.resolve(CorrelationLoggerService);
      const service2 = await module.resolve(CorrelationLoggerService);

      service1.setCorrelationId("id-1");
      service2.setCorrelationId("id-2");

      expect(service1.formatMessage("msg")).toContain("id-1");
      expect(service2.formatMessage("msg")).toContain("id-2");
    });
  });
});
