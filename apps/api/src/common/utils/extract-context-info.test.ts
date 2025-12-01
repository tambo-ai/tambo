import { BadRequestException } from "@nestjs/common";
import { Request } from "express";
import { ProjectId } from "../../projects/guards/apikey.guard";
import { ContextKey } from "../../projects/guards/bearer-token.guard";
import { extractContextInfo } from "./extract-context-info";

describe("extractContextInfo", () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    mockRequest = {};
  });

  describe("error scenarios", () => {
    it("should throw BadRequestException when project ID is missing", () => {
      // Arrange - request without project ID
      const request = mockRequest as Request;
      const apiContextKey = "test-context-key";

      // Act & Assert
      expect(() => extractContextInfo(request, apiContextKey)).toThrow(
        new BadRequestException("Project ID is required"),
      );
    });

    it("should throw BadRequestException when project ID is undefined", () => {
      // Arrange - request with undefined project ID
      const request = {
        ...mockRequest,
        [ProjectId]: undefined,
      } as Request;
      const apiContextKey = "test-context-key";

      // Act & Assert
      expect(() => extractContextInfo(request, apiContextKey)).toThrow(
        new BadRequestException("Project ID is required"),
      );
    });

    it("should throw BadRequestException when both API and bearer context keys are provided", () => {
      // Arrange - request with both context key sources
      const request = {
        ...mockRequest,
        [ProjectId]: "test-project-id",
        [ContextKey]: "bearer-context-key",
      } as Request;
      const apiContextKey = "api-context-key";

      // Act & Assert
      expect(() => extractContextInfo(request, apiContextKey)).toThrow(
        new BadRequestException(
          "Context key cannot be provided both via API parameter and OAuth bearer token. Use only one method.",
        ),
      );
    });

    it("should throw BadRequestException when both context keys are non-empty strings", () => {
      // Arrange - ensure both are truthy values
      const request = {
        ...mockRequest,
        [ProjectId]: "test-project-id",
        [ContextKey]: "bearer-key",
      } as Request;
      const apiContextKey = "api-key";

      // Act & Assert
      expect(() => extractContextInfo(request, apiContextKey)).toThrow(
        new BadRequestException(
          "Context key cannot be provided both via API parameter and OAuth bearer token. Use only one method.",
        ),
      );
    });
  });

  describe("successful scenarios", () => {
    it("should return project ID and context key from API parameter when bearer key is not present", () => {
      // Arrange
      const request = {
        ...mockRequest,
        [ProjectId]: "test-project-id",
      } as Request;
      const apiContextKey = "api-context-key";

      // Act
      const result = extractContextInfo(request, apiContextKey);

      // Assert
      expect(result).toEqual({
        projectId: "test-project-id",
        contextKey: "api-context-key",
      });
    });

    it("should return project ID and context key from bearer token when API key is not present", () => {
      // Arrange
      const request = {
        ...mockRequest,
        [ProjectId]: "test-project-id",
        [ContextKey]: "bearer-context-key",
      } as Request;

      // Act
      const result = extractContextInfo(request, undefined);

      // Assert
      expect(result).toEqual({
        projectId: "test-project-id",
        contextKey: "bearer-context-key",
      });
    });

    it("should return undefined context key when neither source provides one", () => {
      // Arrange
      const request = {
        ...mockRequest,
        [ProjectId]: "test-project-id",
      } as Request;

      // Act
      const result = extractContextInfo(request, undefined);

      // Assert
      expect(result).toEqual({
        projectId: "test-project-id",
        contextKey: undefined,
      });
    });

    it("should handle empty string bearer context key as falsy", () => {
      // Arrange - empty string should be treated as falsy
      const request = {
        ...mockRequest,
        [ProjectId]: "test-project-id",
        [ContextKey]: "",
      } as Request;
      const apiContextKey = "api-context-key";

      // Act
      const result = extractContextInfo(request, apiContextKey);

      // Assert
      expect(result).toEqual({
        projectId: "test-project-id",
        contextKey: "api-context-key",
      });
    });
  });
});
