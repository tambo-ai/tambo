import { NestFactory } from '@nestjs/core';
import fs from 'fs';
import { AppModule } from './app.module';
import { generateOpenAPIConfig } from './common/openapi';

async function generateConfig() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: false,
  });
  const document = generateOpenAPIConfig(app);
  const filePath = process.env.OPENAPI_SPEC_FILE;
  // now write the file to the file system in the location specified on the command line

  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(document, null, 2));
  } else {
    console.log('OPENAPI_SPEC_FILE is not set, printing to console');
    console.log(JSON.stringify(document, null, 2));
  }
}

generateConfig();
