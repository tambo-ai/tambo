import { Injectable, Scope } from "@nestjs/common";

import { createTestRequestContext } from "./create-test-request-context";
import { createTestingModule } from "./create-testing-module";
import { resolveRequestScopedProvider } from "./resolve-request-scoped-provider";
import { assertTrue, type IsAny, type IsUnknown } from "./type-assertions";

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

      // Compile-time checks: string/symbol tokens should resolve to `unknown` and never `any`.
      assertTrue<IsUnknown<typeof value>>(true);
      assertTrue<IsAny<typeof value> extends false ? true : false>(true);
      expect(value).toBe(123);
    } finally {
      await module.close();
    }
  });
});
