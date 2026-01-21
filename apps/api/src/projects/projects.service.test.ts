import { Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { TestingModule } from "@nestjs/testing";
import { AiProviderType } from "@tambo-ai-cloud/core";
import { operations, type HydraDatabase } from "@tambo-ai-cloud/db";

import { AnalyticsService } from "../common/services/analytics.service";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { createTestRequestContext } from "../test/utils/create-test-request-context";
import { createTestingModule } from "../test/utils/create-testing-module";
import { resolveRequestScopedProvider } from "../test/utils/resolve-request-scoped-provider";
import { ProjectsService } from "./projects.service";

let mockedOperations: {
  createApiKey: jest.Mock;
  createProject: jest.Mock;
  getApiKeys: jest.Mock;
  getProjectApiKeyId: jest.Mock;
  updateApiKeyLastUsed: jest.Mock;
};

const createMockConfigService = () =>
  ({
    getOrThrow: jest.fn(),
  }) satisfies Pick<ConfigService, "getOrThrow">;

const createMockAnalyticsService = () =>
  ({
    capture: jest.fn(),
  }) satisfies Pick<AnalyticsService, "capture">;

jest.mock("@tambo-ai-cloud/db", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/db");

  mockedOperations = {
    createApiKey: jest.fn(),
    createProject: jest.fn(),
    getApiKeys: jest.fn(),
    getProjectApiKeyId: jest.fn(),
    updateApiKeyLastUsed: jest.fn(),
  };

  return {
    ...actual,
    operations: {
      ...(actual.operations ?? {}),
      ...mockedOperations,
    },
  };
});

@Injectable({ scope: Scope.REQUEST })
class ExampleRequestScopedService {
  constructor(private readonly projectsService: ProjectsService) {}

  getDb(): HydraDatabase {
    return this.projectsService.getDb();
  }
}

describe("ProjectsService", () => {
  let mockDb: HydraDatabase;
  let mockConfigService: ReturnType<typeof createMockConfigService>;
  let mockAnalyticsService: ReturnType<typeof createMockAnalyticsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {} as HydraDatabase;
    mockConfigService = createMockConfigService();
    mockAnalyticsService = createMockAnalyticsService();

    jest
      .mocked(operations.getApiKeys)
      .mockResolvedValue(
        [] as Awaited<ReturnType<typeof operations.getApiKeys>>,
      );
  });

  it("creates a project", async () => {
    const module: TestingModule = await createTestingModule({
      providers: [
        ProjectsService,
        { provide: DATABASE, useValue: mockDb },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    });

    try {
      const created = {
        id: "proj-1",
        name: "New Project",
        userId: "user-1",
        isTokenRequired: false,
        providerType: AiProviderType.LLM,
      } as Awaited<ReturnType<typeof operations.createProject>>;
      jest.mocked(operations.createProject).mockResolvedValue(created);

      const service = module.get(ProjectsService);
      const result = await service.create({
        name: "New Project",
        userId: "user-1",
      });

      expect(operations.createProject).toHaveBeenCalledWith(mockDb, {
        name: "New Project",
        userId: "user-1",
      });
      expect(result).toEqual({
        id: "proj-1",
        name: "New Project",
        userId: "user-1",
        isTokenRequired: false,
        providerType: AiProviderType.LLM,
      });
    } finally {
      await module.close();
    }
  });

  it("generates an API key using the configured secret", async () => {
    const module: TestingModule = await createTestingModule({
      providers: [
        ProjectsService,
        { provide: DATABASE, useValue: mockDb },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    });

    try {
      mockConfigService.getOrThrow.mockReturnValue("api-key-secret");
      jest.mocked(operations.createApiKey).mockResolvedValue("tambo_test_key");

      const service = module.get(ProjectsService);
      const apiKey = await service.generateApiKey(
        "proj-1",
        "user-1",
        "key-name",
      );

      expect(apiKey).toBe("tambo_test_key");
      expect(operations.getApiKeys).toHaveBeenCalledWith(mockDb, "proj-1");
      expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(
        "API_KEY_SECRET",
      );
      expect(operations.createApiKey).toHaveBeenCalledWith(
        mockDb,
        "api-key-secret",
        {
          projectId: "proj-1",
          userId: "user-1",
          name: "key-name",
        },
      );
      expect(mockAnalyticsService.capture).toHaveBeenCalledWith(
        "user-1",
        "api_key_generated",
        {
          projectId: "proj-1",
          isFirstKey: true,
        },
      );
    } finally {
      await module.close();
    }
  });

  it("supports resolving request-scoped providers in the projects module", async () => {
    const module: TestingModule = await createTestingModule({
      providers: [
        ProjectsService,
        ExampleRequestScopedService,
        { provide: DATABASE, useValue: mockDb },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    });

    try {
      // No need to stub `ContextIdFactory.getByRequest(...)` here; the provider
      // resolution is driven by `registerRequestByContextId(...)`.
      const context = createTestRequestContext();
      const requestScopedService = await resolveRequestScopedProvider(
        module,
        ExampleRequestScopedService,
        context,
      );

      expect(requestScopedService.getDb()).toBe(mockDb);
    } finally {
      await module.close();
    }
  });
});
