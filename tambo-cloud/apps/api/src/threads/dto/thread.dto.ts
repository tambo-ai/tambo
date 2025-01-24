import { IsOptional, IsString } from 'class-validator';

export class ThreadDto {
  @IsString()
  projectId!: string;

  @IsString()
  @IsOptional()
  contextKey?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
