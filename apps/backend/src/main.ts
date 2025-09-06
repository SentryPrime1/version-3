import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.PORT || 3000);

  // CORS (optional env-driven)
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  app.enableCors(origins.length ? { origin: origins } : {});

  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on http://0.0.0.0:${port}`);
}
bootstrap();
