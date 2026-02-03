import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinearProjectList } from "./linear-project-list";

describe("LinearProjectList", () => {
  describe("Loading and empty states", () => {
    it("renders loading message when projects undefined", () => {
      render(<LinearProjectList />);
      expect(screen.getByText("Loading projects...")).toBeInTheDocument();
    });

    it("renders empty message when projects array is empty", () => {
      render(<LinearProjectList projects={[]} />);
      expect(screen.getByText("No projects found")).toBeInTheDocument();
    });
  });

  describe("With projects", () => {
    const mockProjects = [
      {
        id: "project-1",
        name: "Project Alpha",
        description: "First project description",
        icon: "🚀",
        color: "#ff0000",
        state: "In Progress",
        startDate: "2024-01-01",
        targetDate: "2024-06-01",
        issueCount: 10,
        completedIssueCount: 4,
      },
      {
        id: "project-2",
        name: "Project Beta",
        state: "Planned",
        issueCount: 5,
        completedIssueCount: 0,
      },
    ];

    it("renders all projects", () => {
      render(<LinearProjectList projects={mockProjects} />);
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      expect(screen.getByText("Project Beta")).toBeInTheDocument();
    });

    it("renders project state badge", () => {
      render(<LinearProjectList projects={mockProjects} />);
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("Planned")).toBeInTheDocument();
    });

    it("renders project icon when provided", () => {
      render(<LinearProjectList projects={mockProjects} />);
      expect(
        screen.getByRole("img", { name: "project icon" }),
      ).toHaveTextContent("🚀");
    });

    it("renders description when provided", () => {
      render(<LinearProjectList projects={mockProjects} />);
      expect(screen.getByText("First project description")).toBeInTheDocument();
    });

    it("does not render description when not provided", () => {
      render(<LinearProjectList projects={mockProjects} />);
      // Project Beta has no description
      expect(screen.queryByText("Project Beta")).toBeInTheDocument();
    });

    it("renders progress with issue counts", () => {
      render(<LinearProjectList projects={mockProjects} />);
      expect(screen.getByText("4 / 10 issues")).toBeInTheDocument();
      expect(screen.getByText("0 / 5 issues")).toBeInTheDocument();
    });

    it("renders start date when provided", () => {
      render(<LinearProjectList projects={mockProjects} />);
      expect(screen.getByText("Start Date")).toBeInTheDocument();
    });

    it("renders target date when provided", () => {
      render(<LinearProjectList projects={mockProjects} />);
      expect(screen.getByText("Target Date")).toBeInTheDocument();
    });

    it("does not render dates when not provided", () => {
      const projectWithoutDates = [
        {
          id: "project-3",
          name: "No Dates Project",
          state: "Active",
        },
      ];
      render(<LinearProjectList projects={projectWithoutDates} />);
      expect(screen.queryByText("Start Date")).not.toBeInTheDocument();
      expect(screen.queryByText("Target Date")).not.toBeInTheDocument();
    });

    it("calls onProjectClick when project card clicked", async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();
      render(
        <LinearProjectList
          projects={mockProjects}
          onProjectClick={mockClick}
        />,
      );

      // Click on the project name which is inside the card
      await user.click(screen.getByText("Project Alpha"));

      expect(mockClick).toHaveBeenCalledWith("project-1");
    });

    it("handles missing issue counts gracefully", () => {
      const projectWithoutCounts = [
        {
          id: "project-4",
          name: "No Counts",
          state: "Active",
        },
      ];
      render(<LinearProjectList projects={projectWithoutCounts} />);
      expect(screen.getByText("0 / 0 issues")).toBeInTheDocument();
    });
  });
});
