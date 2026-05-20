import { safeLookup } from "./safe-fetch";

jest.mock("dns", () => ({
  __esModule: true,
  default: {
    lookup: jest.fn(),
  },
}));

import dns from "dns";

const mockedLookup = dns.lookup as unknown as jest.Mock;

const callLookup = async (
  hostname: string,
  options: Parameters<typeof safeLookup>[1] = { all: true },
) =>
  await new Promise<{ err: NodeJS.ErrnoException | null; result: unknown }>(
    (resolve) => {
      safeLookup(hostname, options, (err, result) =>
        resolve({ err, result: result }),
      );
    },
  );

describe("safeLookup", () => {
  beforeEach(() => {
    mockedLookup.mockReset();
  });

  it("returns all addresses when every resolved IP is public", async () => {
    mockedLookup.mockImplementation((_h, _o, cb) =>
      cb(null, [
        { address: "8.8.8.8", family: 4 },
        { address: "2606:4700:4700::1111", family: 6 },
      ]),
    );
    const { err, result } = await callLookup("public.example", { all: true });
    expect(err).toBeNull();
    expect(result).toEqual([
      { address: "8.8.8.8", family: 4 },
      { address: "2606:4700:4700::1111", family: 6 },
    ]);
  });

  it("rejects with EHOSTUNREACH when any resolved IP is unsafe", async () => {
    mockedLookup.mockImplementation((_h, _o, cb) =>
      cb(null, [
        { address: "8.8.8.8", family: 4 },
        { address: "::1", family: 6 },
      ]),
    );
    const { err, result } = await callLookup("attacker.example", {
      all: true,
    });
    expect(err).not.toBeNull();
    expect(err?.code).toBe("EHOSTUNREACH");
    expect(err?.message).toContain("::1");
    expect(result).toBe("");
  });

  it("rejects IPv6 IMDS even if a public IPv4 is also returned (dual-stack rebind)", async () => {
    mockedLookup.mockImplementation((_h, _o, cb) =>
      cb(null, [
        { address: "1.2.3.4", family: 4 },
        { address: "fd00:ec2::254", family: 6 },
      ]),
    );
    const { err } = await callLookup("attacker.example", { all: true });
    expect(err?.code).toBe("EHOSTUNREACH");
    expect(err?.message).toContain("fd00:ec2::254");
  });

  it("rejects IPv4-mapped IPv6 loopback", async () => {
    mockedLookup.mockImplementation((_h, _o, cb) =>
      cb(null, [{ address: "::ffff:127.0.0.1", family: 6 }]),
    );
    const { err } = await callLookup("attacker.example", { all: true });
    expect(err?.code).toBe("EHOSTUNREACH");
  });

  it("propagates DNS resolution errors", async () => {
    const dnsErr = Object.assign(new Error("NXDOMAIN"), {
      code: "ENOTFOUND",
    });
    mockedLookup.mockImplementation((_h, _o, cb) => cb(dnsErr));
    const { err, result } = await callLookup("does-not-exist.example");
    expect(err).toBe(dnsErr);
    expect(result).toBe("");
  });
});
