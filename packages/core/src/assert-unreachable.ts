class UnreachableCaseError extends Error {
  readonly value: unknown;

  constructor(value: never) {
    super("Unreachable case encountered", { cause: value });
    this.name = "UnreachableCaseError";
    this.value = value;
  }
}

export function assertUnreachable(value: never): never {
  throw new UnreachableCaseError(value);
}
