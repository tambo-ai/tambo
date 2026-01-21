import { Injectable, Scope } from "@nestjs/common";

import { createTestRequestContext } from "./create-test-request-context";
import { createTestingModule } from "./create-testing-module";
import { resolveRequestScopedProvider } from "./resolve-request-scoped-provider";

@Injectable()
class ExampleDepService {
  getValue() {
    return "real";
  }
}

@Injectable({ scope: Scope.REQUEST })
class ExampleRequestScopedService {
  constructor(private readonly dep: ExampleDepService) {}

  getValue() {
    return this.dep.getValue();
  }
}

describe("resolveRequestScopedProvider", () => {
  it("resolves request-scoped providers", async () => {
    const module = await createTestingModule(
      {
        providers: [ExampleDepService, ExampleRequestScopedService],
      },
      (builder) =>
        builder.overrideProvider(ExampleDepService).useValue({
          getValue: () => "mocked",
        }),
    );

    try {
      const context = createTestRequestContext({
        headers: {
          authorization: "Bearer test",
        },
      });

      const service = await resolveRequestScopedProvider(
        module,
        ExampleRequestScopedService,
        context,
      );

      expect(service.getValue()).toBe("mocked");
    } finally {
      await module.close();
    }
  });

  it("resolves string/symbol providers with an unknown return type", async () => {
    const token = Symbol("EXAMPLE_TOKEN");
    const module = await createTestingModule({
      providers: [
        {
          provide: token,
          useValue: 123,
        },
      ],
    });

    try {
      const context = createTestRequestContext();
      const value = await resolveRequestScopedProvider(module, token, context);

      // Compile-time guards:
      // - Token overload should stay `unknown` so callers can't pretend token-based providers are type-safe.
      // - It should also not accidentally widen to `any`.
      // If `typeof value` ever becomes a concrete type (e.g. `number`), this will fail.
      // It still allows `any`, which is handled by the next assertion.
      "test" as unknown satisfies typeof value;

      // @ts-expect-error token overload should return `unknown` (not `any` or a concrete type)
      value satisfies number;
      expect(value).toBe(123);
    } finally {
      await module.close();
    }
  });
});
