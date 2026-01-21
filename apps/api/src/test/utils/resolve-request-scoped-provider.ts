import type { Type } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";

import type { TestRequestContext } from "./create-test-request-context";

/**
 * Resolves a request-scoped provider for a synthetic test request.
 *
 * `context.request` should mimic the shape of the real request object used with
 * `ContextIdFactory.getByRequest(...)` in the application (e.g. an HTTP request).
 *
 * Callers must close the `TestingModule` via `await module.close()`.
 */
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
