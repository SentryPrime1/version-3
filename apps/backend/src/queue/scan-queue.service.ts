// apps/backend/src/queue/scan-queue.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { AccessibilityScanner, AccessibilityScanResult } from '../accessibility/accessibility-scanner.service';

export interface ScanJobData {
  scanId: string;
  url: string;
  userId?: string;
  priority?: number;
  retryAttempts?: number;
}

export interface ScanJobResult {
  scanId: string;
  success: boolean;
  result?: AccessibilityScanResult;
  error?: string;
  duration: number;
}

@Injectable()
export class ScanQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScanQueueService.name);
  private redis: Redis;
  private scanQueue: Queue<ScanJobData>;
  private scanWorker: Worker<ScanJobData, ScanJobResult>;
  private queueEvents: QueueEvents;

  constructor(private accessibilityScanner: AccessibilityScanner) {
    this.logger.log('📋 ScanQueueService initializing...');
  }

  async onModuleInit() {
    try {
      await this.initializeRedis();
      await this.initializeQueue();
      await this.initializeWorker();
      this.logger.log('✅ ScanQueueService initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to initialize ScanQueueService: ${errorMessage}`);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.scanWorker) {
        await this.scanWorker.close();
      }
      if (this.queueEvents) {
        await this.queueEvents.close();
      }
      if (this.scanQueue) {
        await this.scanQueue.close();
      }
      if (this.redis) {
        this.redis.disconnect();
      }
      this.logger.log('🔒 ScanQueueService shut down gracefully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Error during ScanQueueService shutdown: ${errorMessage}`);
    }
  }

  private async initializeRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.logger.log(`🔗 Connecting to Redis: ${redisUrl}`);

    // Fixed Redis configuration - removed invalid option
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100, // This option was causing the error - removed
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redis.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error(`❌ Redis connection error: ${error.message}`);
    });
  }

  private async initializeQueue() {
    this.scanQueue = new Queue<ScanJobData>('accessibility-scans', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.queueEvents = new QueueEvents('accessibility-scans', {
      connection: this.redis,
    });

    this.queueEvents.on('completed', ({ jobId }) => {
      this.logger.log(`✅ Scan job completed: ${jobId}`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      this.logger.error(`❌ Scan job failed: ${jobId} - ${failedReason}`);
    });

    this.logger.log('📋 Scan queue initialized');
  }

  private async initializeWorker() {
    this.scanWorker = new Worker<ScanJobData, ScanJobResult>(
      'accessibility-scans',
      async (job: Job<ScanJobData>) => {
        const startTime = Date.now();
        const { scanId, url, userId } = job.data;

        this.logger.log(`🔄 Processing scan job: ${scanId} for URL: ${url}`);

        try {
          // Update job progress
          await job.updateProgress(10);

          // Perform accessibility scan
          const scanResult = await this.accessibilityScanner.scanWebsite(url);
          
          await job.updateProgress(90);

          const duration = Date.now() - startTime;
          
          this.logger.log(`✅ Scan completed for ${scanId} in ${duration}ms`);

          await job.updateProgress(100);

          return {
            scanId,
            success: true,
            result: scanResult,
            duration,
          };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          const duration = Date.now() - startTime;

          this.logger.error(`❌ Scan failed for ${scanId}: ${errorMessage}`);

          return {
            scanId,
            success: false,
            error: errorMessage,
            duration,
          };
        }
      },
      {
        connection: this.redis,
        concurrency: 3, // Process up to 3 scans simultaneously
        limiter: {
          max: 10,
          duration: 60000, // Max 10 scans per minute
        },
      }
    );

    this.scanWorker.on('completed', (job, result) => {
      this.logger.log(`🎉 Worker completed job ${job.id}: ${result.scanId}`);
    });

    this.scanWorker.on('failed', (job, error) => {
      this.logger.error(`💥 Worker failed job ${job?.id}: ${error.message}`);
    });

    this.logger.log('👷 Scan worker initialized with concurrency: 3');
  }

  async addScanJob(jobData: ScanJobData): Promise<Job<ScanJobData>> {
    try {
      this.logger.log(`📤 Adding scan job to queue: ${jobData.scanId}`);

      const job = await this.scanQueue.add(
        'accessibility-scan',
        jobData,
        {
          priority: jobData.priority || 0,
          attempts: jobData.retryAttempts || 3,
          jobId: jobData.scanId, // Use scanId as job ID for easy tracking
        }
      );

      this.logger.log(`✅ Scan job added to queue: ${job.id}`);
      return job;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to add scan job: ${errorMessage}`);
      throw new Error(`Failed to add scan job: ${errorMessage}`);
    }
  }

  async getJobStatus(jobId: string) {
    try {
      const job = await this.scanQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      return {
        id: job.id,
        data: job.data,
        progress: job.progress,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to get job status: ${errorMessage}`);
      return null;
    }
  }

  async getQueueStats() {
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to get queue stats: ${errorMessage}`);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        total: 0,
        error: errorMessage,
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async pauseQueue() {
    await this.scanQueue.pause();
    this.logger.log('⏸️ Scan queue paused');
  }

  async resumeQueue() {
    await this.scanQueue.resume();
    this.logger.log('▶️ Scan queue resumed');
  }

  async clearQueue() {
    await this.scanQueue.drain();
    this.logger.log('🧹 Scan queue cleared');
  }
}

