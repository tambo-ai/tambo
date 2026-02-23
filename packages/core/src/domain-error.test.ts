import {
  DomainError,
  InputValidationError,
  NotFoundError,
} from "./domain-error";

describe("DomainError", () => {
  it("sets kind and message", () => {
    const error = new DomainError("validation", "bad input");
    expect(error.kind).toBe("validation");
    expect(error.message).toBe("bad input");
    expect(error.name).toBe("DomainError");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("InputValidationError", () => {
  it("has kind 'validation' and extends DomainError", () => {
    const error = new InputValidationError("field is required");
    expect(error.kind).toBe("validation");
    expect(error.message).toBe("field is required");
    expect(error.name).toBe("InputValidationError");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("has kind 'not-found' and extends DomainError", () => {
    const error = new NotFoundError("thing not found");
    expect(error.kind).toBe("not-found");
    expect(error.message).toBe("thing not found");
    expect(error.name).toBe("NotFoundError");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});
