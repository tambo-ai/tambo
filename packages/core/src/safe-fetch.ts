/**
 * Re-validating DNS lookup + fetch helpers used at network sinks for any
 * user-controlled URL (custom LLM base URL, agent URL, MCP server URL).
 *
 * Why this exists: the URL validator at write time can only check the IPs the
 * authoritative DNS server returns at that moment. An attacker who controls
 * the authoritative DNS for a domain can serve a public IP during validation
 * and an internal IP (loopback, IMDS, k8s service) when the API server later
 * fetches the stored URL. This is the standard DNS-rebinding TOCTOU.
 *
 * The fix is to re-validate every IP at connection time and refuse any
 * resolution that includes an unsafe address. We do that via undici's
 * `connect.lookup` hook, which is called on every TCP connect performed
 * through the dispatcher. Use `safeFetch` (or pass `safeAgent` as a
 * dispatcher) anywhere the URL came from outside the trust boundary.
 *
 * This module imports undici and Node's `dns`; it is server-only. The pure
 * `isUnsafeIP` helper lives in `./safe-ip` and is safe to use anywhere.
 */
import dns from "dns";
import { Agent, fetch as undiciFetch } from "undici";
import { isUnsafeIP } from "./safe-ip";

interface LookupAddress {
  address: string;
  family: 4 | 6;
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

interface LookupOptions {
  family?: number;
  hints?: number;
  all?: boolean;
  verbatim?: boolean;
}

/**
 * `dns.lookup`-compatible function that refuses any result containing an
 * unsafe IP. Pass to `undici.Agent({ connect: { lookup: safeLookup } })` or
 * to `http.Agent({ lookup })` to enforce DNS pinning at connect time.
 */
export const safeLookup = (
  hostname: string,
  options: LookupOptions,
  callback: LookupCallback,
): void => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) {
      callback(err, "", 0);
      return;
    }

    const list = Array.isArray(addresses)
      ? (addresses as LookupAddress[])
      : [{ address: addresses as unknown as string, family: 4 as const }];

    // ANY unsafe address in the result set is fatal. We can't safely pick
    // a "good" address from a mixed set because the attacker controls
    // which one the OS would prefer (RFC 6724, gai.conf, etc.).
    const unsafe = list.find((a) => isUnsafeIP(a.address));
    if (unsafe) {
      const error = new Error(
        `Refusing to connect: ${hostname} resolves to unsafe address ${unsafe.address}`,
      ) as NodeJS.ErrnoException;
      error.code = "EHOSTUNREACH";
      callback(error, "", 0);
      return;
    }

    if (options.all) {
      callback(null, list);
      return;
    }
    const pick = list[0];
    callback(null, pick.address, pick.family);
  });
};

/**
 * undici Agent that pins DNS through `safeLookup`. Every TCP connection
 * dispatched through this Agent has its hostname re-resolved and re-validated
 * before connect.
 */
export const safeAgent = new Agent({
  connect: {
    // undici accepts a Node-style lookup callback here. The any-cast is
    // because the version-pinned types don't expose the option directly.
    lookup: safeLookup as never,
  },
});

/**
 * Drop-in replacement for `globalThis.fetch` that dispatches through
 * `safeAgent`. Use anywhere the URL was supplied from outside the trust
 * boundary (custom LLM base URL, agent URL, MCP server URL).
 *
 * The cast through `unknown` is required because undici's Response type
 * differs slightly from the global `Response` (header iterator types). The
 * runtime behaviour is identical.
 */
export const safeFetch = (async (
  input: RequestInfo | URL,
  init?: RequestInit,
) =>
  await undiciFetch(input as Parameters<typeof undiciFetch>[0], {
    ...(init as Parameters<typeof undiciFetch>[1]),
    dispatcher: safeAgent,
  })) as unknown as typeof globalThis.fetch;
