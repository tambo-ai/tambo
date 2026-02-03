import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinearIssueList } from "./linear-issue-list";

describe("LinearIssueList", () => {
  describe("Loading and empty states", () => {
    it("renders loading message when issues undefined", () => {
      render(<LinearIssueList />);
      expect(screen.getByText("Loading issues...")).toBeInTheDocument();
    });

    it("renders empty message when issues array is empty", () => {
      render(<LinearIssueList issues={[]} />);
      expect(screen.getByText("No issues found")).toBeInTheDocument();
    });
  });

  describe("With issues", () => {
    const mockIssues = [
      {
        id: "issue-1",
        identifier: "TAM-101",
        title: "First issue",
        priority: 1,
        status: { name: "Todo" },
        assignee: { name: "Alice" },
        dueDate: "2024-03-01",
        labels: [{ name: "bug", color: "#ff0000" }],
      },
      {
        id: "issue-2",
        identifier: "TAM-102",
        title: "Second issue",
        priority: 3,
        url: "https://linear.app/issue/TAM-102",
      },
    ];

    it("renders all issues", () => {
      render(<LinearIssueList issues={mockIssues} />);
      expect(screen.getByText("TAM-101")).toBeInTheDocument();
      expect(screen.getByText("TAM-102")).toBeInTheDocument();
      expect(screen.getByText("First issue")).toBeInTheDocument();
      expect(screen.getByText("Second issue")).toBeInTheDocument();
    });

    it("renders priority badges", () => {
      render(<LinearIssueList issues={mockIssues} />);
      expect(screen.getByText("Urgent")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });

    it("renders status badge when provided", () => {
      render(<LinearIssueList issues={mockIssues} />);
      expect(screen.getByText("Todo")).toBeInTheDocument();
    });

    it("renders assignee when provided", () => {
      render(<LinearIssueList issues={mockIssues} />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("renders due date when provided", () => {
      render(<LinearIssueList issues={mockIssues} />);
      expect(screen.getByText(/Due:/)).toBeInTheDocument();
    });

    it("renders labels when provided", () => {
      render(<LinearIssueList issues={mockIssues} />);
      expect(screen.getByText("bug")).toBeInTheDocument();
    });

    it("renders title as link when url provided", () => {
      render(<LinearIssueList issues={mockIssues} />);
      const link = screen.getByRole("link", { name: "Second issue" });
      expect(link).toHaveAttribute("href", "https://linear.app/issue/TAM-102");
    });

    it("renders title without link when url not provided", () => {
      render(<LinearIssueList issues={mockIssues} />);
      expect(screen.getByText("First issue")).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "First issue" }),
      ).not.toBeInTheDocument();
    });

    it("calls onIssueClick when issue row clicked", async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();
      render(<LinearIssueList issues={mockIssues} onIssueClick={mockClick} />);

      const firstIssueRow = screen.getByText("First issue").closest("div");
      await user.click(firstIssueRow!);

      expect(mockClick).toHaveBeenCalledWith("issue-1");
    });

    it("does not call onIssueClick when issue has no id", async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();
      const issuesWithoutId = [{ identifier: "TAM-999", title: "No ID issue" }];
      render(
        <LinearIssueList issues={issuesWithoutId} onIssueClick={mockClick} />,
      );

      const issueRow = screen.getByText("No ID issue").closest("div");
      await user.click(issueRow!);

      expect(mockClick).not.toHaveBeenCalled();
    });

    it("link click does not trigger row click", async () => {
      const user = userEvent.setup();
      const mockClick = jest.fn();
      render(<LinearIssueList issues={mockIssues} onIssueClick={mockClick} />);

      const link = screen.getByRole("link", { name: "Second issue" });
      await user.click(link);

      // The click handler should not have been called due to stopPropagation
      expect(mockClick).not.toHaveBeenCalled();
    });
  });
});
