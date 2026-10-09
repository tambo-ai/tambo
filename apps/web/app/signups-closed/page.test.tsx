import { render, screen } from "@testing-library/react";
import SignupsClosedPage from "./page";

const mockEnv = { NEXTAUTH_URL: "https://console.tambo.co" };

jest.mock("@/lib/env", () => ({
  env: {
    get NEXTAUTH_URL() {
      return mockEnv.NEXTAUTH_URL;
    },
  },
}));

describe("SignupsClosedPage", () => {
  afterEach(() => {
    mockEnv.NEXTAUTH_URL = "https://console.tambo.co";
  });

  it("explains the shutdown on Tambo Cloud", () => {
    render(<SignupsClosedPage />);

    expect(
      screen.getByRole("heading", { name: "New signups are closed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/All user data is deleted on November 30, 2026/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read the announcement" }),
    ).toBeInTheDocument();
  });

  it("omits Tambo Cloud shutdown copy when self-hosting", () => {
    mockEnv.NEXTAUTH_URL = "https://tambo.example.com";

    render(<SignupsClosedPage />);

    expect(
      screen.getByRole("heading", { name: "New signups are closed" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/shutting down/)).not.toBeInTheDocument();
    expect(screen.queryByText(/user data is deleted/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Read the announcement" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Try Charming" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to sign in" }),
    ).toHaveAttribute("href", "/login");
  });
});
