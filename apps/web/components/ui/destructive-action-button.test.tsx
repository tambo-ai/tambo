import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DestructiveActionButton } from "./destructive-action-button";

describe("DestructiveActionButton", () => {
  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <DestructiveActionButton onClick={onClick} aria-label="Delete thing" />,
    );

    await user.click(screen.getByRole("button", { name: "Delete thing" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <DestructiveActionButton
        onClick={onClick}
        disabled
        aria-label="Delete thing"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete thing" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows pending label and disables button while pending", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <DestructiveActionButton
        onClick={onClick}
        isPending
        aria-label="Delete thing"
      />,
    );

    const button = screen.getByRole("button", { name: "Delete thing" });
    expect(button).toBeDisabled();
    expect(screen.getByText("Deleting...")).toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports custom label and pendingLabel", () => {
    const { rerender } = render(
      <DestructiveActionButton
        onClick={jest.fn()}
        aria-label="Remove item"
        label="Remove"
        pendingLabel="Removing..."
      />,
    );

    expect(screen.getByText("Remove")).toBeInTheDocument();

    rerender(
      <DestructiveActionButton
        onClick={jest.fn()}
        aria-label="Remove item"
        label="Remove"
        pendingLabel="Removing..."
        isPending
      />,
    );

    expect(screen.getByText("Removing...")).toBeInTheDocument();
  });
});
