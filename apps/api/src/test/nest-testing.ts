import type { Type } from "@nestjs/common";
import { ContextIdFactory, type ContextId } from "@nestjs/core";
import type { TestingModule } from "@nestjs/testing";

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
export function createTestRequestContext(
  request: Record<string, unknown> = {},
): TestRequestContext<Record<string, unknown>> {
  return {
    contextId: ContextIdFactory.create(),
    request,
  };
}

export async function resolveRequestScopedProvider<
  TProvider = unknown,
  TRequest extends Record<string, unknown> = Record<string, unknown>,
>(
  module: TestingModule,
  provider: Type<TProvider> | string | symbol,
  context: TestRequestContext<TRequest>,
): Promise<TProvider> {
  module.registerRequestByContextId(context.request, context.contextId);
  return await module.resolve<TProvider>(provider, context.contextId);
}
