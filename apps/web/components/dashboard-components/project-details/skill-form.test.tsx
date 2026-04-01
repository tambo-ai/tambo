import { SkillForm, readFileAsText } from "./skill-form";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock tRPC -- store callbacks so tests can trigger onSuccess or onError
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

describe("SkillForm", () => {
  const defaultProps = {
    projectId: "proj_1",
    skill: null,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    shouldFailWith = null;
  });

  it("renders create mode heading when skill is null", () => {
    render(<SkillForm {...defaultProps} skill={null} />);
    expect(screen.getByText("Create Skill")).toBeInTheDocument();
  });

  it("renders edit mode heading when skill is provided", () => {
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
    render(<SkillForm {...defaultProps} skill={skill} />);
    expect(screen.getByText("Edit Skill")).toBeInTheDocument();
  });

  it("shows three separate fields: Name, Description, Instructions", () => {
    render(<SkillForm {...defaultProps} />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Instructions")).toBeInTheDocument();
  });

  it("create button is disabled when name and description are empty", () => {
    render(<SkillForm {...defaultProps} />);
    const saveButton = screen.getByText("Create skill");
    expect(saveButton).toBeDisabled();
  });

  it("enables create button when name and description are filled", async () => {
    const user = userEvent.setup();
    render(<SkillForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Name"), "My Skill");
    await user.type(
      screen.getByLabelText("Description"),
      "A brief description",
    );

    const saveButton = screen.getByText("Create skill");
    expect(saveButton).not.toBeDisabled();
  });

  it("pre-populates fields from initialFields", () => {
    render(
      <SkillForm
        {...defaultProps}
        initialFields={{
          name: "Imported",
          description: "From file",
          instructions: "Imported body",
        }}
      />,
    );

    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(
      "Imported",
    );
    expect(screen.getByLabelText<HTMLInputElement>("Description").value).toBe(
      "From file",
    );
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Instructions").value,
    ).toBe("Imported body");
  });

  it("pre-populates fields from skill in edit mode", () => {
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
    render(<SkillForm {...defaultProps} skill={skill} />);

    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(
      "Test Skill",
    );
    expect(screen.getByLabelText<HTMLInputElement>("Description").value).toBe(
      "A test",
    );
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Instructions").value,
    ).toBe("Do stuff");
  });

  it("has spellCheck disabled on instructions textarea", () => {
    render(<SkillForm {...defaultProps} />);
    expect(screen.getByLabelText("Instructions")).toHaveAttribute(
      "spellcheck",
      "false",
    );
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<SkillForm {...defaultProps} />);

    await user.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls create mutation with separate fields when saving in create mode", async () => {
    const user = userEvent.setup();
    render(<SkillForm {...defaultProps} skill={null} />);

    await user.type(screen.getByLabelText("Name"), "New Skill");
    await user.type(screen.getByLabelText("Description"), "A new one");
    await user.type(screen.getByLabelText("Instructions"), "Body here");

    await user.click(screen.getByText("Create skill"));

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
    render(<SkillForm {...defaultProps} skill={skill} />);

    // Clear and type new values
    const nameInput = screen.getByLabelText("Name");
    const descInput = screen.getByLabelText("Description");
    const instrInput = screen.getByLabelText("Instructions");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated");
    await user.clear(descInput);
    await user.type(descInput, "New desc");
    await user.clear(instrInput);
    await user.type(instrInput, "New body");

    await user.click(screen.getByText("Save changes"));

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

  it("closes form and shows toast on successful save", async () => {
    const user = userEvent.setup();
    render(<SkillForm {...defaultProps} skill={null} />);

    await user.type(screen.getByLabelText("Name"), "My Skill");
    await user.type(screen.getByLabelText("Description"), "Desc");

    await user.click(screen.getByText("Create skill"));

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Skill created" }),
    );
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("does not call mutation when name is empty", async () => {
    const user = userEvent.setup();
    render(<SkillForm {...defaultProps} />);

    await user.type(screen.getByLabelText("Description"), "some desc");

    expect(screen.getByText("Create skill")).toBeDisabled();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows destructive toast when create fails", async () => {
    shouldFailWith = {
      message: "A skill with this name already exists in this project",
    };
    const user = userEvent.setup();
    render(<SkillForm {...defaultProps} skill={null} />);

    await user.type(screen.getByLabelText("Name"), "Duplicate");
    await user.type(screen.getByLabelText("Description"), "Desc");

    await user.click(screen.getByText("Create skill"));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        description: "A skill with this name already exists in this project",
        variant: "destructive",
      }),
    );
    // Form should NOT close on error
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("parses frontmatter when pasting into the Name field", () => {
    render(<SkillForm {...defaultProps} />);

    const nameInput = screen.getByLabelText("Name");
    fireEvent.paste(nameInput, {
      clipboardData: {
        getData: () =>
          "---\nname: ABC\ndescription: This is a simple skill\n---\nLLM do this thing.",
      },
    });

    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe("ABC");
    expect(screen.getByLabelText<HTMLInputElement>("Description").value).toBe(
      "This is a simple skill",
    );
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Instructions").value,
    ).toBe("LLM do this thing.");
  });

  it("parses frontmatter when pasting into the Instructions field", () => {
    render(<SkillForm {...defaultProps} />);

    const instrInput = screen.getByLabelText("Instructions");
    fireEvent.paste(instrInput, {
      clipboardData: {
        getData: () =>
          "---\nname: FromInstructions\ndescription: Pasted here\n---\nBody text.",
      },
    });

    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(
      "FromInstructions",
    );
    expect(screen.getByLabelText<HTMLInputElement>("Description").value).toBe(
      "Pasted here",
    );
    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Instructions").value,
    ).toBe("Body text.");
  });

  it("does not intercept paste when content has no frontmatter", async () => {
    const user = userEvent.setup();
    render(<SkillForm {...defaultProps} />);

    const nameInput = screen.getByLabelText("Name");
    await user.click(nameInput);
    await user.paste("just plain text");

    expect(screen.getByLabelText<HTMLInputElement>("Name").value).toBe(
      "just plain text",
    );
    expect(screen.getByLabelText<HTMLInputElement>("Description").value).toBe(
      "",
    );
  });

  it("shows destructive toast when update fails", async () => {
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
    render(<SkillForm {...defaultProps} skill={skill} />);

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Taken Name");

    await user.click(screen.getByText("Save changes"));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        description: "A skill with this name already exists in this project",
        variant: "destructive",
      }),
    );
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});
