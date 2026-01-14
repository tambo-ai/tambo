import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

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

describe("ProjectInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getProjectMessageUsageUseQueryMock.mockReturnValue({
      data: { messageCount: 0 },
    });
  });

  it("renders a placeholder instead of leaking invalid createdAt values", () => {
    const project = {
      id: "proj_1",
      name: "Test Project",
      userId: "user_1234567890",
    } as any;

    render(<ProjectInfo project={project} createdAt="not-a-date" />);

    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("formats valid ISO dates using toLocaleDateString", () => {
    const project = {
      id: "proj_1",
      name: "Test Project",
      userId: "user_1234567890",
    } as any;

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
  });
});
