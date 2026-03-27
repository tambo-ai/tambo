import { SkillCard } from "@/components/dashboard-components/project-details/skill-card";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("SkillCard", () => {
  const defaultProps = {
    skillId: "sk_1",
    name: "My Skill",
    description: "A skill that does things",
    enabled: true,
    onToggle: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders skill name and description", () => {
    render(<SkillCard {...defaultProps} />);

    expect(screen.getByText("My Skill")).toBeInTheDocument();
    expect(screen.getByText("A skill that does things")).toBeInTheDocument();
  });

  it("renders the enabled toggle in checked state", () => {
    render(<SkillCard {...defaultProps} enabled={true} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toBeChecked();
  });

  it("renders the enabled toggle in unchecked state", () => {
    render(<SkillCard {...defaultProps} enabled={false} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).not.toBeChecked();
  });

  it("calls onToggle when switch is clicked", async () => {
    const user = userEvent.setup();
    render(<SkillCard {...defaultProps} enabled={true} />);

    await user.click(screen.getByRole("switch"));
    expect(defaultProps.onToggle).toHaveBeenCalledWith("sk_1", false);
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<SkillCard {...defaultProps} />);

    await user.click(screen.getByLabelText("Edit skill My Skill"));
    expect(defaultProps.onEdit).toHaveBeenCalledWith("sk_1");
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<SkillCard {...defaultProps} />);

    await user.click(screen.getByLabelText("Delete skill My Skill"));
    expect(defaultProps.onDelete).toHaveBeenCalledWith("sk_1", "My Skill");
  });

  it("disables the toggle when isToggling is true", () => {
    render(<SkillCard {...defaultProps} isToggling={true} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
  });

  it("has accessible aria-labels on all interactive elements", () => {
    render(<SkillCard {...defaultProps} />);

    expect(screen.getByLabelText("Disable skill My Skill")).toBeInTheDocument();
    expect(screen.getByLabelText("Edit skill My Skill")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete skill My Skill")).toBeInTheDocument();
  });

  it("shows Enable label when skill is disabled", () => {
    render(<SkillCard {...defaultProps} enabled={false} />);

    expect(screen.getByLabelText("Enable skill My Skill")).toBeInTheDocument();
  });

  it("applies truncate class to name and description", () => {
    render(<SkillCard {...defaultProps} />);

    const name = screen.getByText("My Skill");
    expect(name.className).toContain("truncate");

    const desc = screen.getByText("A skill that does things");
    expect(desc.className).toContain("truncate");
  });
});
