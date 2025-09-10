// apps/backend/src/health/health.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor() {
    this.logger.log('🏥 HealthService constructor called');
  }

  getHealth() {
    this.logger.log('🏥 Health check requested');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
  }

  getHealthz() {
    this.logger.log('🏥 Healthz check requested');
    return { ok: true };
  }
}

