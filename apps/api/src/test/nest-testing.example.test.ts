import { Injectable, Scope } from "@nestjs/common";

import {
  createTestRequestContext,
  createTestingModule,
  resolveRequestScopedProvider,
} from "./nest-testing";

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
    const service = await resolveRequestScopedProvider(
      module,
      ExampleRequestScopedService,
      context,
    );

    expect(service.getValue()).toBe("mocked");
  });
});
