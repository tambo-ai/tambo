import { render, screen } from "@testing-library/react";
import { ShutdownBanner } from "./shutdown-banner";

jest.mock("@/lib/env", () => ({
  env: {},
}));

describe("ShutdownBanner", () => {
  it("announces the shutdown date and closed signups", () => {
    render(<ShutdownBanner isSignupClosed />);

    const banner = screen.getByRole("complementary", {
      name: "Tambo Cloud shutdown notice",
    });
    expect(banner).toHaveTextContent(
      "Tambo Cloud is shutting down on October 31, 2026. New signups are closed. Read the announcement",
    );
  });

  it("does not claim signups are closed while they are open", () => {
    render(<ShutdownBanner isSignupClosed={false} />);

    const banner = screen.getByRole("complementary", {
      name: "Tambo Cloud shutdown notice",
    });
    expect(banner).toHaveTextContent(
      "Tambo Cloud is shutting down on October 31, 2026. Read the announcement",
    );
    expect(banner).not.toHaveTextContent("New signups are closed.");
  });

  it("links to the announcement post and Charming", () => {
    render(<ShutdownBanner isSignupClosed />);

    expect(
      screen.getByRole("link", { name: "Read the announcement" }),
    ).toHaveAttribute(
      "href",
      "https://tambo.co/blog/posts/tambo-is-shutting-down",
    );
    expect(
      screen.getByRole("link", { name: "We're now building Charming" }),
    ).toHaveAttribute("href", "https://usecharming.com");
  });
});
