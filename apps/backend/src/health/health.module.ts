// apps/backend/src/health/health.module.ts
import { Module, Logger } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {
  private readonly logger = new Logger(HealthModule.name);
  
  constructor() {
    this.logger.log('🏥 HealthModule constructor called');
    this.logger.log('🎮 Registering HealthController');
    this.logger.log('⚙️ Registering HealthService');
  }
}

