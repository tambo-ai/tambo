import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { SignJWT } from "jose";
import { CorrelationLoggerService } from "../../../common/services/logger.service";
import { ProjectId } from "../apikey.guard";
import { BearerTokenGuard, ContextKey } from "../bearer-token.guard";

describe("BearerTokenGuard Context Key Generation", () => {
  let guard: BearerTokenGuard;
  let mockLogger: jest.Mocked<CorrelationLoggerService>;
  let mockContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    guard = new BearerTokenGuard(mockLogger);

    mockRequest = {
      headers: {},
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  const createTestToken = async (payload: any, projectId: string) => {
    const signingKey = new TextEncoder().encode(`token-for-${projectId}`);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .sign(signingKey);
  };

  describe("Context Key Generation", () => {
    it("should generate correct context key for Google consumer account", async () => {
      const projectId = "test-project";
      const payload = {
        sub: "google-user-123",
        iss: projectId,
        aud: "tambo",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        original_iss: "https://accounts.google.com",
        // No original_hd claim for consumer accounts
      };

      const token = await createTestToken(payload, projectId);
      mockRequest.headers.authorization = `Bearer ${token}`;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest[ProjectId]).toBe(projectId);
      expect(mockRequest[ContextKey]).toBe(
        "oauth:user:accounts.google.com:google-user-123",
      );
    });

    it("should generate correct context key for Google Workspace account", async () => {
      const projectId = "test-project";
      const payload = {
        sub: "workspace-user-456",
        iss: projectId,
        aud: "tambo",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        original_iss: "https://accounts.google.com",
        original_hd: "company.com", // Hosted domain for Workspace
      };

      const token = await createTestToken(payload, projectId);
      mockRequest.headers.authorization = `Bearer ${token}`;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest[ProjectId]).toBe(projectId);
      expect(mockRequest[ContextKey]).toBe(
        "oauth:user:accounts.google.com:company.com:workspace-user-456",
      );
    });

    it("should generate correct context key for GitHub provider", async () => {
      const projectId = "test-project";
      const payload = {
        sub: "github-user-789",
        iss: projectId,
        aud: "tambo",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        original_iss: "https://github.com",
      };

      const token = await createTestToken(payload, projectId);
      mockRequest.headers.authorization = `Bearer ${token}`;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest[ProjectId]).toBe(projectId);
      expect(mockRequest[ContextKey]).toBe(
        "oauth:user:github.com:github-user-789",
      );
    });

    it("should generate correct context key for Microsoft provider", async () => {
      const projectId = "test-project";
      const payload = {
        sub: "microsoft-user-101",
        iss: projectId,
        aud: "tambo",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        original_iss: "https://login.microsoftonline.com",
      };

      const token = await createTestToken(payload, projectId);
      mockRequest.headers.authorization = `Bearer ${token}`;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest[ProjectId]).toBe(projectId);
      expect(mockRequest[ContextKey]).toBe(
        "oauth:user:login.microsoftonline.com:microsoft-user-101",
      );
    });

    it("should fall back to legacy format when original_iss is missing", async () => {
      const projectId = "test-project";
      const payload = {
        sub: "legacy-user-123",
        iss: projectId,
        aud: "tambo",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        // No original_iss claim
      };

      const token = await createTestToken(payload, projectId);
      mockRequest.headers.authorization = `Bearer ${token}`;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest[ProjectId]).toBe(projectId);
      expect(mockRequest[ContextKey]).toBe("oauth:user:legacy-user-123");
    });

    it("should preserve hosted domain with special characters", async () => {
      const projectId = "test-project";
      const payload = {
        sub: "workspace-user-456",
        iss: projectId,
        aud: "tambo",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        original_iss: "https://accounts.google.com",
        original_hd: "my-company@domain.com", // Domain with special characters
      };

      const token = await createTestToken(payload, projectId);
      mockRequest.headers.authorization = `Bearer ${token}`;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest[ProjectId]).toBe(projectId);
      expect(mockRequest[ContextKey]).toBe(
        "oauth:user:accounts.google.com:my-company@domain.com:workspace-user-456",
      );
    });

    it("should handle invalid original_iss gracefully", async () => {
      const projectId = "test-project";
      const payload = {
        sub: "user-123",
        iss: projectId,
        aud: "tambo",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        original_iss: "not-a-valid-url",
      };

      const token = await createTestToken(payload, projectId);
      mockRequest.headers.authorization = `Bearer ${token}`;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest[ProjectId]).toBe(projectId);
      expect(mockRequest[ContextKey]).toBe(
        "oauth:user:not-a-valid-url:user-123",
      ); // Uses sanitized URL as hostname
    });
  });

  it("should allow requests without Authorization header", async () => {
    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it("should reject invalid Authorization header format", async () => {
    mockRequest.headers.authorization = "NotBearer token";

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
