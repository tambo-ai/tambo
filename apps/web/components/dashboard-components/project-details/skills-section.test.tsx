import { SkillsSection } from "./skills-section";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock tRPC
const mockMutate = jest.fn();
const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
const mockInvalidate = jest.fn();
let mockSkillsData: unknown[] = [];
let mockIsLoading = false;
let mockIsError = false;

jest.mock("@/trpc/react", () => ({
  api: {
    project: {
      removeMultipleProjects: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
    },
    skills: {
      list: {
        useQuery: () => ({
          data: mockSkillsData,
          isLoading: mockIsLoading,
          isError: mockIsError,
        }),
      },
      create: {
        useMutation: (opts: Record<string, unknown>) => ({
          mutate: (...args: unknown[]) => {
            mockMutate("create", ...args);
            (opts.onSuccess as () => void)?.();
          },
          isPending: false,
        }),
      },
      update: {
        useMutation: (_opts: Record<string, unknown>) => ({
          mutate: (...args: unknown[]) => {
            mockMutate("update", ...args);
          },
          isPending: false,
        }),
      },
      delete: {
        useMutation: (opts: Record<string, unknown>) => ({
          mutate: mockMutate,
          mutateAsync: async (...args: unknown[]) => {
            mockMutateAsync(...args);
            (opts.onSuccess as () => void)?.();
          },
          isPending: false,
        }),
      },
    },
    useUtils: () => ({
      skills: {
        list: { invalidate: mockInvalidate },
      },
    }),
  },
}));

// Mock toast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Only mock readFileAsText (FileReader is unreliable in jsdom).
// Everything else — SkillSheet, validateSkillFile, getDragState — is real.
jest.mock("./skill-sheet", () => {
  const actual = jest.requireActual("./skill-sheet");
  return {
    ...actual,
    readFileAsText: jest.fn(),
  };
});

const mockReadFileAsText = jest.requireMock("./skill-sheet")
  .readFileAsText as jest.Mock;

