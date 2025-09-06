// apps/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Liveness endpoint that never depends on DB, queues, etc.
  app.getHttpAdapter().getInstance().get('/healthz', (_req: any, res: any) =>
    res.status(200).json({ status: 'ok' })
  );

  const port = Number(process.env.PORT || 3000);

  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors(origins.length ? { origin: origins } : {});

  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on http://0.0.0.0:${port}`);
}
bootstrap();
