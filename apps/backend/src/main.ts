// apps/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Environment-driven CORS (optional)
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  app.enableCors(origins.length ? { origin: origins } : {});

  const port = Number(process.env.PORT) || 3000;

  // IMPORTANT: bind to all interfaces so Railway can reach the container
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend listening on http://0.0.0.0:${port}`);
}
bootstrap();
