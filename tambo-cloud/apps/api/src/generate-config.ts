import { NestFactory } from "@nestjs/core";
import fs from "fs";
import { AppModule } from "./app.module";
import { generateOpenAPIConfig } from "./common/openapi";

async function generateConfig() {
  // Add some dummy keys to the environment variables, so that the app can be started
  process.env.OPENAI_API_KEY = "DUMMY_KEY";
  process.env.EXTRACTION_OPENAI_API_KEY = "DUMMY_KEY";
  process.env.RESEND_API_KEY = "DUMMY_KEY";
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: false,
  });
  const document = generateOpenAPIConfig(app);
  const filePath = process.env.OPENAPI_SPEC_FILE;
  // now write the file to the file system in the location specified by the OPENAPI_SPEC_FILE environment variable

  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(document, null, 2));
  } else {
    console.log("OPENAPI_SPEC_FILE is not set, printing to console");
    console.log(JSON.stringify(document, null, 2));
  }
}

generateConfig().catch((err) => {
  console.error(err);
  process.exit(1);
});
