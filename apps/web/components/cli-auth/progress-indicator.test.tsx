import { ProgressIndicator } from "@/components/cli-auth/progress-indicator";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ProgressIndicator", () => {
  const mockSteps = ["step1", "step2", "step3"];
  const mockOnStepClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all steps with correct numbering", () => {
    render(
      <ProgressIndicator
        steps={mockSteps}
        currentStep="step2"
        onStepClick={mockOnStepClick}
      />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("step1")).toBeInTheDocument();
    expect(screen.getByText("step2")).toBeInTheDocument();
    expect(screen.getByText("step3")).toBeInTheDocument();
  });

  it("applies correct styling for current step", () => {
    render(
      <ProgressIndicator
        steps={mockSteps}
        currentStep="step2"
        onStepClick={mockOnStepClick}
      />,
    );

    const currentStepButton = screen.getByText("2").closest("div");
    expect(currentStepButton).toHaveClass(
      "bg-primary",
      "text-primary-foreground",
    );
  });

  it("applies correct styling for previous steps", () => {
    render(
      <ProgressIndicator
        steps={mockSteps}
        currentStep="step3"
        onStepClick={mockOnStepClick}
      />,
    );

    const step1Button = screen.getByText("1").closest("div");
    const step2Button = screen.getByText("2").closest("div");

    expect(step1Button).toHaveClass("bg-primary/20", "text-primary");
    expect(step2Button).toHaveClass("bg-primary/20", "text-primary");
  });

  it("applies correct styling for future steps", () => {
    render(
      <ProgressIndicator
        steps={mockSteps}
        currentStep="step1"
        onStepClick={mockOnStepClick}
      />,
    );

    const step2Button = screen.getByText("2").closest("div");
    const step3Button = screen.getByText("3").closest("div");

    expect(step2Button).toHaveClass("bg-muted", "text-muted-foreground");
    expect(step3Button).toHaveClass("bg-muted", "text-muted-foreground");
  });

  it("makes previous steps clickable when onStepClick is provided", async () => {
    const user = userEvent.setup();
    render(
      <ProgressIndicator
        steps={mockSteps}
        currentStep="step3"
        onStepClick={mockOnStepClick}
      />,
    );

    const step1Button = screen.getByText("1").closest("div");
    const step2Button = screen.getByText("2").closest("div");

    expect(step1Button).toHaveClass("cursor-pointer", "hover:bg-primary/30");
    expect(step2Button).toHaveClass("cursor-pointer", "hover:bg-primary/30");
    expect(step1Button).toHaveAttribute("role", "button");
    expect(step2Button).toHaveAttribute("role", "button");

    await user.click(step1Button!);
    expect(mockOnStepClick).toHaveBeenCalledWith("step1");

    await user.click(step2Button!);
    expect(mockOnStepClick).toHaveBeenCalledWith("step2");
  });

  it("does not make future steps clickable", () => {
    render(
      <ProgressIndicator
        steps={mockSteps}
        currentStep="step1"
        onStepClick={mockOnStepClick}
      />,
    );

    const step2Button = screen.getByText("2").closest("div");
    const step3Button = screen.getByText("3").closest("div");

    expect(step2Button).not.toHaveClass("cursor-pointer");
    expect(step3Button).not.toHaveClass("cursor-pointer");
    expect(step2Button).not.toHaveAttribute("role");
    expect(step3Button).not.toHaveAttribute("role");
  });

  it("does not make steps clickable when onStepClick is not provided", () => {
    render(<ProgressIndicator steps={mockSteps} currentStep="step3" />);

    const step1Button = screen.getByText("1").closest("div");
    const step2Button = screen.getByText("2").closest("div");

    expect(step1Button).not.toHaveClass("cursor-pointer");
    expect(step2Button).not.toHaveClass("cursor-pointer");
    expect(step1Button).not.toHaveAttribute("role");
    expect(step2Button).not.toHaveAttribute("role");
  });

  it("applies correct text styling for clickable steps", () => {
    render(
      <ProgressIndicator
        steps={mockSteps}
        currentStep="step3"
        onStepClick={mockOnStepClick}
      />,
    );

    const step1Text = screen.getByText("step1").closest("div");
    const step2Text = screen.getByText("step2").closest("div");
    const step3Text = screen.getByText("step3").closest("div");

    expect(step1Text).toHaveClass(
      "text-primary",
      "cursor-pointer",
      "hover:underline",
    );
    expect(step2Text).toHaveClass(
      "text-primary",
      "cursor-pointer",
      "hover:underline",
    );
    expect(step3Text).toHaveClass("text-muted-foreground");
  });

  it("handles single step correctly", () => {
    render(
      <ProgressIndicator
        steps={["only-step"]}
        currentStep="only-step"
        onStepClick={mockOnStepClick}
      />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("only-step")).toBeInTheDocument();

    const stepButton = screen.getByText("1").closest("div");
    expect(stepButton).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("handles empty steps array gracefully", () => {
    const { container } = render(
      <ProgressIndicator
        steps={[]}
        currentStep=""
        onStepClick={mockOnStepClick}
      />,
    );

    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
