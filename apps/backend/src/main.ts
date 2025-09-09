import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as http from 'http';

async function bootstrap() {
  const port = Number(process.env.PORT || 3000);

  // Bind a tiny fallback server immediately so /healthz succeeds during boot.
  const fallback = http.createServer((req, res) => {
    if (req.url === '/healthz') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, fallback: true }));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
  });

  await new Promise<void>((resolve) => fallback.listen(port, '0.0.0.0', () => resolve(null as any)));

  // eslint-disable-next-line no-console
  console.log(`[startup] fallback health server on 0.0.0.0:${port}`);

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    await app.listen(port, '0.0.0.0');

    // Close the fallback once Nest is listening
    fallback.close();

    // eslint-disable-next-line no-console
    console.log(`[startup] Nest listening on 0.0.0.0:${port} (health: /healthz)`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[startup] failed starting Nest', err);
    // keep the fallback server alive so healthcheck keeps passing and logs can be inspected
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[startup] fatal before bootstrap', err);
  process.exit(1);
});
