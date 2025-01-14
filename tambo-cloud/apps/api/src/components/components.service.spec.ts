import { Test, TestingModule } from '@nestjs/testing';
import { ComponentsService } from './components.service';

describe('ComponentsService', () => {
  let service: ComponentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComponentsService],
    }).compile();

    service = module.get<ComponentsService>(ComponentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
