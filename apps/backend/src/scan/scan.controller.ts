import { Controller, Get, Post, Body, Param, Delete, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ScanService } from './scan.service';
import { CreateScanDto, ScanDto } from '../../../packages/common/src/dtos/Scan.dto';

@Controller('scans')
export class ScanController {
  private readonly logger = new Logger(ScanController.name);

  constructor(private readonly scanService: ScanService) {}

  @Post()
  async create(@Body() scanDto: ScanDto) {
    try {
      this.logger.log(`Creating scan for URL: ${scanDto.url}`);
      
      // Convert ScanDto to CreateScanDto by adding required userId
      // Note: In a real application, userId would typically come from authentication context
      const createScanDto: CreateScanDto = {
        url: scanDto.url,
        userId: scanDto.userId || 1, // Default to user 1 if not provided, or get from auth context
        options: scanDto.options
      };

      const result = await this.scanService.create(createScanDto);
      this.logger.log(`Scan created successfully with ID: ${result.id}`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create scan: ${errorMessage}`);
      throw new HttpException(
        `Failed to create scan: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async findAll() {
    try {
      this.logger.log('Retrieving all scans');
      const scans = await this.scanService.findAll();
      this.logger.log(`Retrieved ${scans.length} scans`);
      return scans;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve scans: ${errorMessage}`);
      throw new HttpException(
        `Failed to retrieve scans: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Retrieving scan with ID: ${id}`);
      const scan = await this.scanService.findOne(id);
      this.logger.log(`Retrieved scan: ${scan.url}`);
      return scan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve scan: ${errorMessage}`);
      
      if (errorMessage.includes('not found')) {
        throw new HttpException(
          `Scan with ID ${id} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      throw new HttpException(
        `Failed to retrieve scan: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Removing scan with ID: ${id}`);
      await this.scanService.remove(id);
      this.logger.log(`Scan ${id} removed successfully`);
      return { message: `Scan ${id} removed successfully` };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to remove scan: ${errorMessage}`);
      
      if (errorMessage.includes('not found')) {
        throw new HttpException(
          `Scan with ID ${id} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      throw new HttpException(
        `Failed to remove scan: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/results')
  async getResults(@Param('id') id: string) {
    try {
      this.logger.log(`Retrieving results for scan ${id}`);
      const scan = await this.scanService.findOne(id);
      
      if (!scan.results) {
        throw new HttpException(
          `No results available for scan ${id}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      this.logger.log(`Retrieved results for scan ${id}`);
      return scan.results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve scan results: ${errorMessage}`);
      
      if (errorMessage.includes('not found') || errorMessage.includes('No results')) {
        throw new HttpException(
          errorMessage,
          HttpStatus.NOT_FOUND
        );
      }
      
      throw new HttpException(
        `Failed to retrieve scan results: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health/status')
  async getHealthStatus() {
    try {
      this.logger.log('Checking scan service health');
      const healthStatus = await this.scanService.getHealthStatus();
      this.logger.log(`Health check completed: ${healthStatus.status}`);
      return healthStatus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Health check failed: ${errorMessage}`);
      throw new HttpException(
        `Health check failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

