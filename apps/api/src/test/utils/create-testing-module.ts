import type { ModuleMetadata } from "@nestjs/common";
import {
  Test,
  type TestingModule,
  type TestingModuleBuilder,
} from "@nestjs/testing";

/**
 * Wrapper around `Test.createTestingModule(...)`.
 *
 * Note: callers must close the returned module via `await module.close()`.
 */
export async function createTestingModule(
  metadata: ModuleMetadata,
  configure?: (builder: TestingModuleBuilder) => void,
): Promise<TestingModule> {
  const builder = Test.createTestingModule(metadata);
  configure?.(builder);
  return await builder.compile();
}
