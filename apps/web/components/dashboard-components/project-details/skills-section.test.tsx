import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { SkillsSection } from "./skills-section";

// Mock the Tambo React hooks and EditWithTamboButton
jest.mock("@tambo-ai/react", () => ({
  withTamboInteractable: (Component: React.ComponentType) => Component,
}));

jest.mock("@/components/ui/tambo/edit-with-tambo-button", () => ({
  EditWithTamboButton: () => null,
}));

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
// Everything else -- SkillForm, validateSkillFile, getDragState -- is real.
jest.mock("./skill-form", () => {
  const actual = jest.requireActual("./skill-form");
  return {
    ...actual,
    readFileAsText: jest.fn(),
  };
});

const mockReadFileAsText = jest.requireMock("./skill-form")
  .readFileAsText as jest.Mock;

const sampleSkill = {
  id: "sk_1",
  projectId: "proj_1",
  name: "my-skill",
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

    it("has a Create Skill button in header", () => {
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText("Create Skill")).toBeInTheDocument();
    });

    it("has an Import button in the header", () => {
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText("Import")).toBeInTheDocument();
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

      expect(screen.getByText("my-skill")).toBeInTheDocument();
      expect(screen.getByText("A skill that does things")).toBeInTheDocument();
    });

    it("renders multiple skills", () => {
      mockSkillsData = [
        sampleSkill,
        { ...sampleSkill, id: "sk_2", name: "second-skill" },
      ];
      render(<SkillsSection projectId="proj_1" />);

      expect(screen.getByText("my-skill")).toBeInTheDocument();
      expect(screen.getByText("second-skill")).toBeInTheDocument();
    });
  });

  describe("create skill", () => {
    it("shows inline form when Create Skill button is clicked", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByText("Create Skill"));

      // The inline form shows three separate fields
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Description")).toBeInTheDocument();
      expect(screen.getByLabelText("Instructions")).toBeInTheDocument();
    });

    it("hides skill list and header buttons when form is open", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByText("Create Skill"));

      // Header buttons should be hidden
      expect(screen.queryByText("Import")).not.toBeInTheDocument();
      // Skill cards should be hidden
      expect(
        screen.queryByLabelText("Edit skill my-skill"),
      ).not.toBeInTheDocument();
    });
  });

  describe("edit skill", () => {
    it("shows inline form with pre-populated fields when edit is clicked", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByLabelText("Edit skill my-skill"));

      // Form shows with skill data pre-populated
      expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(
        "my-skill",
      );
      expect(
        screen.getByLabelText<HTMLTextAreaElement>("Instructions").value,
      ).toBe("Do stuff");
    });
  });

  describe("delete skill", () => {
    it("shows delete confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByLabelText("Delete skill my-skill"));

      expect(screen.getByText('Delete "my-skill"?')).toBeInTheDocument();
      expect(screen.getByText(/permanently removed/)).toBeInTheDocument();
    });
  });

  describe("toggle skill", () => {
    it("calls update mutation when toggle is clicked", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      render(<SkillsSection projectId="proj_1" />);

      await user.click(screen.getByLabelText("Disable skill my-skill"));

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

      await user.click(screen.getByLabelText("Delete skill my-skill"));
      expect(screen.getByText('Delete "my-skill"?')).toBeInTheDocument();

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
    it("opens form with instructions field when importing a file with invalid frontmatter", async () => {
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

      // The inline form opens with the content in the instructions field
      await waitFor(() => {
        const instrField =
          screen.getByLabelText<HTMLTextAreaElement>("Instructions");
        expect(instrField.value).toBe(invalidContent);
      });
    });

    it("opens form with parsed fields when importing a valid skill", async () => {
      const user = userEvent.setup();
      const content =
        "---\nname: new-skill\ndescription: Imported desc\n---\nBody";
      mockReadFileAsText.mockResolvedValue(content);
      render(<SkillsSection projectId="proj_1" />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File([content], "SKILL.md", {
        type: "text/markdown",
      });

      await user.upload(fileInput, file);

      // The inline form shows with parsed fields
      await waitFor(() => {
        expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(
          "new-skill",
        );
        expect(
          screen.getByLabelText<HTMLInputElement>("Description").value,
        ).toBe("Imported desc");
        expect(
          screen.getByLabelText<HTMLTextAreaElement>("Instructions").value,
        ).toBe("Body");
      });
    });

    it("shows overwrite dialog when importing a skill with an existing name", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      const importedContent =
        "---\nname: my-skill\ndescription: Updated\n---\nNew body";
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

    it("opens edit form with imported fields when overwrite is confirmed", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      const importedContent =
        "---\nname: my-skill\ndescription: Updated\n---\nNew body";
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

      // The form opens in edit mode with imported fields
      await waitFor(() => {
        expect(screen.getByText("Edit Skill")).toBeInTheDocument();
        expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(
          "my-skill",
        );
        expect(
          screen.getByLabelText<HTMLInputElement>("Description").value,
        ).toBe("Updated");
      });
    });

    it("does nothing when overwrite is cancelled", async () => {
      const user = userEvent.setup();
      mockSkillsData = [sampleSkill];
      mockReadFileAsText.mockResolvedValue(
        "---\nname: my-skill\ndescription: Updated\n---\nNew body",
      );
      render(<SkillsSection projectId="proj_1" />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File(
        ["---\nname: my-skill\ndescription: Updated\n---\nNew body"],
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
      // No form fields visible -- form did not open
      expect(screen.queryByLabelText("Instructions")).not.toBeInTheDocument();
    });

    it("warns but allows files not named SKILL.md", async () => {
      const user = userEvent.setup();
      const content = "---\nname: custom-skill\ndescription: Desc\n---\nBody";
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

      // Form opens with parsed fields
      await waitFor(() => {
        expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(
          "custom-skill",
        );
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
