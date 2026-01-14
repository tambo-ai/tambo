import type { ModuleMetadata, Type } from "@nestjs/common";
import { ContextIdFactory, type ContextId } from "@nestjs/core";
import {
  Test,
  type TestingModule,
  type TestingModuleBuilder,
} from "@nestjs/testing";

export type TestRequestContext<TRequest extends Record<string, unknown>> = {
  readonly contextId: ContextId;
  readonly request: TRequest;
};

export function createTestingModuleBuilder(
  metadata: ModuleMetadata,
): TestingModuleBuilder {
  return Test.createTestingModule(metadata);
}

export async function createTestingModule(
  metadata: ModuleMetadata,
  configure?: (builder: TestingModuleBuilder) => void,
): Promise<TestingModule> {
  const builder = createTestingModuleBuilder(metadata);
  configure?.(builder);
  return await builder.compile();
}

export function createTestRequestContext<
  TRequest extends Record<string, unknown> = Record<string, unknown>,
>(request?: TRequest): TestRequestContext<TRequest> {
  return {
    contextId: ContextIdFactory.create(),
    request: request ?? ({} as TRequest),
  };
}

export async function resolveRequestScopedProvider<
  TInput = any,
  TResult = TInput,
  TRequest extends Record<string, unknown> = Record<string, unknown>,
>(
  module: TestingModule,
  provider: Type<TInput> | string | symbol,
  context: TestRequestContext<TRequest>,
): Promise<TResult> {
  module.registerRequestByContextId(context.request, context.contextId);
  return await module.resolve<TInput, TResult>(provider, context.contextId);
}
