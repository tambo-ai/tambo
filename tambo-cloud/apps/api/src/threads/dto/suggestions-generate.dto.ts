import { ApiProperty } from '@nestjs/swagger';
import { AvailableComponent } from '@use-hydra-ai/hydra-ai-server';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, Max, Min } from 'class-validator';

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

  @ApiProperty({
    description: 'Available components that can be used with this suggestion',
    required: false,
    isArray: true,
    example: [
      {
        name: 'Button',
        description: 'A clickable button component',
        contextTools: [
          {
            name: 'fetchData',
            description: 'Fetches data for the button',
            parameters: [],
          },
        ],
        props: {
          variant: 'primary',
          size: 'medium',
        },
      },
    ],
  })
  @IsArray()
  @IsOptional()
  availableComponents?: AvailableComponent[];
}
