// apps/backend/src/scan/scan.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { Scan } from '../entities/scan.entity';
import { QueueModule } from '../queue/queue.module';
import { AccessibilityModule } from '../accessibility/accessibility.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Scan]),
    QueueModule,
    AccessibilityModule,
  ],
  controllers: [ScanController],
  providers: [ScanService],
  exports: [ScanService],
})
export class ScanModule {
  constructor() {
    console.log('🎮 ScanModule initialized with queue and accessibility services');
  }
}

