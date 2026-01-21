import { Injectable, Scope } from "@nestjs/common";

import { createTestRequestContext } from "./create-test-request-context";
import { createTestingModule } from "./create-testing-module";
import { resolveRequestScopedProvider } from "./resolve-request-scoped-provider";

@Injectable()
class ExampleDependencyService {
  getValue() {
    return "real";
  }
}

@Injectable({ scope: Scope.REQUEST })
class ExampleRequestScopedService {
  constructor(private readonly dep: ExampleDependencyService) {}

  getValue() {
    return this.dep.getValue();
  }
}

describe("NestJS unit test helpers", () => {
  it("supports overriding providers and resolving request-scoped providers", async () => {
    const module = await createTestingModule(
      {
        providers: [ExampleDependencyService, ExampleRequestScopedService],
      },
      (builder) =>
        builder.overrideProvider(ExampleDependencyService).useValue({
          getValue: () => "mocked",
        }),
    );

    const context = createTestRequestContext();

    try {
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
});
