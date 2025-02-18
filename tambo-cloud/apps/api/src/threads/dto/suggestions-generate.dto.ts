import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SuggestionsGenerateDto {
  @ApiProperty({
    description: 'Maximum number of suggestions to generate',
    minimum: 1,
    maximum: 10,
    default: 3,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'Must generate at least 1 suggestion' })
  @Max(10, { message: 'Cannot generate more than 10 suggestions' })
  maxSuggestions?: number = 3;
}
