import { render, screen } from "@testing-library/react";
import { AuthErrorBanner } from "./auth-error-banner";

let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

describe("AuthErrorBanner", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
  });

  it("renders nothing when there is no error param", () => {
    const { container } = render(<AuthErrorBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders session expired banner in amber", () => {
    mockSearchParams.set("error", "SessionExpired");
    render(<AuthErrorBanner />);

    expect(
      screen.getByText(
        "Your session has expired. Please sign in again to continue.",
      ),
    ).toBeInTheDocument();

    const card = screen
      .getByText("Your session has expired. Please sign in again to continue.")
      .closest("[class]")!;
    expect(card.className).toContain("text-amber-800");
  });

  it("renders generic auth error in red for Configuration", () => {
    mockSearchParams.set("error", "Configuration");
    render(<AuthErrorBanner />);

    expect(
      screen.getByText("Authentication failed. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByText("Server configuration error.")).toBeInTheDocument();
  });

  it("renders AccessDenied error", () => {
    mockSearchParams.set("error", "AccessDenied");
    render(<AuthErrorBanner />);

    expect(
      screen.getByText("Access denied. Please check your credentials."),
    ).toBeInTheDocument();
  });

  it("renders Verification error", () => {
    mockSearchParams.set("error", "Verification");
    render(<AuthErrorBanner />);

    expect(
      screen.getByText("Verification failed. Please try again."),
    ).toBeInTheDocument();
  });
});
