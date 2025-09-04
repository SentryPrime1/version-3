import { Injectable, NotFoundException } from '@nestjs/common';
import { ScanDto } from '@common/dtos/Scan.dto';
import { PrismaService } from '../database/prisma.service';
import { ScanStatus } from '@prisma/client';

@Injectable()
export class ScanService {
  constructor(private prisma: PrismaService) {}

  async createScan(scanDto: ScanDto) {
    try {
      // For now, we'll create a default user if none exists
      // In the next phase, we'll use real authentication
      let user = await this.prisma.user.findFirst({
        where: { email: `${scanDto.userId}@example.com` }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: `${scanDto.userId}@example.com`,
            name: scanDto.userId,
          }
        });
      }

      const scan = await this.prisma.scan.create({
        data: {
          url: scanDto.url,
          userId: user.id,
          status: ScanStatus.PENDING,
        },
        include: {
          user: true,
        }
      });

      // Simulate scan processing (in real implementation, this would be async)
      setTimeout(async () => {
        await this.processScan(scan.id);
      }, 2000);

      return {
        message: 'Scan created successfully',
        data: {
          id: scan.id,
          url: scan.url,
          userId: scanDto.userId,
          status: scan.status.toLowerCase(),
          createdAt: scan.createdAt,
        }
      };
    } catch (error) {
      console.error('Error creating scan:', error);
      throw new Error('Failed to create scan');
    }
  }

  async getAllScans() {
    try {
      const scans = await this.prisma.scan.findMany({
        include: {
          user: true,
          scanResults: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return scans.map(scan => ({
        id: scan.id,
        url: scan.url,
        userId: scan.user.name || scan.user.email.split('@')[0],
        status: scan.status.toLowerCase(),
        createdAt: scan.createdAt,
        completedAt: scan.completedAt,
        resultsCount: scan.scanResults.length,
      }));
    } catch (error) {
      console.error('Error fetching scans:', error);
      throw new Error('Failed to fetch scans');
    }
  }

  async getScanById(id: string) {
    try {
      const scan = await this.prisma.scan.findUnique({
        where: { id },
        include: {
          user: true,
          scanResults: true,
        }
      });

      if (!scan) {
        throw new NotFoundException('Scan not found');
      }

      return {
        id: scan.id,
        url: scan.url,
        userId: scan.user.name || scan.user.email.split('@')[0],
        status: scan.status.toLowerCase(),
        createdAt: scan.createdAt,
        completedAt: scan.completedAt,
        results: scan.scanResults.map(result => ({
          id: result.id,
          ruleId: result.ruleId,
          severity: result.severity.toLowerCase(),
          element: result.element,
          message: result.message,
          suggestion: result.suggestion,
        })),
      };
    } catch (error) {
      console.error('Error fetching scan:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to fetch scan');
    }
  }

  private async processScan(scanId: string) {
    try {
      // Simulate accessibility scan processing
      // In real implementation, this would call actual accessibility scanning tools
      const mockResults = [
        {
          ruleId: 'color-contrast',
          severity: 'SERIOUS' as const,
          element: 'button.primary',
          message: 'Element has insufficient color contrast',
          suggestion: 'Increase contrast ratio to at least 4.5:1'
        },
        {
          ruleId: 'alt-text',
          severity: 'CRITICAL' as const,
          element: 'img.hero',
          message: 'Image missing alternative text',
          suggestion: 'Add descriptive alt attribute to image'
        }
      ];

      // Update scan status and add results
      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: ScanStatus.COMPLETED,
          completedAt: new Date(),
          scanResults: {
            create: mockResults
          }
        }
      });

      console.log(`✅ Scan ${scanId} completed with ${mockResults.length} findings`);
    } catch (error) {
      console.error('Error processing scan:', error);
      
      // Mark scan as failed
      await this.prisma.scan.update({
        where: { id: scanId },
        data: {
          status: ScanStatus.FAILED,
          errorMessage: error.message,
        }
      });
    }
  }
}
