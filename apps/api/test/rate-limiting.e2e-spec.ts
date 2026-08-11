import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AudioService } from "../src/audio/audio.service";
import { ApiKeyGuard } from "../src/projects/guards/apikey.guard";
import { BearerTokenGuard } from "../src/projects/guards/bearer-token.guard";

describe("Rate Limiting (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.RATE_LIMIT_DEFAULT = "3";
    process.env.RATE_LIMIT_STREAMING = "3";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BearerTokenGuard)
      .useValue({ canActivate: () => true })
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
    delete process.env.RATE_LIMIT_STREAMING;
  });

  it("should include rate limit headers on a throttled endpoint", async () => {
    // Use the streaming run endpoint which is decorated with @Throttle
    const response = await request(app.getHttpServer())
      .post("/v1/threads/runs")
      .send({});

    // Expect headers to be present on the successful path
    expect(response.headers["x-ratelimit-limit"]).toBeDefined();
    expect(response.headers["x-ratelimit-remaining"]).toBeDefined();
    expect(response.headers["x-ratelimit-reset"]).toBeDefined();
  });

  it("should return 429 with Problem Details body when rate limit is exceeded", async () => {
    const agent = request(app.getHttpServer());
    // Hit the streaming run endpoint repeatedly to trigger rate limiting
    const responses = [
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
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
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
      await agent.post("/v1/threads/runs").send({}),
    ];

    const rateLimited = responses.find((r) => r.status === 429);
    expect(rateLimited).toBeDefined();
    expect(rateLimited!.headers["content-type"]).toContain(
      "application/problem+json",
    );
  });
});
