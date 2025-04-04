import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE } from "../common/middleware/db-transaction-middleware";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ProjectsService } from "../projects/projects.service";
import { ThreadsService } from "../threads/threads.service";
import { ComponentsController } from "./components.controller";
import { ComponentsService } from "./components.service";

describe("ComponentsController", () => {
  let controller: ComponentsController;

  beforeEach(async () => {
    const mockDb = {
      // Add any database methods your services use
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComponentsController],
      providers: [
        {
          provide: DATABASE,
          useValue: mockDb,
        },
        ConfigService,
        ComponentsService,
        ProjectsService,
        ThreadsService,
        CorrelationLoggerService,
      ],
    }).compile();

    controller = module.get<ComponentsController>(ComponentsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
