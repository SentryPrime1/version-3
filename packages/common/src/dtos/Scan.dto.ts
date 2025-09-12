import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';

export class ScanDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsObject()
  options?: any;
}

export class CreateScanDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsObject()
  options?: any;
}

export class UpdateScanDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  results?: any;

  @IsOptional()
  @IsObject()
  options?: any;
}
