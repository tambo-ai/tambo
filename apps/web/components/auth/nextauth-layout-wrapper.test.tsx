import { render, screen, waitFor } from "@testing-library/react";
import { NextAuthLayoutWrapper } from "./nextauth-layout-wrapper";

// --- Mocks ---

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

const mockSignOut = jest.fn();
let mockSession: unknown = null;
let mockStatus: string = "loading";

jest.mock("@/hooks/nextauth", () => ({
  useNextAuthSession: () => ({ data: mockSession, status: mockStatus }),
  useSignOut: () => mockSignOut,
}));

jest.mock("@/hooks/use-auto-accept-legal", () => ({
  useAutoAcceptLegal: () => ({
    isAutoAccepting: false,
    triggerAutoAccept: () => false,
    shouldRedirectToLegalPage: () => false,
  }),
}));

jest.mock("@/lib/auth-preferences", () => ({
  getAcceptedLegalVersion: () => null,
  setLegalAcceptedInBrowser: jest.fn(),
}));

let mockLegalStatus: unknown = undefined;
let mockHasCompletedOnboarding: unknown = undefined;

jest.mock("@/trpc/react", () => ({
  api: {
    user: {
      hasAcceptedLegal: {
        useQuery: () => ({ data: mockLegalStatus }),
      },
      hasCompletedOnboarding: {
        useQuery: () => ({ data: mockHasCompletedOnboarding }),
      },
    },
  },
}));

describe("NextAuthLayoutWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;
    mockStatus = "loading";
    mockLegalStatus = undefined;
    mockHasCompletedOnboarding = undefined;
  });

  it("redirects to login when there is no session", () => {
    mockStatus = "unauthenticated";

    render(
      <NextAuthLayoutWrapper>
        <p>Dashboard</p>
      </NextAuthLayoutWrapper>,
    );

    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining("/login"));
  });

  it("renders children when session has userToken and legal is accepted", () => {
    mockSession = { user: { id: "1", userToken: "valid-token" } };
    mockStatus = "authenticated";
    mockLegalStatus = { accepted: true, version: 1 };
    mockHasCompletedOnboarding = true;

    render(
      <NextAuthLayoutWrapper>
        <p>Dashboard</p>
      </NextAuthLayoutWrapper>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("calls signOut for legacy sessions missing userToken", async () => {
    mockSession = { user: { id: "1" } };
    mockStatus = "authenticated";

    render(
      <NextAuthLayoutWrapper>
        <p>Dashboard</p>
      </NextAuthLayoutWrapper>,
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackUrl: expect.stringContaining("error=SessionExpired"),
        }),
      );
    });

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("calls signOut for legacy sessions with explicit undefined userToken", async () => {
    mockSession = { user: { id: "1", userToken: undefined } };
    mockStatus = "authenticated";

    render(
      <NextAuthLayoutWrapper>
        <p>Dashboard</p>
      </NextAuthLayoutWrapper>,
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackUrl: expect.stringContaining("error=SessionExpired"),
        }),
      );
    });
  });

  it("does not call signOut when session has a valid userToken", () => {
    mockSession = { user: { id: "1", userToken: "valid-token" } };
    mockStatus = "authenticated";
    mockLegalStatus = { accepted: true, version: 1 };
    mockHasCompletedOnboarding = true;

    render(
      <NextAuthLayoutWrapper>
        <p>Dashboard</p>
      </NextAuthLayoutWrapper>,
    );

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("preserves returnUrl in the signOut callbackUrl", async () => {
    mockSession = { user: { id: "1" } };
    mockStatus = "authenticated";

    render(
      <NextAuthLayoutWrapper>
        <p>Dashboard</p>
      </NextAuthLayoutWrapper>,
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackUrl: expect.stringContaining(
            "returnUrl=" + encodeURIComponent("/dashboard"),
          ),
        }),
      );
    });
  });
});
