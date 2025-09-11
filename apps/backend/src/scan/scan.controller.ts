import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanDto } from '@common';

@Controller('scans')
export class ScanController {
  private readonly logger = new Logger(ScanController.name);

  constructor(private readonly scanService: ScanService) {
    this.logger.log('🔧 ScanController constructor called');
    this.logger.log('📝 Controller registered at /scans');
  }

  @Post()
  async createScan(@Body() scanDto: ScanDto) {
    this.logger.log('🔍 POST /scans called');
    this.logger.log(`📊 Scan data: ${JSON.stringify(scanDto)}`);
    
    try {
      // Fixed: Call 'create' instead of 'createScan' to match service method
      const result = await this.scanService.create(scanDto);
      this.logger.log('✅ Scan created successfully');
      return result;
    } catch (error) {
      this.logger.error('❌ Failed to create scan:', error);
      throw error;
    }
  }

  @Get()
  async getAllScans() {
    this.logger.log('📋 GET /scans called');
    
    try {
      // Fixed: Call 'findAll' instead of 'getAllScans' to match service method
      const scans = await this.scanService.findAll();
      this.logger.log(`✅ Retrieved ${scans.length} scans`);
      return scans;
    } catch (error) {
      this.logger.error('❌ Failed to get scans:', error);
      throw error;
    }
  }
}

