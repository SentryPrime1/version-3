import { Injectable } from '@nestjs/common';
import { ScanDto } from '@common/dtos/Scan.dto';

@Injectable()
export class ScanService {
  // Temporary in-memory storage for testing
  private scans: any[] = [];

  async createScan(scanDto: ScanDto) {
    try {
      const newScan = {
        id: Date.now().toString(),
        url: scanDto.url,
        userId: scanDto.userId,
        status: 'pending',
        createdAt: new Date(),
      };

      this.scans.push(newScan);
      console.log('✅ Scan created and stored:', newScan);

      return {
        message: 'Scan created successfully',
        data: newScan
      };
    } catch (error) {
      console.error('❌ Error creating scan:', error);
      throw new Error('Failed to create scan');
    }
  }

  async getAllScans() {
    try {
      console.log('📋 Returning scans from memory:', this.scans);
      return this.scans;
    } catch (error) {
      console.error('❌ Error fetching scans:', error);
      throw new Error('Failed to fetch scans');
    }
  }
}
