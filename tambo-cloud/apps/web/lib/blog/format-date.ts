/**
 * Formats a date string from YYYY-MM-DD to "Month DD, YYYY" format.
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string like "October 28, 2025"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00"); // Add time to avoid timezone issues
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
