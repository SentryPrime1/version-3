// apps/backend/src/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('healthz')
  liveness() {
    return { ok: true };
  }

  @Get('health')
  health() {
    return { ok: true };
  }
}
