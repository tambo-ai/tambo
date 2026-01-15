import { render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

const getProjectMessageUsageUseQueryMock = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    project: {
      getProjectMessageUsage: {
        useQuery: (...args: unknown[]) =>
          getProjectMessageUsageUseQueryMock(...args),
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
});
