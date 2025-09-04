import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { Scan } from '../entities/scan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scan])],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}
