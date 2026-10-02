import { Controller, Get, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { RateLimitExceptionFilter } from "../src/common/filters/rate-limit-exception.filter";
import { RateLimitModule } from "../src/common/rate-limit/rate-limit.module";

const handler = jest.fn().mockReturnValue({ ok: true });

@Controller("test-rate-limit")
class TestRateLimitController {
  @Get()
  get() {
    return handler();
  }
}

/**
 * Exercises the real RateLimitModule (including its ConfigModule wiring and
 * env-driven limit) with a low limit so the suite stays fast. Each test
 * boots a fresh app, so request counts never leak between tests.
 */
describe("Rate limiting (e2e)", () => {
  let app: INestApplication;

  async function createApp(env: Record<string, string>): Promise<void> {
    handler.mockClear();
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value;
    }
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RateLimitModule],
      controllers: [TestRateLimitController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new RateLimitExceptionFilter());
    await app.init();
  }

  afterEach(async () => {
    delete process.env.RATE_LIMIT_DEFAULT;
    delete process.env.RATE_LIMIT_ENABLED;
    if (app) {
      await app.close();
    }
  });

  it("includes rate limit headers on successful responses", async () => {
    await createApp({ RATE_LIMIT_ENABLED: "true", RATE_LIMIT_DEFAULT: "2" });
    const response = await request(app.getHttpServer()).get("/test-rate-limit");
    expect(response.status).toBe(200);
    expect(response.headers["x-ratelimit-limit"]).toBe("2");
    expect(response.headers["x-ratelimit-remaining"]).toBe("1");
    expect(response.headers["x-ratelimit-reset"]).toBeDefined();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("rejects over-limit requests with an RFC 9457 429 without reaching the handler", async () => {
    await createApp({ RATE_LIMIT_ENABLED: "true", RATE_LIMIT_DEFAULT: "2" });
    const server = app.getHttpServer();
    await request(server).get("/test-rate-limit").expect(200);
    await request(server).get("/test-rate-limit").expect(200);
    const blocked = await request(server).get("/test-rate-limit");
    expect(blocked.status).toBe(429);
    expect(blocked.headers["content-type"]).toMatch(
      /application\/problem\+json/,
    );
    expect(blocked.headers["retry-after"]).toBeDefined();
    expect(blocked.headers["x-ratelimit-limit"]).toBe("2");
    expect(blocked.headers["x-ratelimit-remaining"]).toBe("0");
    expect(blocked.body).toMatchObject({
      type: "https://docs.tambo.co/reference/problems/rate-limit",
      status: 429,
      title: "Too Many Requests",
    });
    expect(typeof blocked.body.detail).toBe("string");
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("passes requests through untouched when not explicitly enabled", async () => {
    await createApp({ RATE_LIMIT_DEFAULT: "2" });
    const server = app.getHttpServer();
    for (let index = 0; index < 3; index++) {
      const response = await request(server).get("/test-rate-limit");
      expect(response.status).toBe(200);
      expect(response.headers["x-ratelimit-limit"]).toBeUndefined();
    }
    expect(handler).toHaveBeenCalledTimes(3);
  });
});
