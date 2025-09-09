// apps/backend/src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = Number(process.env.PORT || 3000);
  const app = await NestFactory.create(AppModule, {
    // quiet logs on boot; change to ['log','error','warn','debug','verbose'] if needed
    logger: ['error', 'warn', 'log'],
  });

  // Minimal, fast healthcheck that never blocks startup
  app.getHttpAdapter().get('/healthz', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[bootstrap] listening on 0.0.0.0:${port}, healthz ready`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[bootstrap] failed to start app', err);
  process.exit(1);
});
