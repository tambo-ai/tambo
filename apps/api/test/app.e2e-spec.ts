import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "./../src/app.module";
import { AudioService } from "./../src/audio/audio.service";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AudioService)
      .useValue({
        // Mock AudioService to avoid requiring OpenAI credentials
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("/ (GET)", () => {
    return request(app.getHttpServer())
      .get("/")
      .expect(200)
      .expect("Welcome to the Tambo AI API!");
  });
});
