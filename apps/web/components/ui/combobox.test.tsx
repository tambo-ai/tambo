import { Combobox } from "@/components/ui/combobox";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type Opt = "a" | "b" | "c";

const items = [
  { value: "a" as Opt, label: "Alpha" },
  { value: "b" as Opt, label: "Beta" },
  { value: "c" as Opt, label: "Gamma", disabled: true },
];

describe("Combobox", () => {
  it("invokes onChange when clicking an enabled item and closes menu", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <Combobox<Opt>
        items={items}
        value={undefined}
        onChange={onChange}
        placeholder="Pick one"
      />,
    );

    // Open popover
    await user.click(screen.getByRole("combobox"));

    // Click an enabled item
    await user.click(screen.getByRole("option", { name: /beta/i }));

    expect(onChange).toHaveBeenCalledWith("b");

    // The popover should close; options should no longer be in the document
    expect(
      screen.queryByRole("option", { name: /alpha/i }),
    ).not.toBeInTheDocument();
  });

  it("does not call onChange for disabled items", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <Combobox<Opt>
        items={items}
        value={undefined}
        onChange={onChange}
        placeholder="Pick one"
      />,
    );

    await user.click(screen.getByRole("combobox"));

    // Attempt to click disabled item
    await user.click(screen.getByRole("option", { name: /gamma/i }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
