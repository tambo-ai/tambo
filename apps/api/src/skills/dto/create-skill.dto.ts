import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength, Matches } from "class-validator";

export class CreateSkillDto {
  @ApiProperty({
    description: "Skill name in kebab-case",
    example: "scheduling-assistant",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "name must be kebab-case (e.g. scheduling-assistant)",
  })
  name!: string;

  @ApiProperty({ description: "Short description of the skill" })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiProperty({ description: "Full skill instructions" })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  instructions!: string;
}
