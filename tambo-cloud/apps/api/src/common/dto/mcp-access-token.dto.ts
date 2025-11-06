import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@ApiSchema({
  name: "CreateMcpAccessToken",
  description: "Create MCP access token request",
})
export class CreateMcpAccessTokenDto {
  @ApiProperty({
    description: "Context key for the MCP access token",
    example: "user-context-123",
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  contextKey?: string;

  @ApiProperty({
    description: "Thread ID for the MCP access token",
    example: "thread-123",
  })
  @IsString()
  @IsNotEmpty()
  threadId!: string;
}

@ApiSchema({
  name: "McpAccessTokenResponse",
  description: "MCP access token response",
})
export class McpAccessTokenResponseDto {
  @ApiProperty({
    description:
      "JWT MCP access token to be used as bearer token. Only included when MCP servers are configured for the project.",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  mcpAccessToken?: string;
}
