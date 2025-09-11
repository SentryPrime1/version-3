// apps/backend/src/queue/scan-queue.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { AccessibilityScanResult, AccessibilityScanner } from '../accessibility/accessibility-scanner.service';

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
  duration?: number;
}

@Injectable()
export class ScanQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScanQueueService.name);
  private readonly redis: Redis;
  private scanQueue: Queue<ScanJobData>;
  private scanWorker: Worker<ScanJobData, ScanJobResult>;
  private queueEvents: QueueEvents;

  constructor(private accessibilityScanner: AccessibilityScanner) {
    this.logger.log('🔧 ScanQueueService initializing...');
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
      this.logger.log('🛑 ScanQueueService shut down gracefully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Error during ScanQueueService shutdown: ${errorMessage}`);
    }
  }

  private async initializeRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.logger.log(`🔗 Connecting to Redis: ${redisUrl}`);

    // Fixed Redis configuration - removed invalid options and duplicates
    (this as any).redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
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
      async (job) => {
        const { scanId, url, userId } = job.data;
        this.logger.log(`🔍 Processing scan job: ${scanId} for URL: ${url}`);

        const startTime = Date.now();
        
        try {
          const result = await this.accessibilityScanner.scanWebsite(url);
          const duration = Date.now() - startTime;

          this.logger.log(`✅ Scan completed for ${url} in ${duration}ms`);
          
          return {
            scanId,
            success: true,
            result,
            duration,
          };
        } catch (error) {
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          
          this.logger.error(`❌ Scan failed for ${url}: ${errorMessage}`);
          
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
        concurrency: 5, // Process up to 5 scans concurrently
      }
    );

    // Set up event listeners
    this.setupEventListeners();

    this.logger.log('✅ Scan queue initialized successfully');
  }

  /**
   * Set up event listeners for queue monitoring
   */
  private setupEventListeners() {
    this.scanWorker.on('completed', (job, result) => {
      this.logger.log(`✅ Worker completed job ${job.id}: ${result.scanId}`);
    });

    this.scanWorker.on('failed', (job, err) => {
      this.logger.error(`❌ Worker failed job ${job?.id}: ${err.message}`);
    });

    this.scanWorker.on('error', (err) => {
      this.logger.error(`❌ Worker error: ${err.message}`);
    });
  }

  /**
   * Add a new scan job to the queue
   */
  async addScanJob(jobData: ScanJobData): Promise<string> {
    try {
      this.logger.log(`📝 Adding scan job for URL: ${jobData.url}`);
      
      const job = await this.scanQueue.add('scan-website', jobData, {
        priority: jobData.priority || 0,
        attempts: jobData.retryAttempts || 3,
        delay: 0,
      });

      this.logger.log(`✅ Scan job added with ID: ${job.id}`);
      return job.id!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to add scan job: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
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
      throw error;
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    try {
      const queueStats = await this.getQueueStats();
      const redisStatus = this.redis.status;
      
      return {
        status: redisStatus === 'ready' ? 'healthy' : 'unhealthy',
        redis: {
          status: redisStatus,
          connected: this.redis.status === 'ready',
        },
        queue: queueStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`❌ Failed to get service health: ${errorMessage}`);
      return {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

