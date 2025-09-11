import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../entities/scan.entity';
// Fix: Use relative path instead of @common alias
import { CreateScanDto } from '../../../packages/common/src/dtos/Scan.dto';
import { ScanQueueService } from '../queue/scan-queue.service';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
    private scanQueueService: ScanQueueService,
  ) {}

  async create(createScanDto: CreateScanDto): Promise<Scan> {
    this.logger.log(`🚀 Creating new scan for URL: ${createScanDto.url}`);
    
    try {
      // Create scan entity
      const scan = this.scanRepository.create({
        url: createScanDto.url,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Save to database
      const savedScan = await this.scanRepository.save(scan);
      this.logger.log(`✅ Scan created with ID: ${savedScan.id}`);

      // Add to queue for processing
      try {
        await this.scanQueueService.addScanJob({
          scanId: savedScan.id,
          url: createScanDto.url,
        });
        this.logger.log(`📋 Scan job added to queue for scan ID: ${savedScan.id}`);
      } catch (queueError) {
        this.logger.warn(`⚠️ Failed to add scan to queue: ${queueError instanceof Error ? queueError.message : 'Unknown error'}`);
        // Continue even if queue fails - scan is still created
      }

      return savedScan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to create scan: ${errorMessage}`);
      throw new Error(`Failed to create scan: ${errorMessage}`);
    }
  }

  async findAll(): Promise<Scan[]> {
    this.logger.log('📋 Retrieving all scans');
    try {
      const scans = await this.scanRepository.find({
        order: { createdAt: 'DESC' },
      });
      this.logger.log(`✅ Retrieved ${scans.length} scans`);
      return scans;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to retrieve scans: ${errorMessage}`);
      throw new Error(`Failed to retrieve scans: ${errorMessage}`);
    }
  }

  async findOne(id: string): Promise<Scan> {
    this.logger.log(`🔍 Finding scan with ID: ${id}`);
    try {
      const scan = await this.scanRepository.findOne({ where: { id } });
      if (!scan) {
        throw new Error(`Scan with ID ${id} not found`);
      }
      this.logger.log(`✅ Found scan with ID: ${id}`);
      return scan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to find scan: ${errorMessage}`);
      throw new Error(`Failed to find scan: ${errorMessage}`);
    }
  }

  async updateStatus(id: string, status: 'pending' | 'completed' | 'failed', results?: any): Promise<Scan> {
    this.logger.log(`🔄 Updating scan ${id} status to: ${status}`);
    try {
      const scan = await this.findOne(id);
      scan.status = status;
      scan.updatedAt = new Date();
      
      if (results) {
        scan.results = results;
      }

      const updatedScan = await this.scanRepository.save(scan);
      this.logger.log(`✅ Updated scan ${id} status to: ${status}`);
      return updatedScan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to update scan status: ${errorMessage}`);
      throw new Error(`Failed to update scan status: ${errorMessage}`);
    }
  }

  async getHealthStatus(): Promise<{ status: string; details: any }> {
    try {
      const scanCount = await this.scanRepository.count();
      
      return {
        status: 'healthy',
        details: {
          database: 'connected',
          totalScans: scanCount,
          queue: 'available',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Health check failed: ${errorMessage}`);
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
}

