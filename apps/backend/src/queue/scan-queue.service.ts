import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Scan } from '../entities/scan.entity';

interface ScanJobData {
  scanId: number;
  url: string;
  userId: string;
  options?: any;
}

@Injectable()
export class ScanQueueService {
  private readonly logger = new Logger(ScanQueueService.name);

  constructor(
    @InjectQueue('scan-queue')
    private scanQueue: Queue,
  ) {}

  async addScanJob(scan: Scan): Promise<void> {
    try {
      const jobData: ScanJobData = {
        scanId: scan.id,
        url: scan.url,
        userId: scan.userId,
        options: scan.options,
      };

      const job = await this.scanQueue.add('process-scan', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(`Added scan job ${job.id} for scan ${scan.id}`);
    } catch (error) {
      this.logger.error(`Failed to add scan job for scan ${scan.id}:`, error);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.scanQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      data: job.data,
      progress: job.progress(),
      state: await job.getState(),
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      failedReason: job.failedReason,
    };
  }

  async getQueueStats(): Promise<any> {
    const waiting = await this.scanQueue.getWaiting();
    const active = await this.scanQueue.getActive();
    const completed = await this.scanQueue.getCompleted();
    const failed = await this.scanQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
