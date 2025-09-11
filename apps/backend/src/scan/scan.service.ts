// apps/backend/src/scan/scan.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../entities/scan.entity';
import { ScanQueueService } from '../queue/scan-queue.service';
import { CreateScanDto } from '@common/dtos/Scan.dto';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
    private scanQueueService: ScanQueueService,
  ) {
    this.logger.log('🎮 ScanService initialized with queue integration');
  }

  async findAll(): Promise<Scan[]> {
    this.logger.log('📋 Fetching all scans');
    return this.scanRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Scan> {
    this.logger.log(`🔍 Fetching scan with ID: ${id}`);
    return this.scanRepository.findOne({ where: { id } });
  }

  async create(createScanDto: CreateScanDto): Promise<Scan> {
    this.logger.log(`🚀 Creating new scan for URL: ${createScanDto.url}`);
    
    try {
      // Create scan record in database
      const scan = this.scanRepository.create({
        url: createScanDto.url,
        userId: createScanDto.userId,
        status: 'pending',
        createdAt: new Date(),
      });

      const savedScan = await this.scanRepository.save(scan);
      this.logger.log(`✅ Scan created with ID: ${savedScan.id}`);

      // Add scan to queue for processing
      await this.scanQueueService.addScanJob({
        scanId: savedScan.id,
        url: createScanDto.url,
        userId: createScanDto.userId,
      });

      this.logger.log(`📋 Scan job queued for processing: ${savedScan.id}`);
      return savedScan;

    } catch (error) {
      this.logger.error(`❌ Failed to create scan: ${error.message}`);
      throw error;
    }
  }

  async updateScanStatus(id: string, status: string, result?: any): Promise<Scan> {
    this.logger.log(`🔄 Updating scan ${id} status to: ${status}`);
    
    const updateData: any = { status, updatedAt: new Date() };
    if (result) {
      updateData.result = result;
      updateData.completedAt = new Date();
    }

    await this.scanRepository.update(id, updateData);
    return this.findOne(id);
  }

  async getQueueStats() {
    this.logger.log('📊 Fetching queue statistics');
    return this.scanQueueService.getQueueStats();
  }

  async getServiceHealth() {
    this.logger.log('🏥 Checking service health');
    
    const dbHealth = await this.scanRepository.count();
    const queueHealth = await this.scanQueueService.isHealthy();
    
    return {
      database: dbHealth >= 0,
      queue: queueHealth,
      timestamp: new Date().toISOString(),
    };
  }
}

