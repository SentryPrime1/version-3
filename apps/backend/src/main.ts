// apps/backend/src/main.ts
import 'reflect-metadata';
import * as http from 'http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const PORT = Number(process.env.PORT || 3000 );

/**
 * Tiny always-on liveness server so Railway's healthcheck (/healthz) never flakes.
 * Returns 200 OK immediately, even while Nest is still booting.
 */
function startLivenessServer() {
  const server = http.createServer((req, res ) => {
    if (req.url === '/healthz') {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    // Fallback for other requests while Nest is booting
    res.statusCode = 503;
    res.end('Service Unavailable');
  });

  server.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[liveness] listening on 0.0.0.0:${PORT} (serving /healthz 200)`);
  });

  return server;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const live = startLivenessServer();

  try {
    const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
    app.enableCors();
    await app.listen(PORT, '0.0.0.0');

    logger.log(`Nest started on http://0.0.0.0:${PORT}` );

    // Keep the liveness endpoint active even after Nest starts.
    // (If you prefer Nest to handle /healthz, keep HealthController below.)
  } catch (err) {
    console.error('[bootstrap] failed to start Nest:', err);
    // keep liveness server up so you can still reach logs, then crash so Railway restarts
    setTimeout(() => process.exit(1), 2000);
  }
}

bootstrap();
