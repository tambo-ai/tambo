import { SkillSheet, readFileAsText } from "./skill-sheet";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock tRPC — store callbacks so tests can trigger onSuccess or onError
const mockMutate = jest.fn();
const mockInvalidate = jest.fn();
let shouldFailWith: { message: string } | null = null;

jest.mock("@/trpc/react", () => ({
  api: {
    skills: {
      create: {
        useMutation: (opts: Record<string, unknown>) => ({
          mutate: (...args: unknown[]) => {
            mockMutate(...args);
            if (shouldFailWith) {
              (opts.onError as (err: { message: string }) => void)?.(
                shouldFailWith,
              );
            } else {
              (opts.onSuccess as () => void)?.();
            }
          },
          isPending: false,
        }),
      },
      update: {
        useMutation: (opts: Record<string, unknown>) => ({
          mutate: (...args: unknown[]) => {
            mockMutate(...args);
            if (shouldFailWith) {
              (opts.onError as (err: { message: string }) => void)?.(
                shouldFailWith,
              );
            } else {
              (opts.onSuccess as () => void)?.();
            }
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

describe("readFileAsText", () => {
  it("reads a file and returns its text content", async () => {
    const file = new File(["hello world"], "test.md", {
      type: "text/markdown",
    });
    const result = await readFileAsText(file);
    expect(result).toBe("hello world");
  });

  it("reads a SKILL.md file with frontmatter", async () => {
    const content = "---\nname: Test\ndescription: A test\n---\nBody";
    const file = new File([content], "SKILL.md", { type: "text/markdown" });
    const result = await readFileAsText(file);
    expect(result).toBe(content);
  });
});

describe("SkillSheet", () => {
  const defaultProps = {
    projectId: "proj_1",
    skill: null,
    isOpen: true,
    onOpenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    shouldFailWith = null;
  });

  it("renders create mode title when skill is null", () => {
    render(<SkillSheet {...defaultProps} skill={null} />);
    expect(screen.getByText("Create Skill")).toBeInTheDocument();
  });

  it("renders edit mode title when skill is provided", () => {
    const skill = {
      id: "sk_1",
      projectId: "proj_1",
      name: "Test Skill",
      description: "A test",
      instructions: "Do stuff",
      enabled: true,
      usageCount: 0,
      externalSkillMetadata: {},
      createdByUserId: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(<SkillSheet {...defaultProps} skill={skill} />);
    expect(screen.getByText("Edit Skill")).toBeInTheDocument();
  });

  it("shows em dash placeholders when textarea is empty", () => {
    render(<SkillSheet {...defaultProps} />);
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBe(2); // Name and Description
  });

  it("save button is disabled when textarea is empty", () => {
    render(<SkillSheet {...defaultProps} />);
    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeDisabled();
  });

  it("parses frontmatter and shows name/description as user types", async () => {
    const user = userEvent.setup();
    render(<SkillSheet {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.paste(
      "---\nname: My Skill\ndescription: A brief description\n---\nBody content",
    );

    expect(screen.getByText("My Skill")).toBeInTheDocument();
    expect(screen.getByText("A brief description")).toBeInTheDocument();
  });

  it("enables save button when valid frontmatter is entered", async () => {
    const user = userEvent.setup();
    render(<SkillSheet {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.paste(
      "---\nname: My Skill\ndescription: A brief description\n---\nBody",
    );

    const saveButton = screen.getByText("Save");
    expect(saveButton).not.toBeDisabled();
  });

  it("shows parse error when frontmatter is invalid", async () => {
    const user = userEvent.setup();
    render(<SkillSheet {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.paste("---\ndescription: only desc\n---\nBody");

    expect(screen.getByText(/Missing 'name'/)).toBeInTheDocument();
  });

  it("uses initialContent when provided", () => {
    const content =
      "---\nname: Imported\ndescription: From file\n---\nImported body";
    render(<SkillSheet {...defaultProps} initialContent={content} />);

    expect(screen.getByText("Imported")).toBeInTheDocument();
    expect(screen.getByText("From file")).toBeInTheDocument();
  });

  it("pre-populates textarea with reconstructed content in edit mode", () => {
    const skill = {
      id: "sk_1",
      projectId: "proj_1",
      name: "Test Skill",
      description: "A test",
      instructions: "Do stuff",
      enabled: true,
      usageCount: 0,
      externalSkillMetadata: {},
      createdByUserId: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(<SkillSheet {...defaultProps} skill={skill} />);

    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    expect(textarea.value).toContain("Test Skill");
    expect(textarea.value).toContain("A test");
    expect(textarea.value).toContain("Do stuff");
  });

  it("has spellCheck disabled on textarea", () => {
    render(<SkillSheet {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("spellcheck", "false");
  });

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<SkillSheet {...defaultProps} />);

    await user.click(screen.getByText("Cancel"));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls create mutation when saving in create mode", async () => {
    const user = userEvent.setup();
    render(<SkillSheet {...defaultProps} skill={null} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.paste(
      "---\nname: New Skill\ndescription: A new one\n---\nBody here",
    );

    await user.click(screen.getByText("Save"));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj_1",
        name: "New Skill",
        description: "A new one",
        instructions: "Body here",
      }),
    );
  });

  it("calls update mutation when saving in edit mode", async () => {
    const user = userEvent.setup();
    const skill = {
      id: "sk_1",
      projectId: "proj_1",
      name: "Existing",
      description: "Desc",
      instructions: "Old body",
      enabled: true,
      usageCount: 0,
      externalSkillMetadata: {},
      createdByUserId: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(<SkillSheet {...defaultProps} skill={skill} />);

    // Clear and type new content
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.paste(
      "---\nname: Updated\ndescription: New desc\n---\nNew body",
    );

    await user.click(screen.getByText("Save"));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj_1",
        skillId: "sk_1",
        name: "Updated",
        description: "New desc",
        instructions: "New body",
      }),
    );
  });

  it("closes sheet and shows toast on successful save", async () => {
    const user = userEvent.setup();
    render(<SkillSheet {...defaultProps} skill={null} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.paste("---\nname: My Skill\ndescription: Desc\n---\nBody");

    await user.click(screen.getByText("Save"));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Skill created" }),
    );
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("does not call mutation when save is clicked with invalid content", async () => {
    const user = userEvent.setup();
    render(<SkillSheet {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.paste("no frontmatter here");

    // Save button should be disabled, but test the handler guard too
    expect(screen.getByText("Save")).toBeDisabled();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows destructive toast when create fails with name conflict", async () => {
    shouldFailWith = {
      message: "A skill with this name already exists in this project",
    };
    const user = userEvent.setup();
    render(<SkillSheet {...defaultProps} skill={null} />);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.paste("---\nname: Duplicate\ndescription: Desc\n---\nBody");

    await user.click(screen.getByText("Save"));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        description: "A skill with this name already exists in this project",
        variant: "destructive",
      }),
    );
    // Sheet should NOT close on error
    expect(defaultProps.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("shows destructive toast when update fails with name conflict", async () => {
    shouldFailWith = {
      message: "A skill with this name already exists in this project",
    };
    const user = userEvent.setup();
    const skill = {
      id: "sk_1",
      projectId: "proj_1",
      name: "Existing",
      description: "Desc",
      instructions: "Old body",
      enabled: true,
      usageCount: 0,
      externalSkillMetadata: {},
      createdByUserId: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    render(<SkillSheet {...defaultProps} skill={skill} />);

    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.paste(
      "---\nname: Taken Name\ndescription: New desc\n---\nNew body",
    );

    await user.click(screen.getByText("Save"));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        description: "A skill with this name already exists in this project",
        variant: "destructive",
      }),
    );
    expect(defaultProps.onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
