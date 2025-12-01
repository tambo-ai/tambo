import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeadersEditor, type HeaderKV } from "./headers-editor";

describe("HeadersEditor", () => {
  const sampleHeaders: HeaderKV[] = [
    { header: "Authorization", value: "Bearer abc123" },
    { header: "X-Custom", value: "foo" },
  ];

  it("renders title and Add header button", () => {
    render(
      <HeadersEditor
        headers={sampleHeaders}
        onSave={() => {}}
        title="Extra Headers"
      />,
    );
    expect(screen.getByText("Extra Headers")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add header/i }),
    ).toBeInTheDocument();
  });

  it("renders provided headers as input rows", () => {
    render(<HeadersEditor headers={sampleHeaders} onSave={() => {}} />);
    expect(screen.getAllByPlaceholderText(/value/i)).toHaveLength(
      sampleHeaders.length,
    );
  });

  it("does not call onSave during initial render", () => {
    const onSave = jest.fn();
    render(<HeadersEditor headers={sampleHeaders} onSave={onSave} />);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("enables save only when editing and inputs are non-empty", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    render(<HeadersEditor headers={sampleHeaders} onSave={onSave} />);

    // Begin editing a new row
    await user.click(screen.getByRole("button", { name: /add header/i }));

    // The editing row is the last row after clicking "Add header"
    const headerInputs = screen.getAllByPlaceholderText(/header/i);
    const valueInputs = screen.getAllByPlaceholderText(/value/i);
    const headerInput = headerInputs[headerInputs.length - 1];
    const valueInput = valueInputs[valueInputs.length - 1];

    await user.type(headerInput, "X-Test");
    await user.type(valueInput, "123");

    const saveButton = screen.getByRole("button", { name: /save header/i });
    expect(saveButton).toBeEnabled();
  });
});
