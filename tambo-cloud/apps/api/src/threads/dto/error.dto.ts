import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

@ApiSchema({ name: "Error" })
export class ErrorDto {
  @ApiProperty({
    description: "Error message describing what went wrong",
    example: "Message not found",
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    description: "Error code identifying the type of error",
    example: "NOT_FOUND",
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: "Additional error details",
    example: { messageId: "msg_123456789" },
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, unknown>;
}
