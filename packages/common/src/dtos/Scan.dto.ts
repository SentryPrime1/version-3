import { IsString, IsNumber, IsOptional, IsUrl, IsObject, IsEnum } from 'class-validator';

export enum ScanStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ScanOptions {
  depth?: number;
  timeout?: number;
  includeImages?: boolean;
  includeVideos?: boolean;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

/**
 * DTO for creating a new scan
 * This is used when creating a scan and includes all required fields
 */
export class CreateScanDto {
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url!: string;

  @IsNumber({}, { message: 'User ID must be a number' })
  userId!: number;

  @IsOptional()
  @IsObject()
  options?: ScanOptions;
}

/**
 * DTO for scan data received from client
 * This may not include all required fields (like userId which might come from auth context)
 */
export class ScanDto {
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url!: string;

  @IsOptional()
  @IsNumber({}, { message: 'User ID must be a number' })
  userId?: number;

  @IsOptional()
  @IsObject()
  options?: ScanOptions;
}

/**
 * DTO for updating scan status
 */
export class UpdateScanStatusDto {
  @IsEnum(ScanStatus, { message: 'Status must be pending, completed, or failed' })
  status!: ScanStatus;

  @IsOptional()
  @IsObject()
  results?: any;
}

/**
 * DTO for scan response
 * This represents the complete scan object returned to clients
 */
export class ScanResponseDto {
  @IsString()
  id!: string;

  @IsUrl()
  url!: string;

  @IsNumber()
  userId!: number;

  @IsEnum(ScanStatus)
  status!: ScanStatus;

  @IsOptional()
  @IsObject()
  options?: ScanOptions;

  @IsOptional()
  @IsObject()
  results?: any;

  @IsString()
  createdAt!: string;

  @IsString()
  updatedAt!: string;
}

/**
 * DTO for scan statistics
 */
export class ScanStatisticsDto {
  @IsNumber()
  total!: number;

  @IsNumber()
  pending!: number;

  @IsNumber()
  completed!: number;

  @IsNumber()
  failed!: number;
}

/**
 * DTO for queue status
 */
export class QueueStatusDto {
  @IsNumber()
  waiting!: number;

  @IsNumber()
  active!: number;

  @IsNumber()
  completed!: number;

  @IsNumber()
  failed!: number;
}

/**
 * DTO for health status
 */
export class HealthStatusDto {
  @IsString()
  status!: string;

  @IsObject()
  details!: {
    database: string;
    totalScans?: number;
    recentScans?: number;
    queue: string;
    timestamp: string;
    error?: string;
  };
}

