import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../entities/scan.entity';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
  ) {}

  async getBasicHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SentryPrime v2 Backend',
      version: '1.0.0'
    };
  }

  async getDetailedHealth() {
    const dbHealth = await this.getDatabaseHealth();
    const scanCount = await this.getScanCount();
    
    return {
      status: dbHealth.status === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      service: 'SentryPrime v2 Backend',
      version: '1.0.0',
      database: dbHealth,
      metrics: {
        totalScans: scanCount.total,
        pendingScans: scanCount.pending,
        completedScans: scanCount.completed
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  async getDatabaseHealth() {
    try {
      await this.scanRepository.query('SELECT 1');
      return {
        status: 'ok',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getScanCount() {
    try {
      const [total, pending, completed] = await Promise.all([
        this.scanRepository.count(),
        this.scanRepository.count({ where: { status: 'pending' } }),
        this.scanRepository.count({ where: { status: 'completed' } })
      ]);

      return { total, pending, completed };
    } catch (error) {
      return { total: 0, pending: 0, completed: 0 };
    }
  }
}
