import { render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

const getProjectMessageUsageUseQueryMock = jest.fn();
const getProviderKeysUseQueryMock = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    project: {
      getProjectMessageUsage: {
        useQuery: (...args: unknown[]) =>
          getProjectMessageUsageUseQueryMock(...args),
      },
      getProviderKeys: {
        useQuery: (...args: unknown[]) => getProviderKeysUseQueryMock(...args),
      },
    },
  },
}));

jest.mock("@/components/copy-button", () => ({
  CopyButton: ({ clipboardValue }: { clipboardValue: string }) => (
    <button type="button">Copy {clipboardValue}</button>
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("./provider-key-section", () => ({
  FREE_MESSAGE_LIMIT: 100,
}));

import { ProjectInfo } from "./project-info";

type Project = NonNullable<ComponentProps<typeof ProjectInfo>["project"]>;

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "proj_1",
    name: "Test Project",
    userId: "user_1234567890",
    createdAt: new Date("2026-01-14T00:00:00.000Z"),
    updatedAt: null,
    customInstructions: null,
    allowSystemPromptOverride: false,
    defaultLlmProviderName: null,
    defaultLlmModelName: null,
    customLlmModelName: null,
    customLlmBaseURL: null,
    maxToolCallLimit: 10,
    isTokenRequired: false,
    providerType: null,
    agentProviderType: null,
    agentUrl: null,
    agentName: null,
    customLlmParameters: null,
    messages: 0,
    users: 0,
    lastMessageAt: null,
    ...overrides,
  };
}

describe("ProjectInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getProjectMessageUsageUseQueryMock.mockReturnValue({
      data: { messageCount: 0 },
    });
    getProviderKeysUseQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a placeholder instead of leaking invalid createdAt values", () => {
    const project = makeProject();

    render(<ProjectInfo project={project} createdAt="not-a-date" />);

    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders a placeholder for non-ISO createdAt strings", () => {
    const project = makeProject();

    render(<ProjectInfo project={project} createdAt="2026-01-14" />);

    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("formats valid ISO dates using toLocaleDateString", () => {
    const project = makeProject();

    const toLocaleDateStringSpy = jest
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockReturnValue("MOCK_DATE");

    render(
      <ProjectInfo project={project} createdAt="2026-01-14T12:34:56.000Z" />,
    );

    expect(screen.getByText("MOCK_DATE")).toBeInTheDocument();
    expect(toLocaleDateStringSpy).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
    toLocaleDateStringSpy.mockRestore();
  });

  it("formats valid ISO dates using compact options", () => {
    const project = makeProject();

    const toLocaleDateStringSpy = jest
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockReturnValue("MOCK_COMPACT_DATE");

    render(
      <ProjectInfo
        project={project}
        createdAt="2026-01-14T12:34:56.000Z"
        compact
      />,
    );

    expect(screen.getByText("MOCK_COMPACT_DATE")).toBeInTheDocument();
    expect(toLocaleDateStringSpy).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        year: "2-digit",
        month: "short",
        day: "numeric",
      }),
    );
    toLocaleDateStringSpy.mockRestore();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
  });

  it("does not invoke queries when project is missing", () => {
    render(<ProjectInfo />);

    expect(screen.getByText("No project found")).toBeInTheDocument();
    expect(getProjectMessageUsageUseQueryMock).not.toHaveBeenCalled();
    expect(getProviderKeysUseQueryMock).not.toHaveBeenCalled();
  });

  it("shows starter quota in the full layout when there are no provider keys", () => {
    const project = makeProject();
    getProjectMessageUsageUseQueryMock.mockReturnValue({
      data: { messageCount: 10 },
      isLoading: false,
      isError: false,
    });
    getProviderKeysUseQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    render(<ProjectInfo project={project} />);

    expect(screen.getByText("Starter LLM calls remaining")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("Add your LLM API Key")).toBeInTheDocument();
    expect(screen.queryByText("Provider • Model")).not.toBeInTheDocument();
  });

  it("shows provider/model summary in the full layout when provider keys exist", () => {
    const project = makeProject({
      defaultLlmProviderName: "anthropic",
      defaultLlmModelName: "claude-3-5-sonnet",
    });
    getProviderKeysUseQueryMock.mockReturnValue({
      data: [{ id: "key_1" }],
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    render(<ProjectInfo project={project} />);

    expect(screen.getByText("Provider • Model")).toBeInTheDocument();
    expect(
      screen.getByText("anthropic • claude-3-5-sonnet"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Starter LLM calls remaining"),
    ).not.toBeInTheDocument();
  });

  it("hides starter quota while key status is loading", () => {
    const project = makeProject({
      defaultLlmProviderName: "anthropic",
      defaultLlmModelName: "claude-3-5-sonnet",
    });
    getProviderKeysUseQueryMock.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: false,
      isError: false,
    });

    render(<ProjectInfo project={project} />);

    expect(screen.getByText("Provider • Model")).toBeInTheDocument();
    expect(screen.getByText("Checking key status...")).toBeInTheDocument();
    expect(
      screen.queryByText("Starter LLM calls remaining"),
    ).not.toBeInTheDocument();
  });

  it("hides starter quota when provider key status errors", () => {
    const project = makeProject({
      defaultLlmProviderName: "anthropic",
      defaultLlmModelName: "claude-3-5-sonnet",
    });
    getProviderKeysUseQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
    });

    render(<ProjectInfo project={project} />);

    expect(screen.getByText("Provider • Model")).toBeInTheDocument();
    expect(screen.getByText("Key status unavailable")).toBeInTheDocument();
    expect(
      screen.queryByText("Starter LLM calls remaining"),
    ).not.toBeInTheDocument();
  });

  it("shows a placeholder starter quota value when usage errors", () => {
    const project = makeProject();
    getProjectMessageUsageUseQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    getProviderKeysUseQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    render(<ProjectInfo project={project} />);

    expect(screen.getByText("Starter LLM calls remaining")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Add your LLM API Key")).toBeInTheDocument();
  });

  it("shows compact starter quota as a numeric value when usage is available", () => {
    const project = makeProject();
    getProjectMessageUsageUseQueryMock.mockReturnValue({
      data: { messageCount: 10 },
      isLoading: false,
      isError: false,
    });
    getProviderKeysUseQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    render(<ProjectInfo project={project} compact />);

    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("starter LLM calls left")).toBeInTheDocument();
    expect(screen.getByText("Add key")).toBeInTheDocument();
    expect(screen.queryByText("Change")).not.toBeInTheDocument();
  });

  it("shows compact starter quota as unavailable when usage is loading", () => {
    const project = makeProject();
    getProjectMessageUsageUseQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    getProviderKeysUseQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    render(<ProjectInfo project={project} compact />);

    expect(screen.getByText("Starter usage unavailable")).toBeInTheDocument();
    expect(
      screen.queryByText("starter LLM calls left"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Add key")).toBeInTheDocument();
  });
});
