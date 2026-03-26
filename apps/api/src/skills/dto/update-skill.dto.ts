import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateSkillDto {
  @ApiProperty({ description: "Skill name in kebab-case", required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "name must be kebab-case (e.g. scheduling-assistant)",
  })
  name?: string;

  @ApiProperty({
    description: "Short description of the skill",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: "Full skill instructions", required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  instructions?: string;

  @ApiProperty({ description: "Whether the skill is enabled", required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
