import { ToolCallLimitEditor } from "@/components/dashboard-components/project-details/tool-call-limit-editor";
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mock toast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock tRPC api mutation
const mutateAsyncMock = jest.fn();
jest.mock("@/trpc/react", () => ({
  api: {
    project: {
      updateProject: {
        useMutation: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
      },
    },
  },
}));

function renderEditor(
  overrides?: Partial<React.ComponentProps<typeof ToolCallLimitEditor>>,
) {
  const onEdited = jest.fn();
  const props = {
    project: { id: "proj_1", maxToolCallLimit: 3 },
    onEdited,
    ...overrides,
  } as unknown as React.ComponentProps<typeof ToolCallLimitEditor>;
  const view = render(<ToolCallLimitEditor {...props} />);
  return { onEdited, ...view };
}

describe("ToolCallLimitEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders current limit and toggles to edit mode", async () => {
    const user = userEvent.setup();
    renderEditor();

    expect(screen.getByText(/current limit/i)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    const input =
      await screen.findByLabelText<HTMLInputElement>(/maximum tool calls/i);
    expect(input.value).toBe("3");
  });

  it("shows error and does not submit on invalid value", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const input = await screen.findByLabelText(/maximum tool calls/i);
    await user.clear(input);
    await user.type(input, "0");

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(mockToast).toHaveBeenCalled();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits valid value and calls onEdited, then exits edit mode", async () => {
    const user = userEvent.setup();
    const { onEdited } = renderEditor();

    mutateAsyncMock.mockResolvedValueOnce(undefined);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const input = await screen.findByLabelText(/maximum tool calls/i);
    await user.clear(input);
    await user.type(input, "9");

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      projectId: "proj_1",
      maxToolCallLimit: 9,
    });
    expect(onEdited).toHaveBeenCalled();

    // After save, edit button should be visible again (exited edit mode)
    expect(
      await screen.findByRole("button", { name: /edit/i }),
    ).toBeInTheDocument();
  });

  it("cancel restores original value when reopening edit", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const input =
      await screen.findByLabelText<HTMLInputElement>(/maximum tool calls/i);
    await user.clear(input);
    await user.type(input, "12");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Wait for edit form to unmount due to animation
    await waitForElementToBeRemoved(() =>
      screen.queryByLabelText(/maximum tool calls/i),
    );

    // Reopen and ensure value reset to prop
    const editBtn = await screen.findByRole("button", { name: /edit/i });
    await user.click(editBtn);
    const input2 =
      await screen.findByLabelText<HTMLInputElement>(/maximum tool calls/i);
    expect(input2.value).toBe("3");
  });

  it("renders loading placeholder when project is missing", () => {
    // @ts-expect-error testing defensive branch
    render(<ToolCallLimitEditor project={undefined} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
