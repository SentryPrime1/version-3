// apps/backend/src/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  // Liveness: should not require DB
  @Get('healthz')
  healthz() {
    return { ok: true };
  }

  // Friendly root check
  @Get('health')
  health() {
    return { ok: true };
  }
}
