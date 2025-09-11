// apps/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { ScanModule } from './scan/scan.module';
import { AccessibilityModule } from './accessibility/accessibility.module';
import { QueueModule } from './queue/queue.module';
import { Scan } from './entities/scan.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Scan],
      synchronize: true,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      logging: process.env.NODE_ENV === 'development',
    }),
    HealthModule,
    ScanModule,
    AccessibilityModule,
    QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor() {
    console.log('🔧 AppModule initialized with all services');
    console.log('📊 Database URL configured:', !!process.env.DATABASE_URL);
    console.log('🔗 Redis URL configured:', !!process.env.REDIS_URL);
  }
}

