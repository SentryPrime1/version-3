// apps/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // CORS (optional)
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  app.enableCors(origins.length ? { origin: origins } : {});

  // Lightweight liveness probe: must be fast and always 200
  app.getHttpAdapter().get('/healthz', (_req, res) => {
    res.status(200).send({ ok: true });
  });

  // (Optional) keep your deeper health at /health (DB etc.)
  // app.getHttpAdapter().get('/health', (_req, res) => {
  //   res.status(200).send({ status: 'ok' });
  // });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`HTTP server listening on http://0.0.0.0:${port}`);
}
bootstrap();
