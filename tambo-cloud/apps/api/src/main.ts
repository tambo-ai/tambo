import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { generateOpenAPIConfig } from './common/openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  configureSwagger(app);
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  await app.listen(process.env.PORT || 3000);
}

function configureSwagger(app: INestApplication) {
  const document = generateOpenAPIConfig(app);
  SwaggerModule.setup('api', app, document);
}
bootstrap();
