import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    return await this.healthService.getBasicHealth();
  }

  @Get('detailed')
  async getDetailedHealth() {
    return await this.healthService.getDetailedHealth();
  }

  @Get('db')
  async getDatabaseHealth() {
    return await this.healthService.getDatabaseHealth();
  }
}
