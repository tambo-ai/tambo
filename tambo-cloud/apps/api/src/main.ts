import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { generateOpenAPIConfig } from './common/openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  configureSwagger(app);
  await app.listen(process.env.PORT || 3000);
}

function configureSwagger(app: INestApplication) {
  const document = generateOpenAPIConfig(app);
  SwaggerModule.setup('api', app, document);
}
bootstrap();
