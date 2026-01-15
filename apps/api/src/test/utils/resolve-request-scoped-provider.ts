import type { Type } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";

import type { TestRequestContext } from "./create-test-request-context";

export async function resolveRequestScopedProvider<
  TProvider,
  TRequest extends Record<string, unknown>,
>(
  module: TestingModule,
  provider: Type<TProvider>,
  context: TestRequestContext<TRequest>,
): Promise<TProvider>;
export async function resolveRequestScopedProvider<
  TRequest extends Record<string, unknown>,
>(
  module: TestingModule,
  provider: string | symbol,
  context: TestRequestContext<TRequest>,
): Promise<unknown>;
export async function resolveRequestScopedProvider<
  TRequest extends Record<string, unknown>,
>(
  module: TestingModule,
  provider: Type<unknown> | string | symbol,
  context: TestRequestContext<TRequest>,
): Promise<unknown> {
  module.registerRequestByContextId(context.request, context.contextId);
  return await module.resolve(provider, context.contextId);
}
