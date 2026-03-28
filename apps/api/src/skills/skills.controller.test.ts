import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { ExternalSkillMetadata } from "@tambo-ai-cloud/core";
import { SkillNameConflictError, type HydraDatabase } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/database-provider";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import { ProjectAccessOwnGuard } from "../projects/guards/project-access-own.guard";
import { ProjectsService } from "../projects/projects.service";
import { SkillsController } from "./skills.controller";
import { SkillsService } from "./skills.service";

// Mock DB operations
jest.mock("@tambo-ai-cloud/db", () => {
  const actual = jest.requireActual("@tambo-ai-cloud/db");
  return {
    ...actual,
    operations: {
      createSkill: jest.fn(),
      getSkill: jest.fn(),
      listSkillsForProject: jest.fn(),
      updateSkill: jest.fn(),
      deleteSkill: jest.fn(),
    },
  };
});

const mockedOperations: {
  createSkill: jest.Mock;
  getSkill: jest.Mock;
  listSkillsForProject: jest.Mock;
  updateSkill: jest.Mock;
  deleteSkill: jest.Mock;
} = jest.requireMock("@tambo-ai-cloud/db").operations;

function makeSkill(overrides: Record<string, unknown> = {}) {
  return {
    id: "sk-1",
    projectId: "proj-1",
    name: "my-skill",
    description: "A skill",
    instructions: "Do the thing",
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

describe("SkillsController", () => {
  let controller: SkillsController;
  let module: TestingModule;
  let mockSkillsService: {
    deleteFromProvider: jest.Mock;
  };
  let mockProjectsService: {
    getDecryptedProviderKey: jest.Mock;
  };

  beforeAll(async () => {
    mockSkillsService = {
      deleteFromProvider: jest.fn(),
    };
    mockProjectsService = {
      getDecryptedProviderKey: jest.fn(),
    };

    module = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        { provide: DATABASE, useValue: {} as HydraDatabase },
        { provide: SkillsService, useValue: mockSkillsService },
        { provide: ProjectsService, useValue: mockProjectsService },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BearerTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ProjectAccessOwnGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(SkillsController);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("creates a skill and returns it", async () => {
      const created = makeSkill();
      mockedOperations.createSkill.mockResolvedValue(created);

      const result = await controller.create("proj-1", {
        name: "my-skill",
        description: "A skill",
        instructions: "Do the thing",
      });

      expect(result).toEqual(created);
      expect(mockedOperations.createSkill).toHaveBeenCalledWith(
        expect.anything(),
        {
          projectId: "proj-1",
          name: "my-skill",
          description: "A skill",
          instructions: "Do the thing",
        },
      );
    });

    it("throws ConflictException on duplicate name", async () => {
      mockedOperations.createSkill.mockRejectedValue(
        new SkillNameConflictError("my-skill"),
      );

      await expect(
        controller.create("proj-1", {
          name: "my-skill",
          description: "A skill",
          instructions: "Do the thing",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("list", () => {
    it("returns all skills for a project", async () => {
      const skills = [makeSkill(), makeSkill({ id: "sk-2", name: "other" })];
      mockedOperations.listSkillsForProject.mockResolvedValue(skills);

      const result = await controller.list("proj-1");

      expect(result).toEqual(skills);
      expect(mockedOperations.listSkillsForProject).toHaveBeenCalledWith(
        expect.anything(),
        "proj-1",
      );
    });
  });

  describe("get", () => {
    it("returns a skill by ID", async () => {
      const skill = makeSkill();
      mockedOperations.getSkill.mockResolvedValue(skill);

      const result = await controller.get("proj-1", "sk-1");

      expect(result).toEqual(skill);
    });

    it("throws NotFoundException when skill does not exist", async () => {
      mockedOperations.getSkill.mockResolvedValue(undefined);

      await expect(controller.get("proj-1", "sk-missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("updates a skill and returns it", async () => {
      const updated = makeSkill({ name: "renamed-skill" });
      mockedOperations.updateSkill.mockResolvedValue(updated);

      const result = await controller.update("proj-1", "sk-1", {
        name: "renamed-skill",
      });

      expect(result).toEqual(updated);
    });

    it("invalidates provider metadata when content fields change", async () => {
      mockedOperations.updateSkill.mockResolvedValue(makeSkill());

      await controller.update("proj-1", "sk-1", {
        description: "Updated description",
      });

      expect(mockedOperations.updateSkill).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          externalSkillMetadata: {},
        }),
      );
    });

    it("does not invalidate metadata when only enabled changes", async () => {
      mockedOperations.updateSkill.mockResolvedValue(makeSkill());

      await controller.update("proj-1", "sk-1", {
        enabled: false,
      });

      const callArgs = mockedOperations.updateSkill.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty("externalSkillMetadata");
    });

    it("throws NotFoundException when skill does not exist", async () => {
      mockedOperations.updateSkill.mockResolvedValue(undefined);

      await expect(
        controller.update("proj-1", "sk-missing", { name: "nope" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ConflictException on duplicate name", async () => {
      mockedOperations.updateSkill.mockRejectedValue(
        new SkillNameConflictError("existing-name"),
      );

      await expect(
        controller.update("proj-1", "sk-1", { name: "existing-name" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("delete", () => {
    it("deletes a skill after provider cleanup", async () => {
      const skill = makeSkill({
        externalSkillMetadata: {
          openai: {
            skillId: "oai-123",
            uploadedAt: "2026-01-01T00:00:00Z",
            version: "1",
          },
        },
      });
      mockedOperations.getSkill.mockResolvedValue(skill);
      mockProjectsService.getDecryptedProviderKey.mockResolvedValue(
        "sk-openai-key",
      );

      await controller.delete("proj-1", "sk-1");

      expect(mockSkillsService.deleteFromProvider).toHaveBeenCalledWith({
        skill,
        providerName: "openai",
        apiKey: "sk-openai-key",
      });
      expect(mockedOperations.deleteSkill).toHaveBeenCalledWith(
        expect.anything(),
        "proj-1",
        "sk-1",
      );
    });

    it("skips provider cleanup when no metadata", async () => {
      mockedOperations.getSkill.mockResolvedValue(makeSkill());

      await controller.delete("proj-1", "sk-1");

      expect(mockSkillsService.deleteFromProvider).not.toHaveBeenCalled();
      expect(mockedOperations.deleteSkill).toHaveBeenCalled();
    });

    it("skips provider cleanup when API key not found", async () => {
      const skill = makeSkill({
        externalSkillMetadata: {
          openai: {
            skillId: "oai-123",
            uploadedAt: "2026-01-01T00:00:00Z",
            version: "1",
          },
        },
      });
      mockedOperations.getSkill.mockResolvedValue(skill);
      mockProjectsService.getDecryptedProviderKey.mockResolvedValue(undefined);

      await controller.delete("proj-1", "sk-1");

      expect(mockSkillsService.deleteFromProvider).not.toHaveBeenCalled();
      expect(mockedOperations.deleteSkill).toHaveBeenCalled();
    });

    it("still deletes from DB when provider cleanup fails", async () => {
      const skill = makeSkill({
        externalSkillMetadata: {
          openai: {
            skillId: "oai-123",
            uploadedAt: "2026-01-01T00:00:00Z",
            version: "1",
          },
        },
      });
      mockedOperations.getSkill.mockResolvedValue(skill);
      mockProjectsService.getDecryptedProviderKey.mockRejectedValue(
        new Error("decrypt failed"),
      );

      await controller.delete("proj-1", "sk-1");

      // DB deletion should still happen despite provider cleanup error
      expect(mockedOperations.deleteSkill).toHaveBeenCalledWith(
        expect.anything(),
        "proj-1",
        "sk-1",
      );
    });

    it("throws NotFoundException when skill does not exist", async () => {
      mockedOperations.getSkill.mockResolvedValue(undefined);

      await expect(controller.delete("proj-1", "sk-missing")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("cleans up multiple providers", async () => {
      const skill = makeSkill({
        externalSkillMetadata: {
          openai: {
            skillId: "oai-123",
            uploadedAt: "2026-01-01T00:00:00Z",
            version: "1",
          },
          anthropic: {
            skillId: "ant-456",
            uploadedAt: "2026-01-01T00:00:00Z",
            version: "1",
          },
        },
      });
      mockedOperations.getSkill.mockResolvedValue(skill);
      mockProjectsService.getDecryptedProviderKey
        .mockResolvedValueOnce("sk-openai-key")
        .mockResolvedValueOnce("sk-anthropic-key");

      await controller.delete("proj-1", "sk-1");

      expect(mockSkillsService.deleteFromProvider).toHaveBeenCalledTimes(2);
      expect(mockedOperations.deleteSkill).toHaveBeenCalled();
    });
  });
});
