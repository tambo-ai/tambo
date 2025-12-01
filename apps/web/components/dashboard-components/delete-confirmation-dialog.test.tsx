import { DeleteConfirmationDialog } from "@/components/dashboard-components/delete-confirmation-dialog";
import { api } from "@/trpc/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock tRPC
jest.mock("@/trpc/react", () => ({
  api: {
    project: {
      removeMultipleProjects: {
        useMutation: jest.fn(() => ({
          mutateAsync: jest.fn(),
          isPending: false,
        })),
      },
    },
  },
}));

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("DeleteConfirmationDialog", () => {
  const mockOnProjectsDeleted = jest.fn();
  const mockOnOpenChange = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockSetAlertState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to return isPending: false
    jest
      .mocked(api.project.removeMultipleProjects.useMutation)
      .mockReturnValue({
        mutateAsync: jest.fn(),
        isPending: false,
      } as any);
  });

  describe("Multiple projects mode", () => {
    const multipleProps = {
      mode: "multiple" as const,
      open: true,
      onOpenChange: mockOnOpenChange,
      selectedProjectIds: ["id1", "id2", "id3"],
      selectedProjectNames: ["Project 1", "Project 2", "Project 3"],
      onProjectsDeleted: mockOnProjectsDeleted,
    };

    it("renders multiple projects dialog", () => {
      render(<DeleteConfirmationDialog {...multipleProps} />);

      expect(screen.getByText("Delete Projects")).toBeInTheDocument();
      expect(
        screen.getByText("Are you sure you want to delete 3 projects?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Project 1, Project 2, Project 3"),
      ).toBeInTheDocument();
    });

    it("shows correct button text when not loading", () => {
      render(<DeleteConfirmationDialog {...multipleProps} />);

      const deleteButton = screen.getByRole("button", { name: "Delete" });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveTextContent("Delete");
    });

    it("shows loading text when deleting", () => {
      // Mock the mutation to return isPending: true
      const mockMutation = {
        mutateAsync: jest.fn(),
        isPending: true,
        trpc: { path: "project.removeMultipleProjects" } as any,
      } as any;

      jest
        .mocked(api.project.removeMultipleProjects.useMutation)
        .mockReturnValue(mockMutation);

      render(<DeleteConfirmationDialog {...multipleProps} />);

      const deleteButton = screen.getByRole("button", { name: "Deleting..." });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveTextContent("Deleting...");
    });

    it("handles projects with more than 3 items", () => {
      const manyProjectsProps = {
        ...multipleProps,
        selectedProjectIds: ["id1", "id2", "id3", "id4", "id5"],
        selectedProjectNames: [
          "Project 1",
          "Project 2",
          "Project 3",
          "Project 4",
          "Project 5",
        ],
      };

      render(<DeleteConfirmationDialog {...manyProjectsProps} />);

      expect(
        screen.getByText("Are you sure you want to delete 5 projects?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Project 1, Project 2, Project 3 and 2 more"),
      ).toBeInTheDocument();
    });

    it("handles single project", () => {
      const singleProjectProps = {
        ...multipleProps,
        selectedProjectIds: ["id1"],
        selectedProjectNames: ["Project 1"],
      };

      render(<DeleteConfirmationDialog {...singleProjectProps} />);

      expect(
        screen.getByText("Are you sure you want to delete 1 project?"),
      ).toBeInTheDocument();
      expect(screen.getByText("Project 1")).toBeInTheDocument();
    });

    it("calls onOpenChange when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmationDialog {...multipleProps} />);

      // Verify dialog is open
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).not.toBeDisabled();

      await user.click(cancelButton);

      // The AlertDialogCancel should trigger onOpenChange internally
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Single project mode", () => {
    const singleProps = {
      mode: "single" as const,
      alertState: {
        show: true,
        title: "Delete Project",
        description: "Are you sure you want to delete this project?",
        data: { id: "project-id" },
      },
      setAlertState: mockSetAlertState,
      onConfirm: mockOnConfirm,
    };

    it("renders single project dialog", () => {
      render(<DeleteConfirmationDialog {...singleProps} />);

      expect(screen.getByText("Delete Project")).toBeInTheDocument();
      expect(
        screen.getByText("Are you sure you want to delete this project?"),
      ).toBeInTheDocument();
    });

    it("shows correct button text for single project", () => {
      render(<DeleteConfirmationDialog {...singleProps} />);

      const deleteButton = screen.getByRole("button", { name: "Delete" });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveTextContent("Delete");
    });

    it("calls onConfirm when delete is clicked", async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmationDialog {...singleProps} />);

      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it("calls setAlertState when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<DeleteConfirmationDialog {...singleProps} />);

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(mockSetAlertState).toHaveBeenCalledWith({
        ...singleProps.alertState,
        show: false,
      });
    });
  });

  describe("Edge cases", () => {
    it("handles empty project names gracefully", () => {
      const emptyNamesProps = {
        mode: "multiple" as const,
        open: true,
        onOpenChange: mockOnOpenChange,
        selectedProjectIds: ["id1", "id2"],
        selectedProjectNames: [],
      };

      render(<DeleteConfirmationDialog {...emptyNamesProps} />);

      expect(
        screen.getByText("Are you sure you want to delete 2 projects?"),
      ).toBeInTheDocument();
    });

    it("handles undefined onProjectsDeleted", () => {
      const propsWithoutCallback = {
        mode: "multiple" as const,
        open: true,
        onOpenChange: mockOnOpenChange,
        selectedProjectIds: ["id1"],
        selectedProjectNames: ["Project 1"],
      };

      expect(() => {
        render(<DeleteConfirmationDialog {...propsWithoutCallback} />);
      }).not.toThrow();
    });

    it("handles undefined onLoadingChange", () => {
      const propsWithoutLoadingCallback = {
        mode: "multiple" as const,
        open: true,
        onOpenChange: mockOnOpenChange,
        selectedProjectIds: ["id1"],
        selectedProjectNames: ["Project 1"],
      };

      expect(() => {
        render(<DeleteConfirmationDialog {...propsWithoutLoadingCallback} />);
      }).not.toThrow();
    });
  });
});
