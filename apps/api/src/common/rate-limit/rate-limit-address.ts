import { isIP } from "node:net";

export function normalizeRateLimitAddress(address: string | undefined): string {
  if (!address) {
    return "unknown";
  }

  const normalizedAddress = address.split("%")[0].toLowerCase();
  if (normalizedAddress.startsWith("::ffff:")) {
    const mappedAddress = normalizedAddress.slice("::ffff:".length);
    if (isIP(mappedAddress) === 4) {
      return mappedAddress;
    }
  }
  if (isIP(normalizedAddress) === 4) {
    return normalizedAddress;
  }
  if (isIP(normalizedAddress) !== 6) {
    return "unknown";
  }

  const [left, right = ""] = normalizedAddress.split("::");
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  if (leftParts.length + rightParts.length > 8) {
    return "unknown";
  }

  const missingParts = 8 - leftParts.length - rightParts.length;
  const expanded = [
    ...leftParts,
    ...Array.from({ length: missingParts }, () => "0"),
    ...rightParts,
  ].map((part) => part.padStart(4, "0"));

  return `ipv6:${expanded.slice(0, 4).join(":")}`;
}
