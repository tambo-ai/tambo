import type { TestingModule } from "@nestjs/testing";
import type {
  ExternalSkillMetadata,
  ProviderSkillReference,
} from "@tambo-ai-cloud/core";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/database-provider";
import { createTestingModule } from "../test/utils/create-testing-module";
import { SkillsService } from "./skills.service";

// Mock backend helpers
let mockUploadSkillToProvider: jest.Mock;
let mockDeleteSkillFromProvider: jest.Mock;

jest.mock("@tambo-ai-cloud/backend", () => ({
  uploadSkillToProvider: (...args: unknown[]) =>
    mockUploadSkillToProvider(...args),
  deleteSkillFromProvider: (...args: unknown[]) =>
    mockDeleteSkillFromProvider(...args),
}));

// Mock DB operations
jest.mock("@tambo-ai-cloud/db", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/db");
  return {
    ...actual,
    operations: {
      updateSkill: jest.fn(),
      mergeSkillMetadata: jest.fn(),
    },
  };
});

const mockedOperations: {
  updateSkill: jest.Mock;
  mergeSkillMetadata: jest.Mock;
} = jest.requireMock("@tambo-ai-cloud/db").operations;

function makeSkill(
  overrides: Partial<import("@tambo-ai-cloud/db").schema.DBSkill> = {},
) {
  return {
    id: "sk-test-1",
    projectId: "proj-1",
    name: "test-skill",
    description: "A test skill",
    instructions: "Do something useful",
    enabled: true,
    usageCount: 0,
    externalSkillMetadata: {} as ExternalSkillMetadata,
    createdByUserId: null,
    lastUsedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("SkillsService", () => {
  let mockDb: HydraDatabase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {} as HydraDatabase;
    mockUploadSkillToProvider = jest.fn();
    mockDeleteSkillFromProvider = jest.fn();
  });

  async function createService(): Promise<{
    service: SkillsService;
    module: TestingModule;
  }> {
    const module = await createTestingModule({
      providers: [SkillsService, { provide: DATABASE, useValue: mockDb }],
    });
    return { service: module.get(SkillsService), module };
  }

  describe("supportsSkills", () => {
    it("returns true for openai", async () => {
      const { service, module } = await createService();
      try {
        expect(service.supportsSkills("openai")).toBe(true);
      } finally {
        await module.close();
      }
    });

    it("returns true for anthropic", async () => {
      const { service, module } = await createService();
      try {
        expect(service.supportsSkills("anthropic")).toBe(true);
      } finally {
        await module.close();
      }
    });

    it("returns false for unsupported providers", async () => {
      const { service, module } = await createService();
      try {
        expect(service.supportsSkills("mistral")).toBe(false);
        expect(service.supportsSkills("groq")).toBe(false);
      } finally {
        await module.close();
      }
    });
  });

  describe("uploadToProvider", () => {
    it("delegates to uploadSkillToProvider and returns the result", async () => {
      const ref: ProviderSkillReference = {
        skillId: "oai-skill-1",
        uploadedAt: "2026-01-01T00:00:00Z",
        version: "v2",
      };
      mockUploadSkillToProvider.mockResolvedValue(ref);

      const { service, module } = await createService();
      try {
        const skill = makeSkill();
        const result = await service.uploadToProvider({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(result).toBe(ref);
        expect(mockUploadSkillToProvider).toHaveBeenCalledWith({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });
      } finally {
        await module.close();
      }
    });
  });

  describe("ensureSkillUploaded", () => {
    it("skips upload when metadata already exists for the provider", async () => {
      const existing: ProviderSkillReference = {
        skillId: "oai-existing",
        uploadedAt: "2026-01-01T00:00:00Z",
        version: "1",
      };
      const skill = makeSkill({
        externalSkillMetadata: { openai: existing },
      });

      const { service, module } = await createService();
      try {
        const result = await service.ensureSkillUploaded({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(result).toBe(existing);
        expect(mockUploadSkillToProvider).not.toHaveBeenCalled();
        expect(mockedOperations.mergeSkillMetadata).not.toHaveBeenCalled();
      } finally {
        await module.close();
      }
    });

    it("uploads and persists metadata when not present", async () => {
      mockUploadSkillToProvider.mockResolvedValue({
        skillId: "oai-new",
        uploadedAt: "2026-01-01T00:00:00Z",
        version: "1",
      });

      const skill = makeSkill();
      const { service, module } = await createService();
      try {
        const result = await service.ensureSkillUploaded({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(result.skillId).toBe("oai-new");
        expect(mockedOperations.mergeSkillMetadata).toHaveBeenCalledWith(
          mockDb,
          "proj-1",
          "sk-test-1",
          {
            openai: expect.objectContaining({ skillId: "oai-new" }),
          },
        );
      } finally {
        await module.close();
      }
    });

    it("preserves existing metadata for other providers when uploading", async () => {
      const anthropicMeta: ProviderSkillReference = {
        skillId: "ant-existing",
        uploadedAt: "2026-01-01T00:00:00Z",
        version: "1",
      };
      const skill = makeSkill({
        externalSkillMetadata: { anthropic: anthropicMeta },
      });

      mockUploadSkillToProvider.mockResolvedValue({
        skillId: "oai-new",
        uploadedAt: "2026-01-01T00:00:00Z",
        version: "1",
      });

      const { service, module } = await createService();
      try {
        await service.ensureSkillUploaded({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(mockedOperations.mergeSkillMetadata).toHaveBeenCalledWith(
          mockDb,
          "proj-1",
          "sk-test-1",
          {
            openai: expect.objectContaining({ skillId: "oai-new" }),
          },
        );
      } finally {
        await module.close();
      }
    });
  });

  describe("deleteFromProvider", () => {
    it("calls deleteSkillFromProvider when metadata exists", async () => {
      const skill = makeSkill({
        externalSkillMetadata: {
          openai: {
            skillId: "oai-to-delete",
            uploadedAt: "2026-01-01T00:00:00Z",
            version: "1",
          },
        },
      });

      const { service, module } = await createService();
      try {
        await service.deleteFromProvider({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(mockDeleteSkillFromProvider).toHaveBeenCalledWith({
          skillId: "oai-to-delete",
          providerName: "openai",
          apiKey: "sk-test",
        });
      } finally {
        await module.close();
      }
    });

    it("skips deletion when no metadata for the provider", async () => {
      const skill = makeSkill({ externalSkillMetadata: {} });

      const { service, module } = await createService();
      try {
        await service.deleteFromProvider({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(mockDeleteSkillFromProvider).not.toHaveBeenCalled();
      } finally {
        await module.close();
      }
    });

    it("logs warning but does not throw on provider error", async () => {
      mockDeleteSkillFromProvider.mockRejectedValue(new Error("Network error"));

      const skill = makeSkill({
        externalSkillMetadata: {
          openai: {
            skillId: "oai-fail",
            uploadedAt: "2026-01-01T00:00:00Z",
            version: "1",
          },
        },
      });

      const { service, module } = await createService();
      try {
        // Should not throw
        await service.deleteFromProvider({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(mockDeleteSkillFromProvider).toHaveBeenCalled();
      } finally {
        await module.close();
      }
    });
  });
});
