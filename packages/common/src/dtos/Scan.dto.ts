import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class ScanDto {
  @IsString()
  @IsNotEmpty()
  url!: string; // Definite assignment assertion - will be assigned by class-validator

  @IsOptional()
  @IsObject()
  options?: any;
}

export class CreateScanDto {
  @IsString()
  @IsNotEmpty()
  url!: string; // Definite assignment assertion - will be assigned by class-validator

  @IsOptional()
  @IsObject()
  options?: any;

  @IsString()
  @IsNotEmpty()
  userId!: string; // Definite assignment assertion - will be assigned by class-validator
}

