import { render, screen } from "@testing-library/react";
import { LinearIssue } from "./linear-issue";

describe("LinearIssue", () => {
  describe("Loading state", () => {
    it("renders loading message when no data provided", () => {
      render(<LinearIssue />);
      expect(screen.getByText("Loading issue data...")).toBeInTheDocument();
    });

    it("renders loading message when data is undefined", () => {
      render(<LinearIssue data={undefined} />);
      expect(screen.getByText("Loading issue data...")).toBeInTheDocument();
    });
  });

  describe("With data", () => {
    const baseData = {
      id: "issue-123",
      identifier: "TAM-456",
      title: "Fix authentication bug",
      description: "Users are unable to login with OAuth",
      priority: 2,
      url: "https://linear.app/issue/TAM-456",
      status: { name: "In Progress", type: "started" },
      assignee: { name: "Jane Doe", email: "jane@example.com" },
      labels: [
        { name: "bug", color: "#ff0000" },
        { name: "auth", color: "#0000ff" },
      ],
      createdAt: "2024-01-15T10:00:00Z",
      dueDate: "2024-02-01T10:00:00Z",
    };

    it("renders issue identifier", () => {
      render(<LinearIssue data={baseData} />);
      expect(screen.getByText("TAM-456")).toBeInTheDocument();
    });

    it("renders issue title as link when url provided", () => {
      render(<LinearIssue data={baseData} />);
      const link = screen.getByRole("link", { name: "Fix authentication bug" });
      expect(link).toHaveAttribute("href", "https://linear.app/issue/TAM-456");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("renders title without link when url not provided", () => {
      const dataWithoutUrl = { ...baseData, url: undefined };
      render(<LinearIssue data={dataWithoutUrl} />);
      expect(screen.getByText("Fix authentication bug")).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Fix authentication bug" }),
      ).not.toBeInTheDocument();
    });

    it("renders description", () => {
      render(<LinearIssue data={baseData} />);
      expect(
        screen.getByText("Users are unable to login with OAuth"),
      ).toBeInTheDocument();
    });

    it("does not render description when not provided", () => {
      const dataWithoutDesc = { ...baseData, description: undefined };
      render(<LinearIssue data={dataWithoutDesc} />);
      expect(
        screen.queryByText("Users are unable to login with OAuth"),
      ).not.toBeInTheDocument();
    });

    it("renders status", () => {
      render(<LinearIssue data={baseData} />);
      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    it("renders 'Not set' when status not provided", () => {
      const dataWithoutStatus = { ...baseData, status: undefined };
      render(<LinearIssue data={dataWithoutStatus} />);
      expect(screen.getByText("Not set")).toBeInTheDocument();
    });

    it("renders assignee name", () => {
      render(<LinearIssue data={baseData} />);
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    it("renders 'Unassigned' when assignee not provided", () => {
      const dataWithoutAssignee = { ...baseData, assignee: undefined };
      render(<LinearIssue data={dataWithoutAssignee} />);
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
    });

    it("renders due date when provided", () => {
      render(<LinearIssue data={baseData} />);
      expect(screen.getByText("Due Date")).toBeInTheDocument();
    });

    it("does not render due date section when not provided", () => {
      const dataWithoutDue = { ...baseData, dueDate: undefined };
      render(<LinearIssue data={dataWithoutDue} />);
      expect(screen.queryByText("Due Date")).not.toBeInTheDocument();
    });

    it("renders created date", () => {
      render(<LinearIssue data={baseData} />);
      expect(screen.getByText("Created")).toBeInTheDocument();
    });

    it("renders 'Unknown' when createdAt not provided", () => {
      const dataWithoutCreated = { ...baseData, createdAt: undefined };
      render(<LinearIssue data={dataWithoutCreated} />);
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });

    it("renders labels", () => {
      render(<LinearIssue data={baseData} />);
      expect(screen.getByText("bug")).toBeInTheDocument();
      expect(screen.getByText("auth")).toBeInTheDocument();
    });

    it("does not render labels section when labels empty", () => {
      const dataWithoutLabels = { ...baseData, labels: [] };
      render(<LinearIssue data={dataWithoutLabels} />);
      expect(screen.queryByText("Labels")).not.toBeInTheDocument();
    });

    it("does not render labels section when labels undefined", () => {
      const dataWithoutLabels = { ...baseData, labels: undefined };
      render(<LinearIssue data={dataWithoutLabels} />);
      expect(screen.queryByText("Labels")).not.toBeInTheDocument();
    });
  });

  describe("Priority badges", () => {
    it.each([
      [0, "No Priority"],
      [1, "Urgent"],
      [2, "High"],
      [3, "Medium"],
      [4, "Low"],
    ])("renders priority %i as '%s'", (priority, label) => {
      render(
        <LinearIssue
          data={{
            id: "1",
            identifier: "TAM-1",
            title: "Test",
            priority,
          }}
        />,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it("does not render priority badge when priority undefined", () => {
      render(
        <LinearIssue
          data={{
            id: "1",
            identifier: "TAM-1",
            title: "Test",
          }}
        />,
      );
      expect(screen.queryByText("No Priority")).not.toBeInTheDocument();
      expect(screen.queryByText("Urgent")).not.toBeInTheDocument();
      expect(screen.queryByText("High")).not.toBeInTheDocument();
      expect(screen.queryByText("Medium")).not.toBeInTheDocument();
      expect(screen.queryByText("Low")).not.toBeInTheDocument();
    });
  });
});
