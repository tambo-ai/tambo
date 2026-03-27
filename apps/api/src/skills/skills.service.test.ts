import type { TestingModule } from "@nestjs/testing";
import type {
  ExternalSkillMetadata,
  ProviderSkillReference,
} from "@tambo-ai-cloud/core";
import type { HydraDatabase } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/database-provider";
import { createTestingModule } from "../test/utils/create-testing-module";
import { SkillsService } from "./skills.service";

// Mock provider SDKs
// Note: resetMocks is true in jest config, so mockImplementation must be
// re-applied each test. We use a factory that captures the per-test mock fns.
let mockOpenAISkillsCreate: jest.Mock;
let mockAnthropicSkillsCreate: jest.Mock;

jest.mock("openai", () => {
  return class MockOpenAI {
    skills = {
      create: (...args: unknown[]) => mockOpenAISkillsCreate(...args),
    };
  };
});

jest.mock("@anthropic-ai/sdk", () => {
  return class MockAnthropic {
    beta = {
      skills: {
        create: (...args: unknown[]) => mockAnthropicSkillsCreate(...args),
      },
    };
  };
});

// Mock deleteSkillFromProvider from backend
const mockDeleteSkillFromProvider = jest.fn();
jest.mock("@tambo-ai-cloud/backend", () => ({
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
    },
  };
});

const mockedOperations: { updateSkill: jest.Mock } =
  jest.requireMock("@tambo-ai-cloud/db").operations;

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
    mockOpenAISkillsCreate = jest.fn();
    mockAnthropicSkillsCreate = jest.fn();
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
    it("uploads to OpenAI and returns provider reference", async () => {
      mockOpenAISkillsCreate.mockResolvedValue({
        id: "oai-skill-1",
        latest_version: "v2",
      });

      const { service, module } = await createService();
      try {
        const skill = makeSkill();
        const result = await service.uploadToProvider({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(result.skillId).toBe("oai-skill-1");
        expect(result.version).toBe("v2");
        expect(result.uploadedAt).toBeDefined();
        expect(mockOpenAISkillsCreate).toHaveBeenCalledWith({
          files: [expect.any(File)],
        });
      } finally {
        await module.close();
      }
    });

    it("uploads to Anthropic and returns provider reference", async () => {
      mockAnthropicSkillsCreate.mockResolvedValue({
        id: "ant-skill-1",
        latest_version: "v1",
      });

      const { service, module } = await createService();
      try {
        const skill = makeSkill();
        const result = await service.uploadToProvider({
          skill,
          providerName: "anthropic",
          apiKey: "sk-ant-test",
        });

        expect(result.skillId).toBe("ant-skill-1");
        expect(result.version).toBe("v1");
        expect(mockAnthropicSkillsCreate).toHaveBeenCalledWith({
          display_title: "test-skill",
          files: [expect.any(File)],
        });
      } finally {
        await module.close();
      }
    });

    it("defaults version to '1' when latest_version is absent", async () => {
      mockOpenAISkillsCreate.mockResolvedValue({
        id: "oai-skill-2",
      });

      const { service, module } = await createService();
      try {
        const result = await service.uploadToProvider({
          skill: makeSkill(),
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(result.version).toBe("1");
      } finally {
        await module.close();
      }
    });

    it("throws for unsupported provider", async () => {
      const { service, module } = await createService();
      try {
        await expect(
          service.uploadToProvider({
            skill: makeSkill(),
            providerName: "mistral",
            apiKey: "sk-test",
          }),
        ).rejects.toThrow("Provider mistral does not support skills");
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
        expect(mockOpenAISkillsCreate).not.toHaveBeenCalled();
        expect(mockedOperations.updateSkill).not.toHaveBeenCalled();
      } finally {
        await module.close();
      }
    });

    it("uploads and persists metadata when not present", async () => {
      mockOpenAISkillsCreate.mockResolvedValue({
        id: "oai-new",
        latest_version: "1",
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
        expect(mockedOperations.updateSkill).toHaveBeenCalledWith(mockDb, {
          projectId: "proj-1",
          skillId: "sk-test-1",
          externalSkillMetadata: {
            openai: expect.objectContaining({ skillId: "oai-new" }),
          },
        });
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

      mockOpenAISkillsCreate.mockResolvedValue({
        id: "oai-new",
        latest_version: "1",
      });

      const { service, module } = await createService();
      try {
        await service.ensureSkillUploaded({
          skill,
          providerName: "openai",
          apiKey: "sk-test",
        });

        expect(mockedOperations.updateSkill).toHaveBeenCalledWith(mockDb, {
          projectId: "proj-1",
          skillId: "sk-test-1",
          externalSkillMetadata: {
            anthropic: anthropicMeta,
            openai: expect.objectContaining({ skillId: "oai-new" }),
          },
        });
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

  describe("formatSkillMd", () => {
    it("formats a skill as SKILL.md with frontmatter", async () => {
      const { service, module } = await createService();
      try {
        const skill = makeSkill({
          name: "my-skill",
          description: "Does cool stuff",
          instructions: "Step 1: do the thing\nStep 2: done",
        });

        const result = (service as any).formatSkillMd(skill);

        expect(result).toBe(
          [
            "---",
            "name: my-skill",
            'description: "Does cool stuff"',
            "---",
            "",
            "Step 1: do the thing\nStep 2: done",
          ].join("\n"),
        );
      } finally {
        await module.close();
      }
    });

    it("escapes special characters in description", async () => {
      const { service, module } = await createService();
      try {
        const skill = makeSkill({
          description: 'Has "quotes" and \\ backslashes\nand newlines',
        });

        const result = (service as any).formatSkillMd(skill);

        expect(result).toContain(
          'description: "Has \\"quotes\\" and \\\\ backslashes and newlines"',
        );
      } finally {
        await module.close();
      }
    });
  });
});
