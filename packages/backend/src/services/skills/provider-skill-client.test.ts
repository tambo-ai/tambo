import {
  deleteSkillFromProvider,
  uploadSkillToProvider,
  updateSkillOnProvider,
  formatSkillMd,
  providerSupportsSkills,
} from "./provider-skill-client";

// Mock the OpenAI SDK
jest.mock("openai", () => {
  const mockDeleteSkill = jest.fn().mockResolvedValue({});
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      skills: { delete: mockDeleteSkill },
    })),
    __mockDeleteSkill: mockDeleteSkill,
  };
});

// Mock the Anthropic SDK
jest.mock("@anthropic-ai/sdk", () => {
  // Defined inside the factory so it's available when jest.mock is hoisted
  class MockAPIError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "APIError";
    }
  }

  const mockCreate = jest.fn().mockResolvedValue({
    id: "sk-new-123",
    latest_version: "v1",
  });
  const mockList = jest.fn();
  const mockVersionsCreate = jest.fn().mockResolvedValue({
    id: "skv_new",
    skill_id: "sk-anthropic-existing",
    version: "1234567890",
  });
  const mockVersionsList = jest.fn();
  const mockVersionsDelete = jest.fn().mockResolvedValue({});
  const mockDeleteSkill = jest.fn().mockResolvedValue({});
  return {
    __esModule: true,
    default: Object.assign(
      jest.fn().mockImplementation(() => ({
        beta: {
          skills: {
            create: mockCreate,
            list: mockList,
            delete: mockDeleteSkill,
            versions: {
              create: mockVersionsCreate,
              list: mockVersionsList,
              delete: mockVersionsDelete,
            },
          },
        },
      })),
      { APIError: MockAPIError },
    ),
    __MockAPIError: MockAPIError,
    __mockCreate: mockCreate,
    __mockList: mockList,
    __mockDeleteSkill: mockDeleteSkill,
    __mockVersionsCreate: mockVersionsCreate,
    __mockVersionsList: mockVersionsList,
    __mockVersionsDelete: mockVersionsDelete,
  };
});

const OpenAI = jest.requireMock("openai").default as jest.Mock;
const openaiMockDelete = jest.requireMock("openai")
  .__mockDeleteSkill as jest.Mock;
const Anthropic = jest.requireMock("@anthropic-ai/sdk").default as jest.Mock;
const anthropicMockDelete = jest.requireMock("@anthropic-ai/sdk")
  .__mockDeleteSkill as jest.Mock;
const anthropicMockCreate = jest.requireMock("@anthropic-ai/sdk")
  .__mockCreate as jest.Mock;
const anthropicMockList = jest.requireMock("@anthropic-ai/sdk")
  .__mockList as jest.Mock;
const anthropicMockVersionsList = jest.requireMock("@anthropic-ai/sdk")
  .__mockVersionsList as jest.Mock;
const anthropicMockVersionsDelete = jest.requireMock("@anthropic-ai/sdk")
  .__mockVersionsDelete as jest.Mock;
const MockAPIError = jest.requireMock("@anthropic-ai/sdk")
  .__MockAPIError as new (status: number, message: string) => Error;

describe("deleteSkillFromProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes a skill from OpenAI", async () => {
    await deleteSkillFromProvider({
      skillId: "sk-openai-123",
      providerName: "openai",
      apiKey: "test-openai-key",
    });

    expect(OpenAI).toHaveBeenCalledWith({ apiKey: "test-openai-key" });
    expect(openaiMockDelete).toHaveBeenCalledWith("sk-openai-123");
  });

  it("deletes versions then skill from Anthropic", async () => {
    anthropicMockVersionsList.mockReturnValueOnce(
      (async function* () {
        yield { version: "v-1", skill_id: "sk-anthropic-456" };
      })(),
    );

    await deleteSkillFromProvider({
      skillId: "sk-anthropic-456",
      providerName: "anthropic",
      apiKey: "test-anthropic-key",
    });

    expect(Anthropic).toHaveBeenCalledWith({ apiKey: "test-anthropic-key" });
    expect(anthropicMockVersionsDelete).toHaveBeenCalledWith("v-1", {
      skill_id: "sk-anthropic-456",
    });
    expect(anthropicMockDelete).toHaveBeenCalledWith("sk-anthropic-456");
  });

  it("throws for unsupported provider", async () => {
    await expect(
      deleteSkillFromProvider({
        skillId: "sk-999",
        providerName: "mistral",
        apiKey: "test-key",
      }),
    ).rejects.toThrow("Provider mistral does not support skill deletion");
  });

  it("propagates SDK errors", async () => {
    openaiMockDelete.mockRejectedValueOnce(new Error("API rate limited"));

    await expect(
      deleteSkillFromProvider({
        skillId: "sk-fail",
        providerName: "openai",
        apiKey: "test-key",
      }),
    ).rejects.toThrow("API rate limited");
  });
});

