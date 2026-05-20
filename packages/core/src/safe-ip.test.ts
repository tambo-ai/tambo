import { isUnsafeIP } from "./safe-ip";

describe("isUnsafeIP", () => {
  test.each([
    ["IPv4 loopback", "127.0.0.1"],
    ["IPv4 loopback range", "127.10.20.30"],
    ["RFC 1918 10/8", "10.5.6.7"],
    ["RFC 1918 172.16/12", "172.20.0.1"],
    ["RFC 1918 192.168/16", "192.168.1.1"],
    ["link-local incl. IMDS", "169.254.169.254"],
    ["CGNAT", "100.64.0.1"],
    ["0.0.0.0/8", "0.0.0.5"],
    ["multicast v4", "239.0.0.1"],
    ["broadcast", "255.255.255.255"],
    ["TEST-NET-1", "192.0.2.10"],
    ["benchmarking", "198.18.0.1"],
    ["IPv6 loopback", "::1"],
    ["IPv6 unspecified", "::"],
    ["IPv6 link-local", "fe80::1"],
    ["RFC 4193 ULA fc00", "fc00::1"],
    ["RFC 4193 ULA fcXX", "fc01::1"],
    ["RFC 4193 ULA fd00 (AWS IMDS prefix)", "fd00:ec2::254"],
    ["RFC 4193 ULA fdff", "fdff::ffff"],
    ["IPv6 multicast", "ff02::1"],
    ["IPv4-mapped IPv6 loopback", "::ffff:127.0.0.1"],
    ["IPv4-mapped IPv6 private", "::ffff:10.0.0.1"],
    ["IPv4-mapped IPv6 IMDS", "::ffff:169.254.169.254"],
    ["Teredo", "2001:0:1234::"],
    ["documentation", "2001:db8::1"],
    ["NAT64", "64:ff9b::1"],
    ["garbage", "not-an-ip"],
  ])("rejects %s (%s)", (_label, addr) => {
    expect(isUnsafeIP(addr)).toBe(true);
  });

  test.each([
    ["public IPv4", "8.8.8.8"],
    ["public IPv4 (Cloudflare)", "1.1.1.1"],
    ["public IPv6 (Cloudflare)", "2606:4700:4700::1111"],
    ["public IPv6 (Google)", "2001:4860:4860::8888"],
  ])("accepts %s (%s)", (_label, addr) => {
    expect(isUnsafeIP(addr)).toBe(false);
  });
});
