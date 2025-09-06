import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../entities/scan.entity';
import { ScanDto } from '@common';

type ScanStatus = 'pending' | 'completed' | 'failed';

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
  ) {}

  async createScan(scanDto: ScanDto): Promise<Scan> {
    this.logger.log(`Creating scan for ${scanDto.url}`);
    
    const scan = this.scanRepository.create({
      url: scanDto.url,
      status: 'pending' as ScanStatus,
      createdAt: new Date(),
    });
    
    return this.scanRepository.save(scan);
  }

  async getAllScans(): Promise<Scan[]> {
    return this.scanRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getScanById(id: string): Promise<Scan> {
    const scan = await this.scanRepository.findOne({ where: { id } });
    if (!scan) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }
    return scan;
  }

  async updateScanStatus(id: string, status: ScanStatus): Promise<Scan> {
    const scan = await this.scanRepository.findOne({ where: { id } });
    if (!scan) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }
    
    // Ensure status is properly typed
    const validStatuses: ScanStatus[] = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    scan.status = status;
    scan.updatedAt = new Date();
    
    return this.scanRepository.save(scan);
  }

  async deleteScan(id: string): Promise<void> {
    const result = await this.scanRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Scan with ID ${id} not found`);
    }
  }
}
