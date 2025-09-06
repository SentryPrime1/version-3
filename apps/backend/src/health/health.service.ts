import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../entities/scan.entity';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getBasicHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'SentryPrime Backend',
      version: '1.0.0',
    };
  }

  async getDatabaseHealth() {
    try {
      // Test database connectivity
      const scanCount = await this.scanRepository.count();
      
      return {
        status: 'connected',
        timestamp: new Date().toISOString(),
        scanCount,
        connection: 'active',
      };
    } catch (error) {
      this.logger.error('Database health check failed', (error as Error).stack);
      return {
        status: 'disconnected',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
        connection: 'failed',
      };
    }
  }

  async getDetailedHealth() {
    try {
      // Test database connectivity
      const scanCount = await this.scanRepository.count();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'connected',
          scanCount,
        },
        memory: process.memoryUsage(),
      };
    } catch (error) {
      this.logger.error('Health check failed', (error as Error).stack);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'disconnected',
          error: (error as Error).message,
        },
        memory: process.memoryUsage(),
      };
    }
  }
}
