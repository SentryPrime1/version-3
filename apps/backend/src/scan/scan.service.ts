import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScanDto } from '@common';
import { Scan } from '../entities/scan.entity';

@Injectable()
export class ScanService {
  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
  ) {}

  async createScan(scanDto: ScanDto) {
    console.log('Creating scan:', scanDto);
    
    const scan = this.scanRepository.create({
      url: scanDto.url,
      userId: scanDto.userId,
      status: 'pending',
    });

    const savedScan = await this.scanRepository.save(scan);
    
    return { 
      message: 'Scan created successfully', 
      data: savedScan,
      id: savedScan.id
    };
  }

  async getAllScans(): Promise<Scan[]> {
    return await this.scanRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async getScanById(id: string): Promise<Scan | null> {
    return await this.scanRepository.findOne({ where: { id } });
  }

  async updateScanStatus(id: string, status: 'pending' | 'completed' | 'failed', results?: any): Promise<Scan | null> {
    await this.scanRepository.update(id, { status, results });
    return await this.getScanById(id);
  }
}
