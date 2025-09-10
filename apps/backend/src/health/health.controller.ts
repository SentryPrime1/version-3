// apps/backend/src/health/health.controller.ts
import { Controller, Get, Logger } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly healthService: HealthService) {
    this.logger.log('🏥 HealthController constructor called');
    this.logger.log('📍 Controller registered at /');
  }

  @Get('health')
  getHealth() {
    this.logger.log('🏥 GET /health called');
    return this.healthService.getHealth();
  }

  @Get('healthz')
  getHealthz() {
    this.logger.log('🏥 GET /healthz called');
    return this.healthService.getHealthz();
  }
}

