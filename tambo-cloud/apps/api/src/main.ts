import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { generateOpenAPIConfig } from "./common/openapi";
import { initializeOpenTelemetry, shutdownOpenTelemetry } from "./telemetry";

async function bootstrap() {
  // Initialize OpenTelemetry before creating the NestJS app
  const sdk = initializeOpenTelemetry();

  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  configureSwagger(app);
  app.use(json({ limit: "1mb" }));
  app.use(urlencoded({ extended: true, limit: "1mb" }));

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    // Development environments restart when files change, so we don't need to
    // shutdown OpenTelemetry
    if (process.env.NODE_ENV === "production") {
      console.log("SIGTERM received, shutting down...");
      await shutdownOpenTelemetry(sdk);
    }
  });

  console.log("Starting server on port", process.env.PORT || 3000);
  await app.listen(process.env.PORT || 3000);
}

function configureSwagger(app: INestApplication) {
  const document = generateOpenAPIConfig(app);
  SwaggerModule.setup("api", app, document);
}
bootstrap();
