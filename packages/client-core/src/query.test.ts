/**
 * Tests for query key factories
 */

import { threadKeys } from "./query";

describe("threadKeys", () => {
  it("returns base key", () => {
    expect(threadKeys.all).toEqual(["threads"]);
  });

  it("returns lists key extending all", () => {
    expect(threadKeys.lists()).toEqual(["threads", "list"]);
  });

  it("returns list key with params", () => {
    expect(threadKeys.list({ limit: 10 })).toEqual([
      "threads",
      "list",
      { limit: 10 },
    ]);
  });

  it("returns details key extending all", () => {
    expect(threadKeys.details()).toEqual(["threads", "detail"]);
  });

  it("returns detail key with threadId", () => {
    expect(threadKeys.detail("t_123")).toEqual(["threads", "detail", "t_123"]);
  });

  it("returns messages key extending detail", () => {
    expect(threadKeys.messages("t_123")).toEqual([
      "threads",
      "detail",
      "t_123",
      "messages",
    ]);
  });
});
