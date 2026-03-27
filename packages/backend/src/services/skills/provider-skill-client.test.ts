import { deleteSkillFromProvider } from "./provider-skill-client";

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
  const mockDeleteSkill = jest.fn().mockResolvedValue({});
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      beta: { skills: { delete: mockDeleteSkill } },
    })),
    __mockDeleteSkill: mockDeleteSkill,
  };
});

const OpenAI = jest.requireMock("openai").default as jest.Mock;
const openaiMockDelete = jest.requireMock("openai")
  .__mockDeleteSkill as jest.Mock;
const Anthropic = jest.requireMock("@anthropic-ai/sdk").default as jest.Mock;
const anthropicMockDelete = jest.requireMock("@anthropic-ai/sdk")
  .__mockDeleteSkill as jest.Mock;

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

  it("deletes a skill from Anthropic", async () => {
    await deleteSkillFromProvider({
      skillId: "sk-anthropic-456",
      providerName: "anthropic",
      apiKey: "test-anthropic-key",
    });

    expect(Anthropic).toHaveBeenCalledWith({ apiKey: "test-anthropic-key" });
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
