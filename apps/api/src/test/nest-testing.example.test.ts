import { Injectable, Scope } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import {
  createTestRequestContext,
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
    const module = await Test.createTestingModule({
      providers: [ExampleDependencyService, ExampleRequestScopedService],
    })
      .overrideProvider(ExampleDependencyService)
      .useValue({
        getValue: () => "mocked",
      })
      .compile();

    const context = createTestRequestContext();
    const service = await resolveRequestScopedProvider(
      module,
      ExampleRequestScopedService,
      context,
    );

    expect(service.getValue()).toBe("mocked");
  });
});
