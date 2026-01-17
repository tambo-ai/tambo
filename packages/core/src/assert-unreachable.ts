export class UnreachableCaseError extends Error {
  constructor(value: never) {
    super(`Unreachable case: ${value}`);
    this.name = "UnreachableCaseError";
  }
}

export function assertUnreachable(value: never): never {
  throw new UnreachableCaseError(value);
}
