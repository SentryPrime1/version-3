import { Controller, Post, Body, Get } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanDto } from '@common';

@Controller('scans')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post()
  async createScan(@Body() scanDto: ScanDto) {
    return this.scanService.createScan(scanDto);
  }

  @Get()
  async getAllScans() {
    return this.scanService.getAllScans();
  }
}
