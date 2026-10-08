import { render, screen } from "@testing-library/react";
import { ShutdownNotice } from "./shutdown-notice";

const mockEnv: { NEXTAUTH_URL: string; DISABLE_NEW_SIGNUPS?: string } = {
  NEXTAUTH_URL: "https://console.tambo.co",
};

jest.mock("@/lib/env", () => ({
  env: {
    get NEXTAUTH_URL() {
      return mockEnv.NEXTAUTH_URL;
    },
    get DISABLE_NEW_SIGNUPS() {
      return mockEnv.DISABLE_NEW_SIGNUPS;
    },
  },
}));

describe("ShutdownNotice", () => {
  afterEach(() => {
    mockEnv.NEXTAUTH_URL = "https://console.tambo.co";
    delete mockEnv.DISABLE_NEW_SIGNUPS;
  });

  it("automatically renders the shutdown banner on Tambo Cloud", () => {
    render(<ShutdownNotice />);

    expect(
      screen.getByRole("complementary", {
        name: "Tambo Cloud shutdown notice",
      }),
    ).toBeInTheDocument();
  });

  it("says signups are closed only when DISABLE_NEW_SIGNUPS is true", () => {
    const { rerender } = render(<ShutdownNotice />);
    const banner = screen.getByRole("complementary", {
      name: "Tambo Cloud shutdown notice",
    });
    expect(banner).not.toHaveTextContent("New signups are closed.");

    mockEnv.DISABLE_NEW_SIGNUPS = "true";
    rerender(<ShutdownNotice />);

    expect(banner).toHaveTextContent("New signups are closed.");
  });

  it("renders nothing when self-hosting", () => {
    mockEnv.NEXTAUTH_URL = "https://tambo.example.com";

    const { container } = render(<ShutdownNotice />);

    expect(container).toBeEmptyDOMElement();
  });
});
