// apps/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = Number(process.env.PORT || 3000);

  // Create app quickly with minimal logging
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Always-available health routes (no guards, no pipes)
  const http = app.getHttpAdapter();
  http.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
  http.get('/', (_req, res) => res.status(200).send('ok'));

  await app.listen(port, '0.0.0.0');

  // visible in Deploy/HTTP logs
  // eslint-disable-next-line no-console
  console.log(`[startup] listening on 0.0.0.0:${port}  (health: /healthz, /)`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[startup] failed before listen', err);
  process.exit(1);
});
