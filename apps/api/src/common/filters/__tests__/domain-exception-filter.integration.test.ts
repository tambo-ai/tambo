import { Controller, Get, INestApplication, Query } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import {
  DomainError,
  InputValidationError,
  NotFoundError,
} from "@tambo-ai-cloud/core";
import request from "supertest";
import { DomainExceptionFilter } from "../domain-exception.filter";
import { SentryExceptionFilter } from "../sentry-exception.filter";

/**
 * Minimal controller that throws domain errors so we can verify the full
 * NestJS exception-filter chain (filter registration order matters).
 */
@Controller("test-domain-errors")
class TestDomainErrorController {
  @Get("validation")
  throwValidation() {
    throw new InputValidationError(
      "Project does not allow overriding the system prompt with initial messages",
    );
  }

  @Get("not-found")
  throwNotFound() {
    throw new NotFoundError("Project with ID abc not found");
  }

  @Get("conflict")
  throwConflict() {
    throw new DomainError("conflict", "Resource already exists");
  }

  @Get("forbidden")
  throwForbidden() {
    throw new DomainError("forbidden", "Access denied");
  }

  @Get("generic")
  throwGeneric(@Query("msg") msg: string) {
    throw new Error(msg || "unexpected failure");
  }
}

describe("DomainExceptionFilter integration (full filter chain)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [TestDomainErrorController],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Register filters in the same order as main.ts — this is what we're testing.
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(
      new SentryExceptionFilter(httpAdapter),
      new DomainExceptionFilter(),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 400 for InputValidationError", async () => {
    const res = await request(app.getHttpServer())
      .get("/test-domain-errors/validation")
      .expect(400)
      .expect("Content-Type", /application\/problem\+json/);

    expect(res.body).toMatchObject({
      status: 400,
      title: "Bad Request",
      detail:
        "Project does not allow overriding the system prompt with initial messages",
    });
  });

  it("should return 404 for NotFoundError", async () => {
    const res = await request(app.getHttpServer())
      .get("/test-domain-errors/not-found")
      .expect(404)
      .expect("Content-Type", /application\/problem\+json/);

    expect(res.body).toMatchObject({
      status: 404,
      title: "Not Found",
      detail: "Project with ID abc not found",
    });
  });

  it("should return 409 for conflict DomainError", async () => {
    const res = await request(app.getHttpServer())
      .get("/test-domain-errors/conflict")
      .expect(409)
      .expect("Content-Type", /application\/problem\+json/);

    expect(res.body).toMatchObject({
      status: 409,
      title: "Conflict",
    });
  });

  it("should return 403 for forbidden DomainError", async () => {
    const res = await request(app.getHttpServer())
      .get("/test-domain-errors/forbidden")
      .expect(403)
      .expect("Content-Type", /application\/problem\+json/);

    expect(res.body).toMatchObject({
      status: 403,
      title: "Forbidden",
    });
  });

  it("should still return 500 for non-domain errors (SentryExceptionFilter fallback)", async () => {
    await request(app.getHttpServer())
      .get("/test-domain-errors/generic")
      .expect(500);
  });
});
