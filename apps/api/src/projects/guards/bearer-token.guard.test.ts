import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { getDb, operations } from "@tambo-ai-cloud/db";
import { SignJWT } from "jose";
import { CorrelationLoggerService } from "../../common/services/logger.service";
import { ProjectId } from "./apikey.guard";
import { BearerTokenGuard, ContextKey } from "./bearer-token.guard";

jest.mock("@tambo-ai-cloud/db", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/db");
  return {
    ...actual,
    operations: {
      ...(actual.operations ?? {}),
      getBearerTokenSecret: jest.fn(),
      getProject: jest.fn(),
    },
    getDb: jest.fn(),
  };
});

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

    // Default DB mocks
    (getDb as jest.Mock).mockReturnValue({});
    jest
      .mocked(operations.getBearerTokenSecret)
      .mockImplementation(async (_db, pId: string) => `secret-for-${pId}`);
    jest.mocked(operations.getProject).mockClear();
  });

  const secretFor = (projectId: string) => `secret-for-${projectId}`;
  const createTestToken = async (
    payload: any,
    projectId: string,
    overrideSecret?: string,
  ) => {
    const signingKey = new TextEncoder().encode(
      overrideSecret ?? secretFor(projectId),
    );
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

  it("should allow requests without Authorization header when isTokenRequired is false", async () => {
    const projectId = "test-project";
    mockRequest[ProjectId] = projectId;

    // Mock project with isTokenRequired = false
    jest.mocked(operations.getProject).mockResolvedValue({
      id: projectId,
      isTokenRequired: false,
    } as any);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
    expect(operations.getProject).toHaveBeenCalledWith({}, projectId);
  });

  it("should reject requests without Authorization header when isTokenRequired is true", async () => {
    const projectId = "test-project";
    mockRequest[ProjectId] = projectId;

    // Mock project with isTokenRequired = true
    jest.mocked(operations.getProject).mockResolvedValue({
      id: projectId,
      isTokenRequired: true,
    } as any);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(operations.getProject).toHaveBeenCalledWith({}, projectId);
  });

  it("should reject invalid Authorization header format", async () => {
    mockRequest.headers.authorization = "NotBearer token";

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects token signed with old predictable secret", async () => {
    const projectId = "proj-1";
    const payload = {
      sub: "user-1",
      iss: projectId,
      aud: "tambo",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = await createTestToken(
      payload,
      projectId,
      `token-for-${projectId}`,
    );
    mockRequest.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects token signed with a different project's secret", async () => {
    const projectA = "proj-A";
    const projectB = "proj-B";
    const payload = {
      sub: "user-2",
      iss: projectA, // claims to be A
      aud: "tambo",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    // Sign with B's secret
    const token = await createTestToken(payload, projectB, secretFor(projectB));
    mockRequest.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects token with invalid signature", async () => {
    const projectId = "proj-2";
    const payload = {
      sub: "user-3",
      iss: projectId,
      aud: "tambo",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    // Sign with arbitrary wrong secret
    const token = await createTestToken(payload, projectId, "wrong-secret");
    mockRequest.headers.authorization = `Bearer ${token}`;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
