import ipaddr from "ipaddr.js";

// CIDR ranges that must never be reachable from the server. Used by both
// write-time URL validation (`apps/web/lib/urlSecurity.ts`) and connect-time
// DNS pinning (`./safe-fetch.ts`). Keep both layers in sync via this single
// source of truth.
//
// IPv4-mapped IPv6 addresses (`::ffff:0:0/96`) are not listed here; they are
// decoded to their underlying v4 address and re-checked against the v4 list.
const UNSAFE_V4_RANGES: [ipaddr.IPv4, number][] = (
  [
    ["0.0.0.0", 8], // "this network"
    ["10.0.0.0", 8], // RFC 1918
    ["100.64.0.0", 10], // RFC 6598 CGNAT (used by some cloud overlays)
    ["127.0.0.0", 8], // Loopback
    ["169.254.0.0", 16], // RFC 3927 link-local (incl. 169.254.169.254 IMDS)
    ["172.16.0.0", 12], // RFC 1918
    ["192.0.0.0", 24], // IETF protocol assignments
    ["192.0.2.0", 24], // TEST-NET-1 (RFC 5737)
    ["192.168.0.0", 16], // RFC 1918
    ["198.18.0.0", 15], // RFC 2544 benchmarking
    ["198.51.100.0", 24], // TEST-NET-2
    ["203.0.113.0", 24], // TEST-NET-3
    ["224.0.0.0", 4], // Multicast
    ["240.0.0.0", 4], // Reserved (incl. 255.255.255.255 broadcast)
  ] as const
).map(([addr, prefix]) => [ipaddr.IPv4.parse(addr), prefix]);

const UNSAFE_V6_RANGES: [ipaddr.IPv6, number][] = (
  [
    ["::", 128], // Unspecified
    ["::1", 128], // Loopback
    ["64:ff9b::", 96], // NAT64
    ["100::", 64], // Discard prefix (RFC 6666)
    ["2001::", 32], // Teredo
    ["2001:db8::", 32], // Documentation
    ["fc00::", 7], // RFC 4193 ULA (incl. AWS IPv6 IMDS at fd00:ec2::254)
    ["fe80::", 10], // Link-local
    ["ff00::", 8], // Multicast
  ] as const
).map(([addr, prefix]) => [ipaddr.IPv6.parse(addr), prefix]);

/** Returns true if the IP literal belongs to a range that must not be reached from the server. */
export const isUnsafeIP = (address: string): boolean => {
  let parsed: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    parsed = ipaddr.parse(address);
  } catch {
    // Anything that doesn't parse as an IP literal is suspect at this layer —
    // callers always feed real DNS resolution results here.
    return true;
  }

  if (parsed.kind() === "ipv6") {
    const v6 = parsed as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      const v4 = v6.toIPv4Address();
      return UNSAFE_V4_RANGES.some(([range, prefix]) =>
        v4.match(range, prefix),
      );
    }
    return UNSAFE_V6_RANGES.some(([range, prefix]) => v6.match(range, prefix));
  }

  const v4 = parsed as ipaddr.IPv4;
  return UNSAFE_V4_RANGES.some(([range, prefix]) => v4.match(range, prefix));
};
