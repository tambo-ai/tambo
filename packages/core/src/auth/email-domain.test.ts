import { isEmailAllowed } from "./email-domain";

describe("isEmailAllowed", () => {
  it("allows verified email when no domain restriction is configured", () => {
    expect(
      isEmailAllowed({
        email: "user@example.com",
        emailVerified: true,
        allowedDomain: undefined,
      }),
    ).toBe(true);
  });

  it("allows unverified email when no domain restriction is configured", () => {
    expect(
      isEmailAllowed({
        email: "user@example.com",
        emailVerified: false,
        allowedDomain: undefined,
      }),
    ).toBe(true);
  });

  it("allows verified email that matches the allowed domain", () => {
    expect(
      isEmailAllowed({
        email: "employee@foo.com",
        emailVerified: true,
        allowedDomain: "foo.com",
      }),
    ).toBe(true);
  });

  it("denies verified email that does not match the allowed domain", () => {
    expect(
      isEmailAllowed({
        email: "intruder@bar.com",
        emailVerified: true,
        allowedDomain: "foo.com",
      }),
    ).toBe(false);
  });

  it("denies unverified email even if domain matches", () => {
    expect(
      isEmailAllowed({
        email: "employee@foo.com",
        emailVerified: false,
        allowedDomain: "foo.com",
      }),
    ).toBe(false);
  });
});
