import { render } from "@testing-library/react";
import { TamboProviderWrapper } from "./tambo-provider";

// --- Mocks ---

let mockSessionData: unknown = null;
jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: mockSessionData, status: "authenticated" }),
}));

let capturedUserToken: string | undefined;
jest.mock("@tambo-ai/react", () => ({
  TamboProvider: (props: { userToken?: string; children: React.ReactNode }) => {
    capturedUserToken = props.userToken;
    return <div data-testid="tambo-provider">{props.children}</div>;
  },
  currentPageContextHelper: {},
}));

jest.mock("@/lib/tambo/config", () => ({
  tamboRegisteredComponents: [],
}));

// --- Tests ---

describe("TamboProviderWrapper", () => {
  beforeEach(() => {
    mockSessionData = null;
    capturedUserToken = undefined;
  });

  it("passes userToken from useSession to TamboProvider", () => {
    mockSessionData = { user: { id: "1", userToken: "session-token-123" } };

    render(
      <TamboProviderWrapper>
        <div>child</div>
      </TamboProviderWrapper>,
    );

    expect(capturedUserToken).toBe("session-token-123");
  });

  it("passes undefined when session has no userToken", () => {
    mockSessionData = { user: { id: "1" } };

    render(
      <TamboProviderWrapper>
        <div>child</div>
      </TamboProviderWrapper>,
    );

    expect(capturedUserToken).toBeUndefined();
  });

  it("passes undefined when there is no session", () => {
    mockSessionData = null;

    render(
      <TamboProviderWrapper>
        <div>child</div>
      </TamboProviderWrapper>,
    );

    expect(capturedUserToken).toBeUndefined();
  });

  it("updates userToken when session refreshes", () => {
    mockSessionData = { user: { id: "1", userToken: "old-token" } };

    const { rerender } = render(
      <TamboProviderWrapper>
        <div>child</div>
      </TamboProviderWrapper>,
    );

    expect(capturedUserToken).toBe("old-token");

    // Simulate session refresh with new token
    mockSessionData = { user: { id: "1", userToken: "refreshed-token" } };

    rerender(
      <TamboProviderWrapper>
        <div>child</div>
      </TamboProviderWrapper>,
    );

    expect(capturedUserToken).toBe("refreshed-token");
  });
});
