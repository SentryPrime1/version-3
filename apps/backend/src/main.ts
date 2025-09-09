import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = Number(process.env.PORT || 3000);

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // no global prefix; keep /healthz at the root for the probe
  await app.listen(port, '0.0.0.0');

  // eslint-disable-next-line no-console
  console.log(`[startup] listening on 0.0.0.0:${port} (health: /healthz)`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[startup] failed before listen', err);
  process.exit(1);
});
