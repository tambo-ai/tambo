import type { ModuleMetadata } from "@nestjs/common";
import {
  Test,
  type TestingModule,
  type TestingModuleBuilder,
} from "@nestjs/testing";

export async function createTestingModule(
  metadata: ModuleMetadata,
  configure?: (builder: TestingModuleBuilder) => void,
): Promise<TestingModule> {
  // Callers should close the returned module via `await module.close()`.
  const builder = Test.createTestingModule(metadata);
  configure?.(builder);
  return await builder.compile();
}
