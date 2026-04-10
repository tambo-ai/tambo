import { render, screen } from "@testing-library/react";
import { SettingsSection } from "./settings-section";

describe("SettingsSection", () => {
  it("renders title as a heading and children", () => {
    render(
      <SettingsSection title="General">
        <div>child content</div>
      </SettingsSection>,
    );

    expect(
      screen.getByRole("heading", { name: "General" }),
    ).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <SettingsSection title="General" description="Project-level settings.">
        <div />
      </SettingsSection>,
    );

    expect(screen.getByText("Project-level settings.")).toBeInTheDocument();
  });

  it("omits description when not provided", () => {
    render(
      <SettingsSection title="General">
        <div>child</div>
      </SettingsSection>,
    );

    // Only the heading should be present; no extra muted paragraph
    expect(screen.queryByText(/settings/i)).not.toBeInTheDocument();
  });

  it("renders action slot content in the header", () => {
    render(
      <SettingsSection
        title="API Keys"
        action={<button type="button">Edit with Tambo</button>}
      >
        <div />
      </SettingsSection>,
    );

    expect(
      screen.getByRole("button", { name: "Edit with Tambo" }),
    ).toBeInTheDocument();
  });

  it("omits action slot when not provided", () => {
    render(
      <SettingsSection title="API Keys">
        <div />
      </SettingsSection>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders children regardless of bordered prop", () => {
    const { rerender } = render(
      <SettingsSection title="General" bordered>
        <div>bordered child</div>
      </SettingsSection>,
    );
    expect(screen.getByText("bordered child")).toBeInTheDocument();

    rerender(
      <SettingsSection title="General" bordered={false}>
        <div>unbordered child</div>
      </SettingsSection>,
    );
    expect(screen.getByText("unbordered child")).toBeInTheDocument();
  });
});
