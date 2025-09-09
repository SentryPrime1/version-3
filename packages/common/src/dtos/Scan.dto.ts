import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ScanDto {
  @IsString()
  url!: string;

  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  compliance?: number;

  @IsArray()
  @IsOptional()
  violations?: any[];

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class CreateScanDto {
  @IsString()
  url!: string;

  @IsNumber()
  userId!: number;
}

export class ScanResultDto {
  @IsNumber()
  id!: number;

  @IsString()
  url!: string;

  @IsNumber()
  compliance!: number;

  @IsArray()
  violations!: any[];

  @IsString()
  status!: string;
}
