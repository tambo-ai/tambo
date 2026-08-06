import { BoundedThrottlerStorage } from "./bounded-throttler-storage";

describe("BoundedThrottlerStorage", () => {
  it("blocks after the configured limit and reports remaining block time", async () => {
    const storage = new BoundedThrottlerStorage();

    await expect(
      storage.increment("key", 60_000, 1, 60_000, "default"),
    ).resolves.toMatchObject({ totalHits: 1, isBlocked: false });
    await expect(
      storage.increment("key", 60_000, 1, 60_000, "default"),
    ).resolves.toMatchObject({ totalHits: 2, isBlocked: true });
  });

  it("uses a shared overflow bucket instead of resetting live keys", async () => {
    const storage = new BoundedThrottlerStorage();
    for (let index = 0; index < 10_000; index++) {
      await storage.increment(`key-${index}`, 60_000, 100, 60_000, "default");
    }

    await storage.increment("new-key", 60_000, 1, 60_000, "default");
    const overflow = await storage.increment(
      "another-new-key",
      60_000,
      1,
      60_000,
      "default",
    );

    expect(overflow.isBlocked).toBe(true);
  });
});
