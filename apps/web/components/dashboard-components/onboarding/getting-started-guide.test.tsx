import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TamboGettingStartedGuide } from "./getting-started-guide";
import type { TamboGettingStartedState } from "./getting-started-state";

const project = { id: "project-1", name: "Support assistant" };
const setup: TamboGettingStartedState = {
  status: "project-created",
  project,
};

function createProps(state: TamboGettingStartedState) {
  return {
    state,
    onCreateProject: jest.fn(),
    onRetryLoad: jest.fn(),
  };
}

describe("TamboGettingStartedGuide", () => {
  it("validates and trims the project name before requesting creation", async () => {
    const user = userEvent.setup();
    const props = createProps({ status: "needs-project", creation: "idle" });
    render(<TamboGettingStartedGuide {...props} />);
    await user.type(screen.getByLabelText("Project name"), "   ");
    await user.click(screen.getByRole("button", { name: "Create project" }));
    expect(await screen.findByText("Enter a project name.")).toBeVisible();
    expect(props.onCreateProject).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Project name"),
      "Support assistant  ",
    );
    await user.click(screen.getByRole("button", { name: "Create project" }));
    await waitFor(() =>
      expect(props.onCreateProject).toHaveBeenCalledWith("Support assistant"),
    );
  });

  it("retains the typed name after failure and prevents another pending submission", async () => {
    const user = userEvent.setup();
    const props = createProps({ status: "needs-project", creation: "idle" });
    const { rerender } = render(<TamboGettingStartedGuide {...props} />);
    await user.type(screen.getByLabelText("Project name"), "My project");
    rerender(
      <TamboGettingStartedGuide
        {...props}
        state={{ status: "needs-project", creation: "pending" }}
      />,
    );
    expect(screen.getByLabelText("Project name")).toBeDisabled();
    const submit = screen.getByRole("button", { name: "Creating project…" });
    expect(submit).toHaveAttribute("aria-disabled", "true");
    await user.click(submit);
    expect(props.onCreateProject).not.toHaveBeenCalled();
    rerender(
      <TamboGettingStartedGuide
        {...props}
        state={{ status: "needs-project", creation: "error" }}
      />,
    );
    expect(screen.getByLabelText("Project name")).toHaveValue("My project");
    expect(screen.getByRole("alert")).toHaveTextContent("try again");
    await user.click(screen.getByRole("button", { name: "Create project" }));
    await waitFor(() => expect(props.onCreateProject).toHaveBeenCalledTimes(1));
  });

  it("focuses the next step after creation without moving focus on initial render", () => {
    const props = createProps({ status: "needs-project", creation: "idle" });
    const { rerender } = render(<TamboGettingStartedGuide {...props} />);
    expect(
      screen.getByRole("heading", { name: "Create your first project" }),
    ).not.toHaveFocus();
    rerender(<TamboGettingStartedGuide {...props} state={setup} />);
    expect(
      screen.getByRole("heading", { name: "Connect Support assistant" }),
    ).toHaveFocus();
  });

  it("confirms project creation and lets the user copy commands without claiming their app is connected", async () => {
    const user = userEvent.setup();
    const props = createProps(setup);
    render(<TamboGettingStartedGuide {...props} />);
    await user.click(
      screen.getByRole("button", { name: "Copy Create command" }),
    );
    await screen.findByText("Create command copied.");
    expect(screen.getByText(/Your project is created/)).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "First message received" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open project dashboard" }),
    ).toHaveAttribute("href", "/project-1");
  });

  it("offers retry after a load error and uses specific current documentation routes", () => {
    const props = createProps({ status: "error" });
    const { rerender } = render(<TamboGettingStartedGuide {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(props.onRetryLoad).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("Project name")).not.toBeInTheDocument();
    rerender(<TamboGettingStartedGuide {...props} state={setup} />);
    expect(
      screen.getByRole("link", { name: "Read the starter quickstart" }),
    ).toHaveAttribute(
      "href",
      "https://docs.tambo.co/getting-started/quickstart",
    );
    expect(
      screen.getByRole("link", { name: "Already have a React app?" }),
    ).toHaveAttribute(
      "href",
      "https://docs.tambo.co/getting-started/integrate",
    );
  });
});
