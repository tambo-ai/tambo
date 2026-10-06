import { render, screen } from "@testing-library/react";
import { ShutdownNotice } from "./shutdown-notice";

const mockEnv = { NEXTAUTH_URL: "https://console.tambo.co" };

jest.mock("@/lib/env", () => ({
  env: {
    get NEXTAUTH_URL() {
      return mockEnv.NEXTAUTH_URL;
    },
  },
}));

describe("ShutdownNotice", () => {
  afterEach(() => {
    mockEnv.NEXTAUTH_URL = "https://console.tambo.co";
  });

  it("automatically renders the shutdown banner on Tambo Cloud", () => {
    render(<ShutdownNotice />);

    expect(
      screen.getByRole("complementary", {
        name: "Tambo Cloud shutdown notice",
      }),
    ).toBeInTheDocument();
  });

  it("renders nothing when self-hosting", () => {
    mockEnv.NEXTAUTH_URL = "https://tambo.example.com";

    const { container } = render(<ShutdownNotice />);

    expect(container).toBeEmptyDOMElement();
  });
});
