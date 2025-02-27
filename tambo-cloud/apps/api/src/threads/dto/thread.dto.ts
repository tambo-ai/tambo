import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { GenerationStage } from '@use-hydra-ai/core';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ThreadRequest {
  @IsString()
  projectId!: string;

  @IsString()
  @IsOptional()
  contextKey?: string;

  @IsOptional()
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;

  @IsEnum(GenerationStage)
  @IsOptional()
  generationStage?: GenerationStage;

  @IsString()
  @IsOptional()
  statusMessage?: string;
}

@ApiSchema({ name: 'Thread' })
export class Thread extends ThreadRequest {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

@ApiSchema({
  name: 'UpdateComponentStateRequest',
})
export class UpdateComponentStateDto {
  @ApiProperty({
    additionalProperties: true,
  })
  /** The new state of the component */
  state!: Record<string, unknown>;
}
