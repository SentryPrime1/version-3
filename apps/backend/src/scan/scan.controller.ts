import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ScanService } from './scan.service';
import { CreateScanDto, ScanDto } from '../../../../packages/common/src/dtos/Scan.dto';
import { Scan } from '../entities/scan.entity';

@Controller('scans')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post()
  async createScan(@Body() scanDto: ScanDto): Promise<Scan> {
    // Convert ScanDto to CreateScanDto with required userId
    const createScanDto: CreateScanDto = {
      url: scanDto.url,
      userId: scanDto.userId || 'default-user-id', // Provide default or get from auth context
      options: scanDto.options,
    };
    
    return this.scanService.createScan(createScanDto);
  }

  @Get()
  async getScans(@Query('userId') userId: string): Promise<Scan[]> {
    return this.scanService.getScansByUserId(userId);
  }

  @Get(':id')
  async getScan(@Param('id') id: string): Promise<Scan> {
    return this.scanService.getScanById(parseInt(id));
  }
}
