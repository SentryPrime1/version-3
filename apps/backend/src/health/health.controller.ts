// apps/backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health') // retains /health
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // For humans/tools
  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }

  // For platform liveness probe (/healthz)
  @Get('z')
  getHealthZ() {
    return this.healthService.getHealth();
  }
}
