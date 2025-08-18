import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import * as Sentry from "@sentry/nestjs";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { generateOpenAPIConfig } from "./common/openapi";
import { initializeSentry } from "./sentry";
import { initializeOpenTelemetry, shutdownOpenTelemetry } from "./telemetry";

async function bootstrap() {
  // Initialize Sentry FIRST, before anything else
  initializeSentry();

  // Initialize OpenTelemetry (works alongside Sentry)
  const sdk = initializeOpenTelemetry();

  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  // Security headers via Helmet (applies to all responses)
  configureHelmet(app);
  configureSwagger(app);
  app.use(json({ limit: "1mb" }));
  app.use(urlencoded({ extended: true, limit: "1mb" }));

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    if (process.env.NODE_ENV === "production") {
      console.log("SIGTERM received, shutting down...");

      // Flush Sentry and shutdown OpenTelemetry in parallel
      await Promise.all([Sentry.close(2000), shutdownOpenTelemetry(sdk)]);
    }
  });

  // Add unhandled rejection handler
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    Sentry.captureException(reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    Sentry.captureException(error);
    // Give Sentry time to send the error before crashing
    // Node's default behavior is to exit on uncaught exceptions, so we manually exit to preserve that behavior
    Sentry.close(2000).then(() => process.exit(1));
  });

  console.log("Starting server on port", process.env.PORT || 3000);
  await app.listen(process.env.PORT || 3000);
}

function configureSwagger(app: INestApplication) {
  const document = generateOpenAPIConfig(app);
  SwaggerModule.setup("api", app, document);
}

function configureHelmet(app: INestApplication) {
  const config = app.get(ConfigService);
  const env = (key: string): string | undefined =>
    config.get<string>(key) ?? process.env[key];

  const nodeEnv = env("NODE_ENV") || "development";
  const deployEnv = env("DEPLOY_ENV") || nodeEnv;

  // HSTS policy: disabled by default; enable explicitly in production via ENABLE_HSTS=true
  const enableHsts =
    (env("ENABLE_HSTS") || "false") === "true" && deployEnv === "production";

  const hstsMaxAge = Number(env("HSTS_MAX_AGE") || 15552000); // 180 days
  const hstsIncludeSubdomains =
    (env("HSTS_INCLUDE_SUBDOMAINS") || "false") === "true";
  const hstsPreload = (env("HSTS_PRELOAD") || "false") === "true";

  // Environment-specific CSP directives. These defaults are intentionally conservative and
  // aimed to support the Swagger UI while locking down framing and MIME sniffing risks.
  const cspDirectives = buildCspDirectives({ deployEnv, config });

  app.use(
    helmet({
      // Clickjacking mitigation
      frameguard: { action: "deny" },
      // MIME sniffing protection
      noSniff: true,
      // CSP (applies primarily to Swagger UI responses)
      contentSecurityPolicy: {
        useDefaults: true,
        directives: cspDirectives,
      },
      // HSTS only when explicitly enabled for production
      hsts: enableHsts
        ? {
            maxAge: hstsMaxAge,
            includeSubDomains: hstsIncludeSubdomains,
            preload: hstsPreload,
          }
        : false,
      // Keep these defaults; they don't interfere with existing CORS config
      // crossOriginEmbedderPolicy is off by default in helmet v7 for compatibility
    }),
  );
}

function buildCspDirectives({
  deployEnv,
  config,
}: {
  deployEnv: string;
  config: ConfigService;
}): Record<string, Iterable<string>> {
  // Allow overrides via env vars (comma-separated). If not set, fall back to environment defaults below.
  const env = (key: string): string | undefined =>
    config.get<string>(key) ?? process.env[key];
  const getList = (key: string, fallback: string[]): string[] => {
    const raw = env(key);
    if (!raw) return fallback;
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const common = {
    "default-src": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
    // Swagger UI loads images and fonts from self and data URIs
    "img-src": getList("CSP_IMG_SRC", ["'self'", "data:", "blob:"]),
    "font-src": getList("CSP_FONT_SRC", ["'self'", "data:"]),
  } as const;

  if (deployEnv === "development") {
    return {
      ...common,
      // Support Swagger UI; allow inline styles it relies on
      "style-src": getList("CSP_STYLE_SRC", ["'self'", "'unsafe-inline'"]),
      "script-src": getList("CSP_SCRIPT_SRC", ["'self'"]),
      // Allow local dev tools/proxies (http/https/ws/wss)
      "connect-src": getList("CSP_CONNECT_SRC", [
        "'self'",
        "http:",
        "https:",
        "ws:",
        "wss:",
      ]),
      // Do not allow embedding the API in any frame
      "frame-ancestors": getList("CSP_FRAME_ANCESTORS", ["'none'"]),
    };
  }

  if (deployEnv === "staging") {
    return {
      ...common,
      "style-src": getList("CSP_STYLE_SRC", ["'self'", "'unsafe-inline'"]),
      "script-src": getList("CSP_SCRIPT_SRC", ["'self'"]),
      "connect-src": getList("CSP_CONNECT_SRC", ["'self'"]),
      "frame-ancestors": getList("CSP_FRAME_ANCESTORS", ["'none'"]),
    };
  }

  // production (default)
  return {
    ...common,
    "style-src": getList("CSP_STYLE_SRC", ["'self'", "'unsafe-inline'"]),
    "script-src": getList("CSP_SCRIPT_SRC", ["'self'"]),
    "connect-src": getList("CSP_CONNECT_SRC", ["'self'"]),
    "frame-ancestors": getList("CSP_FRAME_ANCESTORS", ["'none'"]),
  };
}
bootstrap();
