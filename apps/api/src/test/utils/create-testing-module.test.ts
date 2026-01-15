import { Injectable } from "@nestjs/common";

import { createTestingModule } from "./create-testing-module";

@Injectable()
class ExampleDepService {
  getValue() {
    return "real";
  }
}

@Injectable()
class ExampleService {
  constructor(private readonly dep: ExampleDepService) {}

  getValue() {
    return this.dep.getValue();
  }
}

describe("createTestingModule", () => {
  it("compiles a module and applies optional builder configuration", async () => {
    const module = await createTestingModule(
      {
        providers: [ExampleDepService, ExampleService],
      },
      (builder) =>
        builder.overrideProvider(ExampleDepService).useValue({
          getValue: () => "mocked",
        }),
    );

    try {
      const service = module.get(ExampleService);
      expect(service.getValue()).toBe("mocked");
    } finally {
      await module.close();
    }
  });
});
