import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScanQueueService } from './scan-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scan-queue',
    }),
  ],
  providers: [ScanQueueService],
  exports: [ScanQueueService],
})
export class QueueModule {}
