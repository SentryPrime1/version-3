import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../entities/scan.entity';
import { ScanQueueService } from '../queue/scan-queue.service';
import { CreateScanDto } from '../../../packages/common/src/dtos/Scan.dto';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepository: Repository<Scan>,
    private readonly scanQueueService: ScanQueueService,
  ) {}

  async create(createScanDto: CreateScanDto): Promise<Scan> {
    try {
      this.logger.log(`Creating new scan for URL: ${createScanDto.url} (User: ${createScanDto.userId})`);
      
      const scan = this.scanRepository.create({
        url: createScanDto.url,
        userId: createScanDto.userId,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        options: createScanDto.options,
      });

      const savedScan = await this.scanRepository.save(scan);
      this.logger.log(`Scan created with ID: ${savedScan.id}`);

      // Fix: Call addScanJob with single argument (the complete scan object or scan ID)
      // The method signature expects 1 argument, so we pass the saved scan object
      await this.scanQueueService.addScanJob(savedScan);
      this.logger.log(`Scan job added to queue for scan ID: ${savedScan.id}`);

      return savedScan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create scan: ${errorMessage}`);
      throw new Error(`Failed to create scan: ${errorMessage}`);
    }
  }

  async findAll(): Promise<Scan[]> {
    try {
      this.logger.log('Retrieving all scans');
      const scans = await this.scanRepository.find({
        order: { createdAt: 'DESC' },
      });
      this.logger.log(`Found ${scans.length} scans`);
      return scans;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve scans: ${errorMessage}`);
      throw new Error(`Failed to retrieve scans: ${errorMessage}`);
    }
  }

  async findOne(id: string): Promise<Scan> {
    try {
      this.logger.log(`Retrieving scan with ID: ${id}`);
      const scan = await this.scanRepository.findOne({
        where: { id },
      });

      if (!scan) {
        throw new Error(`Scan with ID ${id} not found`);
      }

      this.logger.log(`Found scan: ${scan.url}`);
      return scan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve scan: ${errorMessage}`);
      throw new Error(`Failed to retrieve scan: ${errorMessage}`);
    }
  }

  async findByUserId(userId: number): Promise<Scan[]> {
    try {
      this.logger.log(`Retrieving scans for user ID: ${userId}`);
      const scans = await this.scanRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      this.logger.log(`Found ${scans.length} scans for user ${userId}`);
      return scans;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve scans for user: ${errorMessage}`);
      throw new Error(`Failed to retrieve scans for user: ${errorMessage}`);
    }
  }

  async updateStatus(id: string, status: 'pending' | 'completed' | 'failed', results?: any): Promise<Scan> {
    try {
      this.logger.log(`Updating scan ${id} status to: ${status}`);
      
      const scan = await this.findOne(id);
      scan.status = status;
      scan.updatedAt = new Date();
      
      if (results) {
        scan.results = results;
      }

      const updatedScan = await this.scanRepository.save(scan);
      this.logger.log(`Scan ${id} status updated successfully`);
      
      return updatedScan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update scan status: ${errorMessage}`);
      throw new Error(`Failed to update scan status: ${errorMessage}`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`Removing scan with ID: ${id}`);
      const result = await this.scanRepository.delete(id);
      
      if (result.affected === 0) {
        throw new Error(`Scan with ID ${id} not found`);
      }
      
      this.logger.log(`Scan ${id} removed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to remove scan: ${errorMessage}`);
      throw new Error(`Failed to remove scan: ${errorMessage}`);
    }
  }

  async getHealthStatus(): Promise<{ status: string; details: any }> {
    try {
      const scanCount = await this.scanRepository.count();
      const recentScans = await this.scanRepository.count({
        where: {
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      });
      
      return {
        status: 'healthy',
        details: {
          database: 'connected',
          totalScans: scanCount,
          recentScans: recentScans,
          queue: 'available',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        details: {
          database: 'error',
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async getStatistics(): Promise<{ total: number; pending: number; completed: number; failed: number }> {
    try {
      this.logger.log('Retrieving scan statistics');
      
      const [total, pending, completed, failed] = await Promise.all([
        this.scanRepository.count(),
        this.scanRepository.count({ where: { status: 'pending' } }),
        this.scanRepository.count({ where: { status: 'completed' } }),
        this.scanRepository.count({ where: { status: 'failed' } }),
      ]);

      const stats = { total, pending, completed, failed };
      this.logger.log(`Scan statistics: ${JSON.stringify(stats)}`);
      
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve scan statistics: ${errorMessage}`);
      throw new Error(`Failed to retrieve scan statistics: ${errorMessage}`);
    }
  }
}

