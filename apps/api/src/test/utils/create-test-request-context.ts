import { ContextIdFactory, type ContextId } from "@nestjs/core";

export type TestRequestContext<TRequest extends Record<string, unknown>> = {
  readonly contextId: ContextId;
  readonly request: TRequest;
};

export function createTestRequestContext(): TestRequestContext<
  Record<string, unknown>
>;
export function createTestRequestContext<
  TRequest extends Record<string, unknown>,
>(request: TRequest): TestRequestContext<TRequest>;
export function createTestRequestContext<
  TRequest extends Record<string, unknown>,
>(
  request?: TRequest,
): TestRequestContext<Record<string, unknown>> | TestRequestContext<TRequest> {
  if (request === undefined) {
    return {
      contextId: ContextIdFactory.create(),
      request: {},
    };
  }

  return {
    contextId: ContextIdFactory.create(),
    request,
  };
}
