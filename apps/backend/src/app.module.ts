import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScanModule } from './scan/scan.module';
import { HealthModule } from './health/health.module';
import { Scan } from './entities/scan.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const logger = new Logger('TypeORM');
        logger.log('🔗 Configuring TypeORM connection...');
        logger.log(`📊 Database URL: ${process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING'}`);
        logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        
        const config = {
          type: 'postgres' as const,
          url: process.env.DATABASE_URL,
          entities: [Scan],
          synchronize: true, // Only for development - creates tables automatically
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          logging: true, // Enable SQL logging
          logger: 'advanced-console' as const,
        };
        
        logger.log('✅ TypeORM configuration created');
        return config;
      },
    }),
    ScanModule,
    HealthModule,
  ],
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);
  
  constructor() {
    this.logger.log('🏗️ AppModule constructor called');
    this.logger.log('📦 Modules: ConfigModule, TypeOrmModule, ScanModule, HealthModule');
  }
}
