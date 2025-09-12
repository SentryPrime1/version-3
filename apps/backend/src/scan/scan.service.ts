import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../entities/scan.entity';
import { ScanQueueService } from '../queue/scan-queue.service';
import { CreateScanDto } from '../../../../packages/common/src/dtos/Scan.dto';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
    private scanQueueService: ScanQueueService,
  ) {}

  async createScan(createScanDto: CreateScanDto): Promise<Scan> {
    try {
      // Create scan data object
      const scanData = {
        url: createScanDto.url,
        userId: createScanDto.userId,
        status: 'pending',
        options: createScanDto.options,
      };

      // Save to database
      const savedScan = await this.scanRepository.save(scanData);
      this.logger.log(`Scan created with ID: ${savedScan.id}`);

      // Add to queue for processing
      await this.scanQueueService.addScanJob(savedScan);
      this.logger.log(`Scan job added to queue for scan ID: ${savedScan.id}`);

      return savedScan;
    } catch (error) {
      this.logger.error('Error creating scan:', error);
      throw error;
    }
  }

  async getScanById(id: number): Promise<Scan> {
    const scan = await this.scanRepository.findOne({ where: { id } });
    if (!scan) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }
    return scan;
  }

  async getScansByUserId(userId: string): Promise<Scan[]> {
    return this.scanRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateScanStatus(id: number, status: string, results?: any): Promise<Scan> {
    const scan = await this.getScanById(id);
    scan.status = status;
    if (results) {
      scan.results = results;
    }
    return this.scanRepository.save(scan);
  }

  async getAllScans(): Promise<Scan[]> {
    return this.scanRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
