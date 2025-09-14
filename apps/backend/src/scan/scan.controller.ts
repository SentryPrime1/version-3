import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpStatus, 
  HttpCode,
  ParseIntPipe,
  DefaultValuePipe,
  ValidationPipe,
  UseGuards,
  Req
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ScanService } from './scan.service';
import { ScanDto, CreateScanDto } from '../../../../packages/common/src/dtos/Scan.dto';

@ApiTags('scans')
@Controller('scans')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  /**
   * Create a new accessibility scan
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new accessibility scan' })
  @ApiResponse({ status: 201, description: 'Scan created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createScan(@Body(ValidationPipe) scanDto: ScanDto) {
    // Transform ScanDto to CreateScanDto by adding userId
    // In production, userId would come from authentication context (req.user.id)
    const createScanDto: CreateScanDto = {
      url: scanDto.url,
      options: scanDto.options,
      userId: 'default-user-id' // TODO: Get from authentication context
    };

    const scan = await this.scanService.createScan(createScanDto);

    return {
      success: true,
      message: 'Scan created successfully',
      data: scan,
    };
  }

  /**
   * Get a specific scan by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a scan by ID' })
  @ApiParam({ name: 'id', description: 'Scan ID' })
  @ApiResponse({ status: 200, description: 'Scan retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getScan(@Param('id') id: string) {
    const scan = await this.scanService.findOne(id);

    return {
      success: true,
      message: 'Scan retrieved successfully',
      data: scan,
    };
  }

  /**
   * Get all scans with pagination and filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all scans with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({ status: 200, description: 'Scans retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getAllScans(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
  ) {
    const result = await this.scanService.findAll(page, limit, userId);

    return {
      success: true,
      message: 'Scans retrieved successfully',
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Update a scan
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a scan' })
  @ApiParam({ name: 'id', description: 'Scan ID' })
  @ApiResponse({ status: 200, description: 'Scan updated successfully' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateScan(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateScanDto>,
  ) {
    const scan = await this.scanService.updateScan(id, updateData);

    return {
      success: true,
      message: 'Scan updated successfully',
      data: scan,
    };
  }

  /**
   * Delete a scan
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a scan' })
  @ApiParam({ name: 'id', description: 'Scan ID' })
  @ApiResponse({ status: 204, description: 'Scan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteScan(@Param('id') id: string) {
    await this.scanService.deleteScan(id);
  }

  /**
   * Get scans by status
   */
  @Get('status/:status')
  @ApiOperation({ summary: 'Get scans by status' })
  @ApiParam({ name: 'status', description: 'Scan status (pending, completed, failed)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Scans retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getScansByStatus(
    @Param('status') status: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.scanService.findByStatus(status, page, limit);

    return {
      success: true,
      message: 'Scans retrieved successfully',
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get scan statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get scan statistics' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStatistics(@Query('userId') userId?: string) {
    const stats = await this.scanService.getStatistics(userId);

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
    };
  }

  /**
   * Get user's scans
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get scans for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'User scans retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUserScans(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.scanService.findByUserId(userId, page, limit);

    return {
      success: true,
      message: 'User scans retrieved successfully',
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
}

