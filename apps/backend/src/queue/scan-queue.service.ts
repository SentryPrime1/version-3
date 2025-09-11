import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Scan } from '../entities/scan.entity';

export interface ScanJobData {
  scanId: string;
  url: string;
  userId: number;
  options?: any;
}

@Injectable()
export class ScanQueueService {
  private readonly logger = new Logger(ScanQueueService.name);

  constructor(
    @InjectQueue('scan-queue')
    private readonly scanQueue: Queue<ScanJobData>,
  ) {}

  /**
   * Add a scan job to the queue
   * @param scan - The complete scan object containing all necessary data
   */
  async addScanJob(scan: Scan): Promise<void> {
    try {
      this.logger.log(`Adding scan job to queue for scan ID: ${scan.id}`);
      
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
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      this.logger.log(`Scan job added to queue with job ID: ${job.id} for scan: ${scan.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to add scan job to queue: ${errorMessage}`);
      throw new Error(`Failed to add scan job to queue: ${errorMessage}`);
    }
  }

  /**
   * Alternative method if you need to add a job with just the scan ID
   * @param scanId - The scan ID
   * @param url - The URL to scan
   * @param userId - The user ID
   * @param options - Optional scan options
   */
  async addScanJobById(scanId: string, url: string, userId: number, options?: any): Promise<void> {
    try {
      this.logger.log(`Adding scan job to queue for scan ID: ${scanId}`);
      
      const jobData: ScanJobData = {
        scanId,
        url,
        userId,
        options,
      };

      const job = await this.scanQueue.add('process-scan', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      this.logger.log(`Scan job added to queue with job ID: ${job.id} for scan: ${scanId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to add scan job to queue: ${errorMessage}`);
      throw new Error(`Failed to add scan job to queue: ${errorMessage}`);
    }
  }

  async getQueueStatus(): Promise<{ waiting: number; active: number; completed: number; failed: number }> {
    try {
      this.logger.log('Retrieving queue status');
      
      const [waiting, active, completed, failed] = await Promise.all([
        this.scanQueue.getWaiting(),
        this.scanQueue.getActive(),
        this.scanQueue.getCompleted(),
        this.scanQueue.getFailed(),
      ]);

      const status = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };

      this.logger.log(`Queue status: ${JSON.stringify(status)}`);
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve queue status: ${errorMessage}`);
      throw new Error(`Failed to retrieve queue status: ${errorMessage}`);
    }
  }

  async pauseQueue(): Promise<void> {
    try {
      this.logger.log('Pausing scan queue');
      await this.scanQueue.pause();
      this.logger.log('Scan queue paused successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to pause queue: ${errorMessage}`);
      throw new Error(`Failed to pause queue: ${errorMessage}`);
    }
  }

  async resumeQueue(): Promise<void> {
    try {
      this.logger.log('Resuming scan queue');
      await this.scanQueue.resume();
      this.logger.log('Scan queue resumed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to resume queue: ${errorMessage}`);
      throw new Error(`Failed to resume queue: ${errorMessage}`);
    }
  }

  async clearQueue(): Promise<void> {
    try {
      this.logger.log('Clearing scan queue');
      await this.scanQueue.empty();
      this.logger.log('Scan queue cleared successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to clear queue: ${errorMessage}`);
      throw new Error(`Failed to clear queue: ${errorMessage}`);
    }
  }
}

