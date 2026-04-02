import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { MEMORY_CATEGORIES } from "@tambo-ai-cloud/core";

export class CreateMemoryDto {
  @ApiPropertyOptional({ description: "User key for context scoping" })
  @IsOptional()
  @IsString()
  userKey?: string;

  @ApiProperty({ description: "The fact or preference to remember" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;

  @ApiProperty({
    description: "Memory category",
    enum: MEMORY_CATEGORIES,
  })
  @IsString()
  @IsIn([...MEMORY_CATEGORIES])
  category!: (typeof MEMORY_CATEGORIES)[number];

  @ApiPropertyOptional({
    description: "Importance score (1-5, default 3)",
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  importance?: number;
}
