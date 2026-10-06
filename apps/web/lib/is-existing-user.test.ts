import type { Adapter, AdapterUser } from "next-auth/adapters";
import { isExistingUser } from "./is-existing-user";

const existingUser: AdapterUser = {
  id: "db-user-1",
  email: "existing@example.com",
  emailVerified: null,
};

function makeAdapter(overrides: Partial<Adapter> = {}): Adapter {
  return {
    getUserByAccount: jest.fn().mockResolvedValue(null),
    getUserByEmail: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

const account = { provider: "github", providerAccountId: "gh-1" };

describe("isExistingUser", () => {
  it("returns true when the provider account is already linked", async () => {
    const adapter = makeAdapter({
      getUserByAccount: jest.fn().mockResolvedValue(existingUser),
    });

    await expect(
      isExistingUser(adapter, { email: "existing@example.com", account }),
    ).resolves.toBe(true);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
  });

  it("returns true when a user with the same email exists", async () => {
    const adapter = makeAdapter({
      getUserByEmail: jest.fn().mockResolvedValue(existingUser),
    });

    await expect(
      isExistingUser(adapter, { email: "existing@example.com", account }),
    ).resolves.toBe(true);
  });

  it("returns false when neither the account nor the email exist", async () => {
    const adapter = makeAdapter();

    await expect(
      isExistingUser(adapter, { email: "new@example.com", account }),
    ).resolves.toBe(false);
  });

  it("returns false without an email or a linked account", async () => {
    const adapter = makeAdapter();

    await expect(
      isExistingUser(adapter, { email: null, account: null }),
    ).resolves.toBe(false);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
  });

  it("throws when the adapter cannot look up users", async () => {
    await expect(
      isExistingUser({}, { email: "existing@example.com", account }),
    ).rejects.toThrow(
      "Auth adapter must implement getUserByAccount and getUserByEmail",
    );
  });
});
