import { ShutdownBanner } from "@/components/shutdown-banner";
import { render, screen } from "@testing-library/react";

describe("ShutdownBanner", () => {
  it("announces the shutdown with announcement, self-hosting, and Charming links", () => {
    render(<ShutdownBanner />);

    const banner = screen.getByRole("complementary", {
      name: "Tambo Cloud shutdown notice",
    });
    expect(banner).toHaveTextContent("October 31, 2026");
    expect(banner).toHaveTextContent(
      "a collaborative cloud for apps built with any AI agent",
    );
    expect(
      screen.getByRole("link", { name: "Read the announcement" }),
    ).toHaveAttribute(
      "href",
      "https://tambo.co/blog/posts/tambo-is-shutting-down",
    );
    expect(
      screen.getByRole("link", { name: "self-host Tambo" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/tambo-ai/tambo/blob/main/SELF-HOSTING.md",
    );
    expect(screen.getByRole("link", { name: "Charming" })).toHaveAttribute(
      "href",
      "https://usecharming.com",
    );
  });
});
