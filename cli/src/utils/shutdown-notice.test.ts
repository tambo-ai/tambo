import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  formatShutdownNotice,
  SELF_HOSTING_URL,
  showShutdownNotice,
  SHUTDOWN_ANNOUNCEMENT_URL,
  SHUTDOWN_NOTICE_ENV_VAR,
} from "./shutdown-notice.js";

describe("formatShutdownNotice", () => {
  it("includes the shutdown date, closed signups, and links", () => {
    const notice = formatShutdownNotice();

    expect(notice).toContain("Tambo Cloud is shutting down");
    expect(notice).toContain("New signups are closed");
    expect(notice).toContain("October 31, 2026");
    expect(notice).toContain("November 30, 2026");
    expect(notice).toContain(SHUTDOWN_ANNOUNCEMENT_URL);
    expect(notice).toContain(SELF_HOSTING_URL);
  });
});

describe("showShutdownNotice", () => {
  let warnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    delete process.env[SHUTDOWN_NOTICE_ENV_VAR];
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env[SHUTDOWN_NOTICE_ENV_VAR];
    warnSpy.mockRestore();
  });

  it("prints the notice to stderr and marks it as shown", () => {
    showShutdownNotice();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(`${warnSpy.mock.calls[0][0]}`).toContain(
      "Tambo Cloud is shutting down",
    );
    expect(process.env[SHUTDOWN_NOTICE_ENV_VAR]).toBe("1");
  });

  it("prints only once per process", () => {
    showShutdownNotice();
    showShutdownNotice();

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("skips the notice when a parent process already showed it", () => {
    process.env[SHUTDOWN_NOTICE_ENV_VAR] = "1";

    showShutdownNotice();

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
