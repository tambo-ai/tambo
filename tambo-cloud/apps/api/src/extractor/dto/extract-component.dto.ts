import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class ExtractComponentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000000) // 1MB max file size
  content?: string;

  @IsUUID()
  correlationId?: string;
}
