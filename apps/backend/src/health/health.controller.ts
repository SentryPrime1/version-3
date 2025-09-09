import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('healthz') // <- Railway checks /healthz
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealthz() {
    // return 200 even if DB is down; include details in payload
    const { ok, db } = await this.healthService.getHealth();
    return {
      status: ok ? 'ok' : 'degraded',
      checks: { db },
      timestamp: new Date().toISOString(),
    };
  }
}
