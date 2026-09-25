import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TamboSetupCommand } from "./setup-command";

describe("TamboSetupCommand", () => {
  it("updates its accessible name after copying the command", async () => {
    const user = userEvent.setup();
    const write = jest
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(<TamboSetupCommand label="Run command" command="npm run dev" />);
    await user.click(screen.getByRole("button", { name: "Copy Run command" }));
    expect(write).toHaveBeenCalledWith("npm run dev");
    expect(await screen.findByText("Run command copied.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copied Run command" }),
    ).toBeVisible();
  });

  it("selects the command for manual recovery when clipboard access fails", async () => {
    const user = userEvent.setup();
    jest
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValue(new Error("Unavailable"));
    render(<TamboSetupCommand label="Run command" command="npm run dev" />);
    await user.click(screen.getByRole("button", { name: "Copy Run command" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "copy it manually",
    );
    expect(screen.getByRole("textbox", { name: "Run command" })).toHaveFocus();
    expect(screen.queryByText("Run command copied.")).not.toBeInTheDocument();
  });
});
