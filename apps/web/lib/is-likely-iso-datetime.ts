export function isLikelyIsoDateTimeString(value: string): boolean {
  return (
    value.length >= 16 &&
    value[4] === "-" &&
    value[7] === "-" &&
    value[10] === "T" &&
    value[13] === ":"
  );
}
