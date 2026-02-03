import { formatDate } from "./format-date";

describe("formatDate", () => {
  it("formats a date string to Month DD, YYYY format", () => {
    expect(formatDate("2025-10-28")).toBe("October 28, 2025");
  });

  it("formats January date correctly", () => {
    expect(formatDate("2024-01-01")).toBe("January 1, 2024");
  });

  it("formats December date correctly", () => {
    expect(formatDate("2023-12-31")).toBe("December 31, 2023");
  });

  it("handles single digit days", () => {
    expect(formatDate("2024-06-05")).toBe("June 5, 2024");
  });
});
