import { INestApplication, INestApplicationContext } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function generateOpenAPIConfig(
  app: INestApplication | INestApplicationContext,
) {
  const config = new DocumentBuilder()
    .setTitle("Hydra API")
    .setDescription("Hosted Hydra Backend")
    .setVersion("0.0.1")
    .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "apiKey")
    .addBearerAuth()
    .addSecurityRequirements("apiKey")
    .build();
  const document = SwaggerModule.createDocument(
    app as INestApplication,
    config,
  );
  return document;
}
