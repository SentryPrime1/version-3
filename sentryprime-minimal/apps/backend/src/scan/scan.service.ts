import { Injectable } from '@nestjs/common';
import { ScanDto } from '@common';

@Injectable()
export class ScanService {
  async createScan(scanDto: ScanDto) {
    // For now, just return the scan data without queue processing
    console.log('Creating scan:', scanDto);
    return { 
      message: 'Scan created successfully', 
      data: scanDto,
      id: Math.random().toString(36).substr(2, 9)
    };
  }

  getAllScans() {
    return [
      { id: '1', url: 'https://example.com', userId: 'user1', status: 'completed' },
      { id: '2', url: 'https://test.com', userId: 'user2', status: 'pending' }
    ];
  }
}
