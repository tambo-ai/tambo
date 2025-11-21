import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { ProblemDetails } from "../types/errors";

/** DTO for RFC9457: JSON Problem Details */
@ApiSchema({ name: "ProblemDetails" })
export class ProblemDetailsDto implements ProblemDetails {
  @ApiProperty({
    description: "A URI reference that identifies the problem type",
    example: "https://problems-registry.smartbear.com/not-found",
    format: "uri",
    maxLength: 1024,
  })
  @IsString()
  @IsUrl()
  @MaxLength(1024)
  @IsNotEmpty()
  type!: string;

  @ApiProperty({
    description: "The HTTP status code for this occurrence of the problem",
    example: 404,
    minimum: 100,
    maximum: 599,
  })
  @IsInt()
  @Min(100)
  @Max(599)
  status?: number;

  @ApiProperty({
    description: "A short, human-readable summary of the problem type",
    example: "Resource Not Found",
    maxLength: 1024,
  })
  @IsString()
  @MaxLength(1024)
  title?: string;

  @ApiProperty({
    description:
      "A human-readable explanation specific to this occurrence of the problem",
    example: "Message with ID 'msg_123456789' was not found",
    maxLength: 4096,
  })
  @IsString()
  @MaxLength(4096)
  detail?: string;

  @ApiProperty({
    description:
      "A URI reference that identifies the specific occurrence of the problem",
    example: "/threads/123/messages/msg_123456789",
    maxLength: 1024,
  })
  @IsString()
  @MaxLength(1024)
  @IsOptional()
  instance?: string;

  @ApiProperty({
    description:
      "An API specific error code aiding the provider team understand the error",
    example: "MSG_NOT_FOUND",
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  code?: string;

  @ApiProperty({
    description:
      "An array of error details to accompany a problem details response",
    example: [
      {
        detail: "Invalid message ID format",
        pointer: "/messageId",
      },
    ],
  })
  @IsArray()
  @IsOptional()
  errors?: Array<{
    detail: string;
    pointer?: string;
  }>;

  @ApiProperty({
    description: "Additional error details specific to this occurrence",
    example: { messageId: "msg_123456789" },
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;
}