const sampleSkill = {
  id: "sk_1",
  projectId: "proj_1",
  name: "My Skill",
  description: "A skill that does things",
  instructions: "Do stuff",
  enabled: true,
  usageCount: 0,
  externalSkillMetadata: {},
  createdByUserId: null,
  lastUsedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("SkillsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSkillsData = [];
    mockIsLoading = false;
    mockIsError = false;
  });

  describe("empty state", () => {
    it("shows empty state when there are no skills", () => {
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText("No Skills Yet")).toBeInTheDocument();
      expect(screen.getByText(/Create your first skill/)).toBeInTheDocument();
    });

    it("has Create Skill buttons in header and empty state", () => {
      render(<SkillsSection projectId="proj_1" />);

      const createButtons = screen.getAllByText("Create Skill");
      expect(createButtons.length).toBe(2);
    });

    it("has an Import SKILL.md button in the empty state", () => {
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText("Import SKILL.md")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows skeleton when loading", () => {
      mockIsLoading = true;
      const { container } = render(<SkillsSection projectId="proj_1" />);

      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("shows error message when query fails", () => {
      mockIsError = true;
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText(/Failed to load skills/)).toBeInTheDocument();
    });
  });

  describe("skill list", () => {
    it("renders skill cards when skills exist", () => {
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText("My Skill")).toBeInTheDocument();
      expect(screen.getByText("A skill that does things")).toBeInTheDocument();
    });

    it("renders multiple skills", () => {
      mockSkillsData = [
        sampleSkill,
        { ...sampleSkill, id: "sk_2", name: "Second Skill" },
      ];
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText("My Skill")).toBeInTheDocument();
      expect(screen.getByText("Second Skill")).toBeInTheDocument();
    });
  });

  describe("create skill", () => {
    it("opens the sheet when Create Skill header button is clicked", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getAllByText("Create Skill")[0]);

      // The real SkillSheet renders "Create Skill" as the sheet title
      // and shows a textarea with the placeholder
      expect(screen.getByPlaceholderText(/name: My Skill/)).toBeInTheDocument();
    });
  });

  describe("edit skill", () => {
    it("opens the sheet in edit mode when edit button is clicked", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByLabelText("Edit skill My Skill"));

      // The real SkillSheet renders "Edit Skill" as title and pre-fills
      // the textarea with reconstructed content
      const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
      expect(textarea.value).toContain("My Skill");
      expect(textarea.value).toContain("Do stuff");
    });
  });

  describe("delete skill", () => {
    it("shows delete confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByLabelText("Delete skill My Skill"));

      expect(screen.getByText('Delete "My Skill"?')).toBeInTheDocument();
      expect(screen.getByText(/permanently removed/)).toBeInTheDocument();
    });
  });

  describe("toggle skill", () => {
    it("calls update mutation when toggle is clicked", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByLabelText("Disable skill My Skill"));

      expect(mockMutate).toHaveBeenCalledWith(
        "update",
        expect.objectContaining({
          projectId: "proj_1",
          skillId: "sk_1",
          enabled: false,
        }),
      );
    });
  });

  describe("delete confirm flow", () => {
    it("calls mutateAsync when delete is confirmed", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByLabelText("Delete skill My Skill"));
      expect(screen.getByText('Delete "My Skill"?')).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", { name: /^delete$/i });
      await user.click(confirmButton);

      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "proj_1",
          skillId: "sk_1",
        }),
      );
    });
  });

  describe("provider compatibility notice", () => {
    it("shows notice when provider is not supported", () => {
      render(
        <SkillsSection projectId="proj_1" defaultLlmProviderName="groq" />,
      );

      expect(
        screen.getByText(
          /Skills are currently supported with OpenAI and Anthropic/,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(/groq/)).toBeInTheDocument();
    });

    it("does not show notice for openai provider", () => {
      render(
        <SkillsSection projectId="proj_1" defaultLlmProviderName="openai" />,
      );

      expect(
        screen.queryByText(/Skills are currently supported/),
      ).not.toBeInTheDocument();
    });

    it("does not show notice for anthropic provider", () => {
      render(
        <SkillsSection projectId="proj_1" defaultLlmProviderName="anthropic" />,
      );

      expect(
        screen.queryByText(/Skills are currently supported/),
      ).not.toBeInTheDocument();
    });

    it("does not show notice when provider is not set", () => {
      render(<SkillsSection projectId="proj_1" />);

      expect(
        screen.queryByText(/Skills are currently supported/),
      ).not.toBeInTheDocument();
    });
  });

  describe("file import", () => {
    it("opens create sheet when importing a file with invalid frontmatter", async () => {
      const user = userEvent.setup();
      const invalidContent = "just some text without frontmatter";
      mockReadFileAsText.mockResolvedValue(invalidContent);
      render(<SkillsSection projectId="proj_1" />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File([invalidContent], "SKILL.md", {
        type: "text/markdown",
      });

      await user.upload(fileInput, file);

      // The real SkillSheet opens with the content in the textarea
      await waitFor(() => {
        const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
        expect(textarea.value).toBe(invalidContent);
      });
    });

    it("opens create sheet with file content when importing a new skill", async () => {
      const user = userEvent.setup();
      const content = "---\nname: New Skill\ndescription: Imported\n---\nBody";
      mockReadFileAsText.mockResolvedValue(content);
      render(<SkillsSection projectId="proj_1" />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File([content], "SKILL.md", {
        type: "text/markdown",
      });

      await user.upload(fileInput, file);

      // The real SkillSheet parses frontmatter and shows the name
      await waitFor(() => {
        expect(screen.getByText("New Skill")).toBeInTheDocument();
        expect(screen.getByText("Imported")).toBeInTheDocument();
      });
    });

    it("shows overwrite dialog when importing a skill with an existing name", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      const importedContent =
        "---\nname: My Skill\ndescription: Updated\n---\nNew body";
      mockReadFileAsText.mockResolvedValue(importedContent);
      render(<SkillsSection projectId="proj_1" />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File([importedContent], "SKILL.md", {
        type: "text/markdown",
      });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(
          screen.getByText("Overwrite existing skill?"),
        ).toBeInTheDocument();
      });
    });

    it("opens edit sheet with imported content when overwrite is confirmed", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      const importedContent =
        "---\nname: My Skill\ndescription: Updated\n---\nNew body";
      mockReadFileAsText.mockResolvedValue(importedContent);
      render(<SkillsSection projectId="proj_1" />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File([importedContent], "SKILL.md", {
        type: "text/markdown",
      });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(
          screen.getByText("Overwrite existing skill?"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByText("Overwrite"));

      // The real SkillSheet opens in edit mode with the imported content
      await waitFor(() => {
        expect(screen.getByText("Edit Skill")).toBeInTheDocument();
        const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
        expect(textarea.value).toBe(importedContent);
      });
    });

    it("does nothing when overwrite is cancelled", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      mockReadFileAsText.mockResolvedValue(
        "---\nname: My Skill\ndescription: Updated\n---\nNew body",
      );
      render(<SkillsSection projectId="proj_1" />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File(
        ["---\nname: My Skill\ndescription: Updated\n---\nNew body"],
        "SKILL.md",
        { type: "text/markdown" },
      );

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(
          screen.getByText("Overwrite existing skill?"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(
          screen.queryByText("Overwrite existing skill?"),
        ).not.toBeInTheDocument();
      });
      // No textarea visible — sheet did not open
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("warns but allows files not named SKILL.md", async () => {
      const user = userEvent.setup();
      const content = "---\nname: Custom\ndescription: Desc\n---\nBody";
      mockReadFileAsText.mockResolvedValue(content);
      render(<SkillsSection projectId="proj_1" />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File([content], "my-custom-skill.md", {
        type: "text/markdown",
      });

      await user.upload(fileInput, file);

      // Warning toast shown
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Note",
          description: expect.stringContaining("my-custom-skill.md"),
        }),
      );

      // But the sheet still opens with the content
      await waitFor(() => {
        expect(screen.getByText("Custom")).toBeInTheDocument();
      });
    });
  });

  describe("header buttons", () => {
    it("shows Import and Create Skill buttons in the header", () => {
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText("Import")).toBeInTheDocument();
      expect(screen.getByText("Create Skill")).toBeInTheDocument();
    });
  });
});
