import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AudioService } from "../src/audio/audio.service";

describe("Rate Limiting (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.RATE_LIMIT_DEFAULT = "3";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AudioService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30_000);

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    delete process.env.RATE_LIMIT_DEFAULT;
  });

  it("should include rate limit headers on successful responses", async () => {
    const response = await request(app.getHttpServer()).get("/").expect(200);

    expect(response.headers["x-ratelimit-limit"]).toBeDefined();
    expect(response.headers["x-ratelimit-reset"]).toBeDefined();
  });

  it("should return 429 with Problem Details body when rate limit is exceeded", async () => {
    const agent = request(app.getHttpServer());
    const responses = [
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
    ];

    const rateLimited = responses.find((r) => r.status === 429);
    expect(rateLimited).toBeDefined();

    expect(rateLimited!.body).toMatchObject({
      type: "https://docs.tambo.co/reference/problems/rate-limit",
      status: 429,
      title: "Too Many Requests",
      detail: expect.stringContaining("Rate limit exceeded"),
    });

    expect(rateLimited!.headers["retry-after"]).toBeDefined();
    expect(rateLimited!.headers["x-ratelimit-limit"]).toBeDefined();
    expect(rateLimited!.headers["x-ratelimit-remaining"]).toBe("0");
    expect(rateLimited!.headers["x-ratelimit-reset"]).toBeDefined();
  });

  it("should return RFC 9457 Content-Type on 429", async () => {
    const agent = request(app.getHttpServer());
    const responses = [
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
      await agent.get("/"),
    ];

    const rateLimited = responses.find((r) => r.status === 429);
    expect(rateLimited).toBeDefined();
    expect(rateLimited!.headers["content-type"]).toContain(
      "application/problem+json",
    );
  });
});
