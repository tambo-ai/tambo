import { render, screen } from "@testing-library/react";

const getUserProjectsUseQueryMock = jest.fn();
const getApiKeysUseQueryMock = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    project: {
      getUserProjects: {
        useQuery: (...args: unknown[]) => getUserProjectsUseQueryMock(...args),
      },
      getApiKeys: {
        useQuery: (...args: unknown[]) => getApiKeysUseQueryMock(...args),
      },
    },
  },
}));

jest.mock(
  "@/components/dashboard-components/project-details/daily-messages-chart",
  () => ({
    DailyMessagesChart: () => <div>DailyMessagesChart</div>,
  }),
);

jest.mock(
  "@/components/dashboard-components/project-details/project-info",
  () => ({
    ProjectInfo: ({
      createdAt,
    }: {
      project: unknown;
      createdAt?: string | undefined;
    }) => <div>CreatedAt: {createdAt ?? "none"}</div>,
  }),
);

import { ProjectOverview } from "./project-overview";

describe("ProjectOverview", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getApiKeysUseQueryMock.mockReturnValue({
      data: [{ id: "key_1" }],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it("shows the create API key callout when the API keys query returns an empty array", () => {
    getUserProjectsUseQueryMock.mockImplementation(
      (_input: unknown, opts?: { select?: (projects: any[]) => unknown }) => ({
        data: opts?.select?.([
          {
            id: "proj_1",
            createdAt: "2026-01-14T00:00:00.000Z",
          },
        ]),
        isLoading: false,
      }),
    );

    getApiKeysUseQueryMock.mockReturnValueOnce({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<ProjectOverview projectId="proj_1" />);

    expect(screen.getByText("Create an API key")).toBeInTheDocument();
  });

  it("shows the API keys error callout when the API keys query errors", () => {
    getUserProjectsUseQueryMock.mockImplementation(
      (_input: unknown, opts?: { select?: (projects: any[]) => unknown }) => ({
        data: opts?.select?.([
          {
            id: "proj_1",
            createdAt: "2026-01-14T00:00:00.000Z",
          },
        ]),
        isLoading: false,
      }),
    );

    getApiKeysUseQueryMock.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: jest.fn(),
    });

    render(<ProjectOverview projectId="proj_1" />);

    expect(screen.getByText(/load api keys/i)).toBeInTheDocument();
  });

  it("passes through valid ISO createdAt strings to ProjectInfo", () => {
    getUserProjectsUseQueryMock.mockImplementation(
      (_input: unknown, opts?: { select?: (projects: any[]) => unknown }) => ({
        data: opts?.select?.([
          {
            id: "proj_1",
            createdAt: "2026-01-14T00:00:00.000Z",
          },
        ]),
        isLoading: false,
      }),
    );

    render(<ProjectOverview projectId="proj_1" />);

    expect(
      screen.getByText("CreatedAt: 2026-01-14T00:00:00.000Z"),
    ).toBeInTheDocument();
  });

  it("omits createdAt when it cannot be parsed", () => {
    getUserProjectsUseQueryMock.mockImplementation(
      (_input: unknown, opts?: { select?: (projects: any[]) => unknown }) => ({
        data: opts?.select?.([
          {
            id: "proj_1",
            createdAt: "not-a-date",
          },
        ]),
        isLoading: false,
      }),
    );

    render(<ProjectOverview projectId="proj_1" />);

    expect(screen.getByText("CreatedAt: none")).toBeInTheDocument();
  });

  it("passes ISO string when createdAt is a Date instance", () => {
    const createdAt = new Date("2026-01-14T00:00:00.000Z");

    getUserProjectsUseQueryMock.mockImplementation(
      (_input: unknown, opts?: { select?: (projects: any[]) => unknown }) => ({
        data: opts?.select?.([
          {
            id: "proj_1",
            createdAt,
          },
        ]),
        isLoading: false,
      }),
    );

    render(<ProjectOverview projectId="proj_1" />);

    expect(
      screen.getByText(`CreatedAt: ${createdAt.toISOString()}`),
    ).toBeInTheDocument();
  });
});
