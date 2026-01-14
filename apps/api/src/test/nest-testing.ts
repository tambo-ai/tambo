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
