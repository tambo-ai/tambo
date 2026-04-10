import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SystemPromptOverrideToggle } from "./system-prompt-override-toggle";

const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

type MutationOptions = {
  onSuccess?: () => void;
  onError?: () => void;
};

const mutateMock = jest.fn();
let capturedOptions: MutationOptions = {};
let isPending = false;

jest.mock("@/trpc/react", () => ({
  api: {
    project: {
      updateProject: {
        useMutation: (opts: MutationOptions) => {
          capturedOptions = opts;
          return { mutate: mutateMock, isPending };
        },
      },
    },
  },
}));

function renderToggle(
  overrides?: Partial<React.ComponentProps<typeof SystemPromptOverrideToggle>>,
) {
  const onEdited = jest.fn();
  const props: React.ComponentProps<typeof SystemPromptOverrideToggle> = {
    projectId: "proj_1",
    allowSystemPromptOverride: false,
    onEdited,
    ...overrides,
  };
  const view = render(<SystemPromptOverrideToggle {...props} />);
  return { onEdited, ...view };
}

describe("SystemPromptOverrideToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOptions = {};
    isPending = false;
  });

  describe("initial state", () => {
    it("starts unchecked when allowSystemPromptOverride is false", () => {
      renderToggle({ allowSystemPromptOverride: false });
      expect(screen.getByRole("switch")).not.toBeChecked();
    });

    it("starts checked when allowSystemPromptOverride is true", () => {
      renderToggle({ allowSystemPromptOverride: true });
      expect(screen.getByRole("switch")).toBeChecked();
    });

    it("starts unchecked when allowSystemPromptOverride is null", () => {
      renderToggle({ allowSystemPromptOverride: null });
      expect(screen.getByRole("switch")).not.toBeChecked();
    });

    it("starts unchecked when allowSystemPromptOverride is undefined", () => {
      renderToggle({ allowSystemPromptOverride: undefined });
      expect(screen.getByRole("switch")).not.toBeChecked();
    });
  });

  describe("toggling", () => {
    it("sends the new value to updateProject mutation with the projectId", async () => {
      const user = userEvent.setup();
      renderToggle({
        projectId: "proj_42",
        allowSystemPromptOverride: false,
      });

      await user.click(screen.getByRole("switch"));

      expect(mutateMock).toHaveBeenCalledWith({
        projectId: "proj_42",
        allowSystemPromptOverride: true,
      });
    });

    it("optimistically updates the switch before the server responds", async () => {
      const user = userEvent.setup();
      renderToggle({ allowSystemPromptOverride: false });

      await user.click(screen.getByRole("switch"));

      // Switch flips immediately; we haven't called onSuccess yet
      expect(screen.getByRole("switch")).toBeChecked();
    });

    it("calls onEdited after a successful mutation", async () => {
      const user = userEvent.setup();
      const { onEdited } = renderToggle();

      await user.click(screen.getByRole("switch"));
      act(() => {
        capturedOptions.onSuccess?.();
      });

      expect(onEdited).toHaveBeenCalledTimes(1);
    });

    it("reverts optimistic state and shows error toast when mutation fails", async () => {
      const user = userEvent.setup();
      renderToggle({ allowSystemPromptOverride: false });

      await user.click(screen.getByRole("switch"));
      expect(screen.getByRole("switch")).toBeChecked();

      act(() => {
        capturedOptions.onError?.();
      });

      expect(screen.getByRole("switch")).not.toBeChecked();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          variant: "destructive",
        }),
      );
    });
  });

  describe("pending state", () => {
    it("disables the switch while the mutation is in flight", () => {
      isPending = true;
      renderToggle();
      expect(screen.getByRole("switch")).toBeDisabled();
    });
  });
});
