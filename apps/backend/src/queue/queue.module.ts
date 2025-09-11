// apps/backend/src/queue/queue.module.ts
import { Module } from '@nestjs/common';
import { ScanQueueService } from './scan-queue.service';
import { AccessibilityModule } from '../accessibility/accessibility.module';

@Module({
  imports: [AccessibilityModule],
  providers: [ScanQueueService],
  exports: [ScanQueueService],
})
export class QueueModule {
  constructor() {
    console.log('📋 QueueModule initialized');
  }
}

