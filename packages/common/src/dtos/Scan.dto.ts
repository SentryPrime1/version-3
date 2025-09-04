import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class ScanDto {
  @IsUrl({}, { message: 'URL must be a valid URL' })
  @IsNotEmpty({ message: 'URL is required' })
  url!: string;

  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;
}
