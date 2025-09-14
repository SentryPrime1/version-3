import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../entities/scan.entity';
import { CreateScanDto } from '../../../../packages/common/src/dtos/Scan.dto';
import { ScanQueueService } from '../queue/scan-queue.service';

@Injectable()
export class ScanService {
  constructor(
    @InjectRepository(Scan)
    private readonly scanRepository: Repository<Scan>,
    private readonly scanQueueService: ScanQueueService,
  ) {}

  /**
   * Create a new scan and add it to the processing queue
   */
  async createScan(createScanDto: CreateScanDto): Promise<Scan> {
    try {
      // Validate URL format
      if (!this.isValidUrl(createScanDto.url)) {
        throw new BadRequestException('Invalid URL format');
      }

      // Create scan entity
      const scan = this.scanRepository.create({
        url: createScanDto.url,
        userId: createScanDto.userId,
        options: createScanDto.options || {},
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Save to database
      const savedScan = await this.scanRepository.save(scan);

      // Add to processing queue
      await this.scanQueueService.addScanJob(savedScan);

      return savedScan;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create scan');
    }
  }

  /**
   * Find a scan by ID
   */
  async findOne(id: string): Promise<Scan> {
    try {
      const scan = await this.scanRepository.findOne({
        where: { id },
      });

      if (!scan) {
        throw new NotFoundException(`Scan with ID ${id} not found`);
      }

      return scan;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve scan');
    }
  }

  /**
   * Find all scans with pagination
   */
  async findAll(page: number = 1, limit: number = 10, userId?: string): Promise<{
    data: Scan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const queryBuilder = this.scanRepository.createQueryBuilder('scan');
      
      if (userId) {
        queryBuilder.where('scan.userId = :userId', { userId });
      }

      const [data, total] = await queryBuilder
        .orderBy('scan.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve scans');
    }
  }

  /**
   * Update scan status and results
   */
  async updateScan(id: string, updates: Partial<Scan>): Promise<Scan> {
    try {
      const scan = await this.findOne(id);
      
      Object.assign(scan, updates);
      scan.updatedAt = new Date();

      return await this.scanRepository.save(scan);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update scan');
    }
  }

  /**
   * Delete a scan
   */
  async deleteScan(id: string): Promise<void> {
    try {
      const scan = await this.findOne(id);
      await this.scanRepository.remove(scan);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete scan');
    }
  }

  /**
   * Find scans by user ID
   */
  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{
    data: Scan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.findAll(page, limit, userId);
  }

  /**
   * Find scans by status
   */
  async findByStatus(status: string, page: number = 1, limit: number = 10): Promise<{
    data: Scan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [data, total] = await this.scanRepository.findAndCount({
        where: { status },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve scans by status');
    }
  }

  /**
   * Get scan statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
  }> {
    try {
      const queryBuilder = this.scanRepository.createQueryBuilder('scan');
      
      if (userId) {
        queryBuilder.where('scan.userId = :userId', { userId });
      }

      const [total, pending, completed, failed] = await Promise.all([
        queryBuilder.getCount(),
        queryBuilder.clone().andWhere('scan.status = :status', { status: 'pending' }).getCount(),
        queryBuilder.clone().andWhere('scan.status = :status', { status: 'completed' }).getCount(),
        queryBuilder.clone().andWhere('scan.status = :status', { status: 'failed' }).getCount(),
      ]);

      return { total, pending, completed, failed };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve statistics');
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

