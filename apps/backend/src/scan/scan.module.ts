import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { Scan } from '../entities/scan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scan])],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {
  private readonly logger = new Logger(ScanModule.name);
  
  constructor() {
    this.logger.log('🔧 ScanModule constructor called');
    this.logger.log('📊 Registering Scan entity with TypeORM');
    this.logger.log('🎮 Registering ScanController');
    this.logger.log('⚙️ Registering ScanService');
  }
}
