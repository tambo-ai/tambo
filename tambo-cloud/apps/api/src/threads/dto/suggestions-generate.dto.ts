import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, Max, Min } from "class-validator";
import { AvailableComponentDto } from "./generate-component.dto";

@ApiSchema({ name: "SuggestionsGenerate" })
export class SuggestionsGenerateDto {
  @ApiProperty({
    description: "Maximum number of suggestions to generate",
    minimum: 1,
    maximum: 10,
    default: 3,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: "Must generate at least 1 suggestion" })
  @Max(10, { message: "Cannot generate more than 10 suggestions" })
  maxSuggestions?: number = 3;

  @ApiProperty({
    description: "Available components that can be used with this suggestion",
    example: [
      {
        name: "Button",
        description: "A clickable button component",
        contextTools: [
          {
            name: "fetchData",
            description: "Fetches data for the button",
            parameters: [],
          },
        ],
        props: {
          variant: "primary",
          size: "medium",
        },
      },
    ],
  })
  @IsOptional()
  availableComponents?: AvailableComponentDto[];
}
