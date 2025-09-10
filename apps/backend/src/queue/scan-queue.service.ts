// apps/backend/src/queue/scan-queue.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { AccessibilityScannerService, AccessibilityScanResult } from '../accessibility/accessibility-scanner.service';

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

  constructor(
    private readonly accessibilityScanner: AccessibilityScannerService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Initializing Scan Queue Service...');
    await this.initializeRedis();
    await this.initializeQueue();
    await this.initializeWorker();
    await this.initializeQueueEvents();
    this.logger.log('✅ Scan Queue Service initialized successfully');
  }

  async onModuleDestroy() {
    this.logger.log('🔄 Shutting down Scan Queue Service...');
    await this.cleanup();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Use Railway's Redis URL or fallback to local Redis
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.logger.log('✅ Connected to Redis');
      });

      this.redis.on('error', (error) => {
        this.logger.error('❌ Redis connection error:', error);
      });

      await this.redis.connect();
      this.logger.log('🔗 Redis connection established');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Redis:', error);
      throw error;
    }
  }

  private async initializeQueue(): Promise<void> {
    try {
      this.scanQueue = new Queue<ScanJobData>('accessibility-scans', {
        connection: this.redis,
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50,      // Keep last 50 failed jobs
          attempts: 3,           // Retry failed jobs up to 3 times
          backoff: {
            type: 'exponential',
            delay: 2000,         // Start with 2 second delay
          },
        },
      });

      this.logger.log('✅ Scan queue initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize scan queue:', error);
      throw error;
    }
  }

  private async initializeWorker(): Promise<void> {
    try {
      this.scanWorker = new Worker<ScanJobData, ScanJobResult>(
        'accessibility-scans',
        async (job: Job<ScanJobData>) => {
          return await this.processScanJob(job);
        },
        {
          connection: this.redis,
          concurrency: 3, // Process up to 3 scans concurrently
          limiter: {
            max: 10,      // Maximum 10 jobs per minute
            duration: 60000, // 1 minute
          },
        }
      );

      this.scanWorker.on('completed', (job, result) => {
        this.logger.log(`✅ Scan job ${job.id} completed successfully for URL: ${job.data.url}`);
      });

      this.scanWorker.on('failed', (job, err) => {
        this.logger.error(`❌ Scan job ${job?.id} failed for URL: ${job?.data?.url}`, err);
      });

      this.scanWorker.on('progress', (job, progress) => {
        this.logger.log(`🔄 Scan job ${job.id} progress: ${progress}%`);
      });

      this.logger.log('✅ Scan worker initialized with concurrency: 3');
    } catch (error) {
      this.logger.error('❌ Failed to initialize scan worker:', error);
      throw error;
    }
  }

  private async initializeQueueEvents(): Promise<void> {
    try {
      this.queueEvents = new QueueEvents('accessibility-scans', {
        connection: this.redis,
      });

      this.queueEvents.on('waiting', ({ jobId }) => {
        this.logger.log(`⏳ Job ${jobId} is waiting to be processed`);
      });

      this.queueEvents.on('active', ({ jobId }) => {
        this.logger.log(`🔄 Job ${jobId} is now active`);
      });

      this.queueEvents.on('completed', ({ jobId }) => {
        this.logger.log(`✅ Job ${jobId} completed`);
      });

      this.queueEvents.on('failed', ({ jobId, failedReason }) => {
        this.logger.error(`❌ Job ${jobId} failed: ${failedReason}`);
      });

      this.logger.log('✅ Queue events initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize queue events:', error);
      throw error;
    }
  }

  private async processScanJob(job: Job<ScanJobData>): Promise<ScanJobResult> {
    const startTime = Date.now();
    const { scanId, url } = job.data;

    this.logger.log(`🔍 Processing scan job ${job.id} for URL: ${url}`);

    try {
      // Update job progress
      await job.updateProgress(10);

      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error(`Invalid URL: ${url}`);
      }

      await job.updateProgress(20);

      // Perform accessibility scan
      this.logger.log(`🌐 Starting accessibility scan for: ${url}`);
      const scanResult = await this.accessibilityScanner.scanWebsite(url);

      await job.updateProgress(90);

      const duration = Date.now() - startTime;

      await job.updateProgress(100);

      this.logger.log(`✅ Scan completed for ${url} in ${duration}ms`);
      this.logger.log(`📊 Found ${scanResult.violationCount.total} violations, Score: ${scanResult.complianceScore}/100`);

      return {
        scanId,
        success: true,
        result: scanResult,
        duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Scan job failed for ${url}:`, error);

      return {
        scanId,
        success: false,
        error: error.message,
        duration,
      };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async addScanJob(
    scanId: string,
    url: string,
    options: {
      userId?: string;
      priority?: number;
      delay?: number;
    } = {}
  ): Promise<Job<ScanJobData>> {
    try {
      this.logger.log(`➕ Adding scan job for URL: ${url}`);

      const job = await this.scanQueue.add(
        'scan-website',
        {
          scanId,
          url,
          userId: options.userId,
          priority: options.priority || 0,
        },
        {
          priority: options.priority || 0,
          delay: options.delay || 0,
          jobId: scanId, // Use scanId as job ID for easy tracking
        }
      );

      this.logger.log(`✅ Scan job ${job.id} added to queue for URL: ${url}`);
      return job;

    } catch (error) {
      this.logger.error(`❌ Failed to add scan job for ${url}:`, error);
      throw error;
    }
  }

  async getScanJobStatus(scanId: string): Promise<{
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'not-found';
    progress?: number;
    result?: ScanJobResult;
    error?: string;
  }> {
    try {
      const job = await this.scanQueue.getJob(scanId);

      if (!job) {
        return { status: 'not-found' };
      }

      const state = await job.getState();
      const progress = job.progress;

      if (state === 'completed') {
        return {
          status: 'completed',
          progress: 100,
          result: job.returnvalue,
        };
      }

      if (state === 'failed') {
        return {
          status: 'failed',
          error: job.failedReason,
        };
      }

      return {
        status: state as 'waiting' | 'active',
        progress: typeof progress === 'number' ? progress : 0,
      };

    } catch (error) {
      this.logger.error(`❌ Failed to get scan job status for ${scanId}:`, error);
      throw error;
    }
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const waiting = await this.scanQueue.getWaiting();
      const active = await this.scanQueue.getActive();
      const completed = await this.scanQueue.getCompleted();
      const failed = await this.scanQueue.getFailed();
      const delayed = await this.scanQueue.getDelayed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      this.logger.error('❌ Failed to get queue stats:', error);
      throw error;
    }
  }

  async pauseQueue(): Promise<void> {
    await this.scanQueue.pause();
    this.logger.log('⏸️ Scan queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.scanQueue.resume();
    this.logger.log('▶️ Scan queue resumed');
  }

  async clearQueue(): Promise<void> {
    await this.scanQueue.obliterate({ force: true });
    this.logger.log('🗑️ Scan queue cleared');
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.queueEvents) {
        await this.queueEvents.close();
        this.logger.log('✅ Queue events closed');
      }

      if (this.scanWorker) {
        await this.scanWorker.close();
        this.logger.log('✅ Scan worker closed');
      }

      if (this.scanQueue) {
        await this.scanQueue.close();
        this.logger.log('✅ Scan queue closed');
      }

      if (this.redis) {
        await this.redis.disconnect();
        this.logger.log('✅ Redis disconnected');
      }

      this.logger.log('✅ Scan Queue Service shutdown complete');
    } catch (error) {
      this.logger.error('❌ Error during cleanup:', error);
    }
  }

  async getServiceHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    redis: boolean;
    queue: boolean;
    worker: boolean;
  }> {
    try {
      const redisStatus = this.redis?.status === 'ready';
      const queueStatus = !!this.scanQueue;
      const workerStatus = !!this.scanWorker && !this.scanWorker.closing;

      return {
        status: redisStatus && queueStatus && workerStatus ? 'healthy' : 'unhealthy',
        redis: redisStatus,
        queue: queueStatus,
        worker: workerStatus,
      };
    } catch (error) {
      this.logger.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        redis: false,
        queue: false,
        worker: false,
      };
    }
  }
}

