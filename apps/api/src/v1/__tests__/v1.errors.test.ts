import {
  createProblemDetail,
  createValidationProblemDetail,
  V1ErrorCodes,
} from "../v1.errors";

describe("v1.errors", () => {
  describe("createProblemDetail", () => {
    it("should create problem detail for CONCURRENT_RUN", () => {
      const result = createProblemDetail(
        V1ErrorCodes.CONCURRENT_RUN,
        "A run is already active on thread thr_123",
      );

      expect(result.type).toBe("urn:tambo:error:concurrent_run");
      expect(result.title).toBe("Concurrent Run");
      expect(result.status).toBe(409);
      expect(result.detail).toBe("A run is already active on thread thr_123");
      expect(result.instance).toMatch(/^urn:tambo:error-instance:[a-f0-9-]+$/);
    });

    it("should create problem detail for RUN_ACTIVE", () => {
      const result = createProblemDetail(
        V1ErrorCodes.RUN_ACTIVE,
        "Cannot delete thread while run is active",
      );

      expect(result.type).toBe("urn:tambo:error:run_active");
      expect(result.title).toBe("Run Active");
      expect(result.status).toBe(409);
      expect(result.detail).toBe("Cannot delete thread while run is active");
    });

    it("should create problem detail for RUN_NOT_FOUND", () => {
      const result = createProblemDetail(
        V1ErrorCodes.RUN_NOT_FOUND,
        "Run run_abc not found",
      );

      expect(result.type).toBe("urn:tambo:error:run_not_found");
      expect(result.title).toBe("Run Not Found");
      expect(result.status).toBe(404);
    });

    it("should create problem detail for THREAD_NOT_FOUND", () => {
      const result = createProblemDetail(
        V1ErrorCodes.THREAD_NOT_FOUND,
        "Thread thr_xyz not found",
      );

      expect(result.type).toBe("urn:tambo:error:thread_not_found");
      expect(result.title).toBe("Thread Not Found");
      expect(result.status).toBe(404);
    });

    it("should create problem detail for MESSAGE_NOT_FOUND", () => {
      const result = createProblemDetail(
        V1ErrorCodes.MESSAGE_NOT_FOUND,
        "Message msg_123 not found in thread thr_456",
      );

      expect(result.type).toBe("urn:tambo:error:message_not_found");
      expect(result.title).toBe("Message Not Found");
      expect(result.status).toBe(404);
    });

    it("should create problem detail for COMPONENT_NOT_FOUND", () => {
      const result = createProblemDetail(
        V1ErrorCodes.COMPONENT_NOT_FOUND,
        "Component WeatherCard not found in registry",
      );

      expect(result.type).toBe("urn:tambo:error:component_not_found");
      expect(result.title).toBe("Component Not Found");
      expect(result.status).toBe(404);
    });

    it("should create problem detail for INVALID_TOOL_CALL", () => {
      const result = createProblemDetail(
        V1ErrorCodes.INVALID_TOOL_CALL,
        "Tool call call_xyz is not pending",
      );

      expect(result.type).toBe("urn:tambo:error:invalid_tool_call");
      expect(result.title).toBe("Invalid Tool Call");
      expect(result.status).toBe(400);
    });

    it("should create problem detail for INVALID_PREVIOUS_RUN", () => {
      const result = createProblemDetail(
        V1ErrorCodes.INVALID_PREVIOUS_RUN,
        "previousRunId run_old does not match last completed run",
      );

      expect(result.type).toBe("urn:tambo:error:invalid_previous_run");
      expect(result.title).toBe("Invalid Previous Run");
      expect(result.status).toBe(400);
    });

    it("should create problem detail for VALIDATION_ERROR", () => {
      const result = createProblemDetail(
        V1ErrorCodes.VALIDATION_ERROR,
        "Invalid request body",
      );

      expect(result.type).toBe("urn:tambo:error:validation_error");
      expect(result.title).toBe("Validation Error");
      expect(result.status).toBe(400);
    });

    it("should create problem detail for INTERNAL_ERROR", () => {
      const result = createProblemDetail(
        V1ErrorCodes.INTERNAL_ERROR,
        "An unexpected error occurred",
      );

      expect(result.type).toBe("urn:tambo:error:internal_error");
      expect(result.title).toBe("Internal Error");
      expect(result.status).toBe(500);
    });

    it("should include extra fields when provided", () => {
      const result = createProblemDetail(
        V1ErrorCodes.CONCURRENT_RUN,
        "A run is already active",
        {
          threadId: "thr_123",
          activeRunId: "run_456",
        },
      );

      expect(result.threadId).toBe("thr_123");
      expect(result.activeRunId).toBe("run_456");
    });

    it("should generate unique instance IDs for each call", () => {
      const result1 = createProblemDetail(
        V1ErrorCodes.INTERNAL_ERROR,
        "Error 1",
      );
      const result2 = createProblemDetail(
        V1ErrorCodes.INTERNAL_ERROR,
        "Error 2",
      );

      expect(result1.instance).not.toBe(result2.instance);
    });

    it("should conform to RFC 9457 Problem Details structure", () => {
      const result = createProblemDetail(
        V1ErrorCodes.THREAD_NOT_FOUND,
        "Thread not found",
        { threadId: "thr_missing" },
      );

      // Required fields per RFC 9457
      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("detail");
      expect(result).toHaveProperty("instance");

      // Type should be a URI
      expect(result.type).toMatch(/^urn:/);
      // Instance should be a URI
      expect(result.instance).toMatch(/^urn:/);
      // Status should be a number
      expect(typeof result.status).toBe("number");
    });
  });

  describe("createValidationProblemDetail", () => {
    it("should create validation error with field-level errors", () => {
      const result = createValidationProblemDetail({
        "message.content": "Content is required",
        "message.role": "Role must be 'user'",
      });

      expect(result.type).toBe("urn:tambo:error:validation_error");
      expect(result.title).toBe("Validation Error");
      expect(result.status).toBe(400);
      expect(result.detail).toBe("Request validation failed");
      expect(result.errors).toEqual({
        "message.content": "Content is required",
        "message.role": "Role must be 'user'",
      });
    });

    it("should handle single field error", () => {
      const result = createValidationProblemDetail({
        threadId: "Invalid thread ID format",
      });

      expect(result.errors).toEqual({
        threadId: "Invalid thread ID format",
      });
    });

    it("should handle empty errors object", () => {
      const result = createValidationProblemDetail({});

      expect(result.errors).toEqual({});
      expect(result.detail).toBe("Request validation failed");
    });

    it("should generate unique instance ID", () => {
      const result = createValidationProblemDetail({
        field: "error",
      });

      expect(result.instance).toMatch(/^urn:tambo:error-instance:[a-f0-9-]+$/);
    });
  });

  describe("V1ErrorCodes", () => {
    it("should have all expected error codes", () => {
      expect(V1ErrorCodes.CONCURRENT_RUN).toBe("CONCURRENT_RUN");
      expect(V1ErrorCodes.RUN_ACTIVE).toBe("RUN_ACTIVE");
      expect(V1ErrorCodes.RUN_NOT_FOUND).toBe("RUN_NOT_FOUND");
      expect(V1ErrorCodes.THREAD_NOT_FOUND).toBe("THREAD_NOT_FOUND");
      expect(V1ErrorCodes.MESSAGE_NOT_FOUND).toBe("MESSAGE_NOT_FOUND");
      expect(V1ErrorCodes.COMPONENT_NOT_FOUND).toBe("COMPONENT_NOT_FOUND");
      expect(V1ErrorCodes.INVALID_TOOL_CALL).toBe("INVALID_TOOL_CALL");
      expect(V1ErrorCodes.INVALID_PREVIOUS_RUN).toBe("INVALID_PREVIOUS_RUN");
      expect(V1ErrorCodes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(V1ErrorCodes.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    });

    it("should be readonly (as const)", () => {
      // This is a compile-time check - if V1ErrorCodes weren't `as const`,
      // the values would be typed as `string` instead of literal types
      const code: "CONCURRENT_RUN" = V1ErrorCodes.CONCURRENT_RUN;
      expect(code).toBe("CONCURRENT_RUN");
    });
  });
});
