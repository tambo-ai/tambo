import { createTRPCTestProvider } from "@/__mocks__/trpc-test-provider";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "next-auth/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { PropsWithChildren } from "react";
import DashboardPage from "./page";

function renderDashboard(
  request: (path: string, input: unknown) => Promise<unknown>,
) {
  const { Wrapper, queryClient } = createTRPCTestProvider(request);
  const router = {
    bfcacheId: "test-dashboard",
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    hmrRefresh: jest.fn(),
  };
  function Providers({ children }: PropsWithChildren) {
    return (
      <SessionProvider
        session={{
          expires: "2099-01-01",
          user: { id: "user-1", name: "Developer", email: "dev@example.com" },
        }}
        refetchOnWindowFocus={false}
      >
        <AppRouterContext.Provider value={router}>
          <Wrapper>{children}</Wrapper>
        </AppRouterContext.Provider>
      </SessionProvider>
    );
  }
  return { ...render(<DashboardPage />, { wrapper: Providers }), queryClient };
}

function dashboardResponse(path: string) {
  if (path === "project.getTotalMessageUsage") return { totalMessages: 0 };
  if (path === "project.getTotalUsers") return { totalUsers: 0 };
  throw new Error(`Unexpected request: ${path}`);
}

it("creates a project through the existing API and retains the next step after refreshing projects", async () => {
  const user = userEvent.setup();
  const project = { id: "project-1", name: "Support assistant" };
  const created: (typeof project)[] = [];
  const request = jest.fn(async (path: string, input: unknown) => {
    if (path === "project.getUserProjects") return created;
    if (path === "project.createProject2") {
      expect(input).toEqual({ name: "Support assistant" });
      created.push(project);
      return project;
    }
    return dashboardResponse(path);
  });
  const { unmount, queryClient } = renderDashboard(request);
  await screen.findByRole("heading", { name: "Create your first project" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.type(
    screen.getByLabelText("Project name"),
    "  Support assistant  ",
  );
  await user.click(screen.getByRole("button", { name: "Create project" }));
  const nextStep = await screen.findByRole("heading", {
    name: "Connect Support assistant",
  });
  await waitFor(() => expect(nextStep).toHaveFocus());
  expect(
    screen.getByRole("link", { name: "Open project dashboard" }),
  ).toHaveAttribute("href", "/project-1");
  expect(screen.getByRole("textbox", { name: "Create command" })).toHaveValue(
    "npm create tambo-app@latest my-tambo-app",
  );
  expect(
    request.mock.calls.filter(([path]) => path === "project.createProject2"),
  ).toHaveLength(1);
  expect(
    request.mock.calls.some(([path]) => path === "project.addProviderKey"),
  ).toBe(false);
  unmount();
  queryClient.clear();
});

it("retains the entered name after creation failure and retries the mutation", async () => {
  const user = userEvent.setup();
  let attempts = 0;
  const request = jest.fn(async (path: string) => {
    if (path === "project.getUserProjects") return [];
    if (path === "project.createProject2") {
      if (++attempts === 1) throw new Error("Request failed");
      return { id: "project-2", name: "Saved name" };
    }
    return dashboardResponse(path);
  });
  const { unmount, queryClient } = renderDashboard(request);
  await user.type(await screen.findByLabelText("Project name"), "Saved name");
  await user.click(screen.getByRole("button", { name: "Create project" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn't create");
  expect(screen.getByLabelText("Project name")).toHaveValue("Saved name");
  await user.click(screen.getByRole("button", { name: "Create project" }));
  await screen.findByRole("heading", { name: "Connect Saved name" });
  expect(attempts).toBe(2);
  unmount();
  queryClient.clear();
});

it("does not offer duplicate creation when the project is saved but list refresh fails", async () => {
  const user = userEvent.setup();
  let created = false;
  const request = jest.fn(async (path: string) => {
    if (path === "project.getUserProjects") {
      if (created) throw new Error("List unavailable");
      return [];
    }
    if (path === "project.createProject2") {
      created = true;
      return { id: "project-3", name: "Created project" };
    }
    return dashboardResponse(path);
  });
  const { unmount, queryClient } = renderDashboard(request);
  await user.type(
    await screen.findByLabelText("Project name"),
    "Created project",
  );
  await user.click(screen.getByRole("button", { name: "Create project" }));
  await screen.findByRole("heading", { name: "Connect Created project" });
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  expect(
    screen.queryByRole("button", { name: "Create project" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Open project dashboard" }),
  ).toHaveAttribute("href", "/project-3");
  unmount();
  queryClient.clear();
});

it("disables submission until project creation resolves", async () => {
  const user = userEvent.setup();
  const completions: ((project: { id: string; name: string }) => void)[] = [];
  const request = jest.fn(async (path: string) => {
    if (path === "project.getUserProjects") return [];
    if (path === "project.createProject2") {
      return await new Promise((resolve) => completions.push(resolve));
    }
    return dashboardResponse(path);
  });
  const { unmount, queryClient } = renderDashboard(request);
  await user.type(
    await screen.findByLabelText("Project name"),
    "Pending project",
  );
  await user.dblClick(screen.getByRole("button", { name: "Create project" }));
  expect(
    await screen.findByRole("button", { name: "Creating project…" }),
  ).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByLabelText("Project name")).toBeDisabled();
  expect(completions).toHaveLength(1);
  completions[0]({ id: "project-4", name: "Pending project" });
  await screen.findByRole("heading", { name: "Connect Pending project" });
  unmount();
  queryClient.clear();
});

it("retries the project query after an initial load failure", async () => {
  const user = userEvent.setup();
  let reads = 0;
  const request = jest.fn(async (path: string) => {
    if (path === "project.getUserProjects") {
      if (++reads === 1) throw new Error("Offline");
      return [];
    }
    return dashboardResponse(path);
  });
  const { unmount, queryClient } = renderDashboard(request);
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn't load");
  expect(screen.queryByLabelText("Project name")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByLabelText("Project name")).toBeEnabled();
  expect(reads).toBe(2);
  unmount();
  queryClient.clear();
});

it("keeps the regular dashboard and create dialog for existing projects", async () => {
  const user = userEvent.setup();
  const request = jest.fn(async (path: string) => {
    if (path === "project.getUserProjects")
      return [
        {
          id: "existing",
          name: "Existing app",
          createdAt: "2026-01-14T00:00:00.000Z",
        },
      ];
    return dashboardResponse(path);
  });
  const { unmount, queryClient } = renderDashboard(request);
  await screen.findByRole("heading", { name: "Projects" });
  expect(screen.getByText("Existing app")).toBeInTheDocument();
  expect(screen.queryByText("Build your first AI app")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /create project/i }));
  expect(await screen.findByRole("dialog")).toBeVisible();
  unmount();
  queryClient.clear();
});