describe("uploadSkillToProvider (create)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a new skill on Anthropic", async () => {
    const result = await uploadSkillToProvider({
      skill: {
        name: "my-skill",
        description: "A skill",
        instructions: "Do stuff",
        projectId: "proj-1",
      },
      providerName: "anthropic",
      apiKey: "test-key",
    });

    expect(anthropicMockCreate).toHaveBeenCalledWith({
      display_title: "proj-1/my-skill",
      files: [expect.any(File)],
    });
    expect(result.skillId).toBe("sk-new-123");
    expect(result.version).toBe("v1");
  });

  it("deletes orphaned skill (with versions) and retries on duplicate title", async () => {
    // First create call fails with duplicate title
    anthropicMockCreate.mockRejectedValueOnce(
      new MockAPIError(
        400,
        "Skill cannot reuse an existing display_title: proj-1/my-skill",
      ),
    );

    // list() returns an async iterable with the orphaned skill
    anthropicMockList.mockReturnValueOnce(
      (async function* () {
        yield { id: "sk-orphaned", display_title: "proj-1/my-skill" };
      })(),
    );

    // versions.list() returns versions that must be deleted first
    anthropicMockVersionsList.mockReturnValueOnce(
      (async function* () {
        yield { version: "v-old-1", skill_id: "sk-orphaned" };
        yield { version: "v-old-2", skill_id: "sk-orphaned" };
      })(),
    );

    // Second create call succeeds
    anthropicMockCreate.mockResolvedValueOnce({
      id: "sk-fresh",
      latest_version: "v1",
    });

    const result = await uploadSkillToProvider({
      skill: {
        name: "my-skill",
        description: "A skill",
        instructions: "Do stuff",
        projectId: "proj-1",
      },
      providerName: "anthropic",
      apiKey: "test-key",
    });

    // Should have deleted versions, then the orphan, then retried create
    expect(anthropicMockVersionsDelete).toHaveBeenCalledWith("v-old-1", {
      skill_id: "sk-orphaned",
    });
    expect(anthropicMockVersionsDelete).toHaveBeenCalledWith("v-old-2", {
      skill_id: "sk-orphaned",
    });
    expect(anthropicMockDelete).toHaveBeenCalledWith("sk-orphaned");
    expect(anthropicMockCreate).toHaveBeenCalledTimes(2);
    expect(result.skillId).toBe("sk-fresh");
  });

  it("throws non-duplicate errors without retry", async () => {
    anthropicMockCreate.mockRejectedValueOnce(
      new Error("Internal server error"),
    );

    await expect(
      uploadSkillToProvider({
        skill: {
          name: "my-skill",
          description: "A skill",
          instructions: "Do stuff",
        },
        providerName: "anthropic",
        apiKey: "test-key",
      }),
    ).rejects.toThrow("Internal server error");

    expect(anthropicMockList).not.toHaveBeenCalled();
    expect(anthropicMockDelete).not.toHaveBeenCalled();
  });

  it("throws for unsupported provider", async () => {
    await expect(
      uploadSkillToProvider({
        skill: {
          name: "test",
          description: "test",
          instructions: "test",
        },
        providerName: "mistral",
        apiKey: "test-key",
      }),
    ).rejects.toThrow("Provider mistral does not support skills");
  });
});

describe("updateSkillOnProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes old Anthropic skill and creates a fresh one", async () => {
    // versions.list returns one version that must be deleted first
    anthropicMockVersionsList.mockReturnValueOnce(
      (async function* () {
        yield { version: "v-existing", skill_id: "sk-anthropic-existing" };
      })(),
    );

    const result = await updateSkillOnProvider({
      skill: {
        name: "my-skill",
        description: "Updated description",
        instructions: "New instructions",
        projectId: "proj-1",
      },
      providerName: "anthropic",
      apiKey: "test-anthropic-key",
      existingRef: {
        skillId: "sk-anthropic-existing",
        uploadedAt: "2024-01-01T00:00:00.000Z",
        version: "old-version",
      },
    });

    // Should delete versions, then the skill, then create a new one
    expect(anthropicMockVersionsDelete).toHaveBeenCalledWith("v-existing", {
      skill_id: "sk-anthropic-existing",
    });
    expect(anthropicMockDelete).toHaveBeenCalledWith("sk-anthropic-existing");
    expect(anthropicMockCreate).toHaveBeenCalledWith({
      display_title: "proj-1/my-skill",
      files: [expect.any(File)],
    });
    expect(result.skillId).toBe("sk-new-123");
    expect(result.version).toBe("v1");
  });

  it("throws for unsupported provider", async () => {
    await expect(
      updateSkillOnProvider({
        skill: {
          name: "test",
          description: "test",
          instructions: "test",
        },
        providerName: "mistral",
        apiKey: "test-key",
        existingRef: {
          skillId: "sk-999",
          uploadedAt: "2024-01-01T00:00:00.000Z",
          version: "1",
        },
      }),
    ).rejects.toThrow("Provider mistral does not support skills");
  });
});

describe("providerSupportsSkills", () => {
  it("returns true for openai and anthropic", () => {
    expect(providerSupportsSkills("openai")).toBe(true);
    expect(providerSupportsSkills("anthropic")).toBe(true);
  });

  it("returns false for unsupported providers", () => {
    expect(providerSupportsSkills("mistral")).toBe(false);
    expect(providerSupportsSkills("groq")).toBe(false);
  });
});

describe("formatSkillMd", () => {
  it("formats a skill as SKILL.md with frontmatter", () => {
    const result = formatSkillMd({
      name: "my-skill",
      description: "Does cool stuff",
      instructions: "Step 1: do the thing\nStep 2: done",
    });

    expect(result).toBe(
      [
        "---",
        'name: "my-skill"',
        'description: "Does cool stuff"',
        "---",
        "",
        "Step 1: do the thing\nStep 2: done",
      ].join("\n"),
    );
  });

  it("escapes special characters in description", () => {
    const result = formatSkillMd({
      name: "test",
      description: 'Has "quotes" and \\ backslashes\nand newlines',
      instructions: "test",
    });

    expect(result).toContain(
      'description: "Has \\"quotes\\" and \\\\ backslashes and newlines"',
    );
  });
});
