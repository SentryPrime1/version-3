import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

interface ScanJobData {
  scanId: string; // Changed from number to string to match scan.id type
  url: string;
  options?: any;
}

@Injectable()
export class ScanQueueService {
  constructor(
    @InjectQueue('scan-queue') private scanQueue: Queue,
  ) {}

  async addScanJob(scan: any): Promise<void> {
    const jobData: ScanJobData = {
      scanId: scan.id, // scan.id is string, now matches ScanJobData.scanId type
      url: scan.url,
      options: scan.options,
    };

    await this.scanQueue.add('process-scan', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
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

  async removeJob(jobId: string): Promise<void> {
    const job = await this.scanQueue.getJob(jobId);
    if (job) {
      await job.remove();
    }
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
      total: waiting.length + active.length + completed.length + failed.length,
    };
  }
}

