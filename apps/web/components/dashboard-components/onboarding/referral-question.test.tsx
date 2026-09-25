import { createTRPCTestProvider } from "@/__mocks__/trpc-test-provider";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { REFERRAL_SOURCES } from "@tambo-ai-cloud/core";
import { TamboGettingStartedGuide } from "./getting-started-guide";
import { TamboReferralQuestion } from "./referral-question";

it("keeps the referral optional and submits it through the existing mutation", async () => {
  const user = userEvent.setup();
  const request = jest.fn(async () => ({ success: true }));
  const { Wrapper, queryClient } = createTRPCTestProvider(request);
  const { unmount } = render(<TamboReferralQuestion />, { wrapper: Wrapper });
  expect(request).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Save answer" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await user.click(screen.getByRole("radio", { name: REFERRAL_SOURCES[0] }));
  await user.click(screen.getByRole("button", { name: "Save answer" }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith("user.saveReferralSource", {
      source: REFERRAL_SOURCES[0],
    }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent("Thanks");
  unmount();
  queryClient.clear();
});

it("preserves the selection after a failed save and allows retry", async () => {
  const user = userEvent.setup();
  const request = jest
    .fn()
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValue({ success: true });
  const { Wrapper, queryClient } = createTRPCTestProvider(request);
  const { unmount } = render(<TamboReferralQuestion />, { wrapper: Wrapper });
  await user.click(screen.getByRole("radio", { name: REFERRAL_SOURCES[0] }));
  await user.click(screen.getByRole("button", { name: "Save answer" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "continue creating your project",
  );
  expect(
    screen.getByRole("radio", { name: REFERRAL_SOURCES[0] }),
  ).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Save answer" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Thanks");
  expect(request).toHaveBeenCalledTimes(2);
  unmount();
  queryClient.clear();
});

it("sends one referral request when submit events arrive before the pending render", async () => {
  const user = userEvent.setup();
  const request = jest.fn(async () => ({ success: true }));
  const { Wrapper, queryClient } = createTRPCTestProvider(request);
  const { unmount } = render(<TamboReferralQuestion />, { wrapper: Wrapper });

  try {
    await user.click(screen.getByRole("radio", { name: REFERRAL_SOURCES[0] }));
    const form = screen
      .getByRole("button", { name: "Save answer" })
      .closest("form");
    if (!form)
      throw new Error("The save button must belong to the referral form");

    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    expect(request).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("status")).toHaveTextContent("Thanks");
  } finally {
    unmount();
    queryClient.clear();
  }
});

it("keeps a selected answer available after the project is created", async () => {
  const user = userEvent.setup();
  const request = jest.fn(async () => ({ success: true }));
  const { Wrapper, queryClient } = createTRPCTestProvider(request);
  const props = {
    onCreateProject: jest.fn(),
    onRetryLoad: jest.fn(),
    referralQuestion: <TamboReferralQuestion />,
  };
  const { rerender, unmount } = render(
    <TamboGettingStartedGuide
      {...props}
      state={{ status: "needs-project", creation: "idle" }}
    />,
    { wrapper: Wrapper },
  );
  await user.click(screen.getByRole("radio", { name: REFERRAL_SOURCES[0] }));
  rerender(
    <TamboGettingStartedGuide
      {...props}
      state={{
        status: "project-created",
        project: { id: "project-1", name: "My project" },
      }}
    />,
  );
  expect(
    screen.getByRole("radio", { name: REFERRAL_SOURCES[0] }),
  ).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Save answer" }));
  expect(await screen.findByText("Thanks for letting us know.")).toBeVisible();
  unmount();
  queryClient.clear();
});
