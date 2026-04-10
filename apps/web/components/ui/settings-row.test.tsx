import { render, screen } from "@testing-library/react";
import { SettingsRow } from "./settings-row";

describe("SettingsRow", () => {
  it("renders label and children", () => {
    render(
      <SettingsRow label="Project name">
        <input aria-label="name input" />
      </SettingsRow>,
    );

    expect(screen.getByText("Project name")).toBeInTheDocument();
    expect(screen.getByLabelText("name input")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <SettingsRow
        label="Project name"
        description="The display name for this project."
      >
        <input aria-label="name input" />
      </SettingsRow>,
    );

    expect(
      screen.getByText("The display name for this project."),
    ).toBeInTheDocument();
  });

  it("omits description when not provided", () => {
    render(
      <SettingsRow label="Project name">
        <input aria-label="name input" />
      </SettingsRow>,
    );

    expect(screen.queryByText(/display name/i)).not.toBeInTheDocument();
  });

  it("associates label with control via htmlFor", () => {
    render(
      <SettingsRow label="Tool call limit" htmlFor="limit-input">
        <input id="limit-input" type="number" defaultValue={3} />
      </SettingsRow>,
    );

    // getByLabelText uses the <label htmlFor> association
    expect(screen.getByLabelText("Tool call limit")).toHaveValue(3);
  });
});
