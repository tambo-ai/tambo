import { IsOptional, IsString } from 'class-validator';

export class ThreadRequest {
  @IsString()
  projectId!: string;

  @IsString()
  @IsOptional()
  contextKey?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
