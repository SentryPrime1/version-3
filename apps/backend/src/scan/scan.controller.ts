import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanDto, CreateScanDto } from '../../../../packages/common/src/dtos/Scan.dto';

@Controller('scans')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post()
  async createScan(@Body() scanDto: ScanDto) {
    // Transform ScanDto to CreateScanDto by adding userId
    // In a real app, you would get userId from authentication context (req.user.id)
    const createScanDto: CreateScanDto = {
      url: scanDto.url,
      options: scanDto.options,
      userId: 'default-user-id' // TODO: Get from authentication context
    };

    return this.scanService.createScan(createScanDto);
  }

  @Get(':id')
  async getScan(@Param('id') id: string) {
    return this.scanService.findOne(id);
  }

  @Get()
  async getAllScans() {
    return this.scanService.findAll();
  }
}

