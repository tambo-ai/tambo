import { ComponentCodePreview } from "@/components/component-code-preview";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Test component that we can track renders for
const TestComponent = () => (
  <div data-testid="test-component">Test Content</div>
);

describe("ComponentCodePreview", () => {
  it("renders component in preview tab when fullscreen is disabled", () => {
    render(
      <ComponentCodePreview
        component={<TestComponent />}
        code="const x = 1;"
        enableFullscreen={false}
      />,
    );

    expect(screen.getByTestId("test-component")).toBeInTheDocument();
  });

  it("renders component in preview tab when fullscreen dialog is closed", () => {
    render(
      <ComponentCodePreview
        component={<TestComponent />}
        code="const x = 1;"
        enableFullscreen={true}
      />,
    );

    expect(screen.getByTestId("test-component")).toBeInTheDocument();
  });

  it("does not double-render component when fullscreen dialog is open", async () => {
    const user = userEvent.setup();
    render(
      <ComponentCodePreview
        component={<TestComponent />}
        code="const x = 1;"
        enableFullscreen={true}
      />,
    );

    // Component should be visible in preview tab initially
    const componentsBeforeOpen = screen.getAllByTestId("test-component");
    expect(componentsBeforeOpen).toHaveLength(1);

    // Open the fullscreen dialog
    const fullscreenButton = screen.getByRole("button", {
      name: /go full screen/i,
    });
    await user.click(fullscreenButton);

    // Component should still only be rendered once (in the dialog, not in preview)
    const componentsAfterOpen = screen.getAllByTestId("test-component");
    expect(componentsAfterOpen).toHaveLength(1);

    // Verify component IS in the dialog (not in preview tab)
    const dialog = screen.getByRole("dialog");
    expect(
      dialog.querySelector('[data-testid="test-component"]'),
    ).toBeInTheDocument();
  });

  it("renders component only in dialog when fullscreen is open, not in preview tab", async () => {
    const user = userEvent.setup();
    render(
      <ComponentCodePreview
        component={<TestComponent />}
        code="const x = 1;"
        enableFullscreen={true}
      />,
    );

    // Open the fullscreen dialog
    const fullscreenButton = screen.getByRole("button", {
      name: /go full screen/i,
    });
    await user.click(fullscreenButton);

    // Component should only be rendered once (in the dialog, not in preview tab)
    const components = screen.getAllByTestId("test-component");
    expect(components).toHaveLength(1);

    // Verify component IS in the dialog
    const dialog = screen.getByRole("dialog");
    expect(
      dialog.querySelector('[data-testid="test-component"]'),
    ).toBeInTheDocument();
  });
});
