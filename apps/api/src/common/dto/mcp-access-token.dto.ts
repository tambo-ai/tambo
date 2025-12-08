import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

@ApiSchema({
  name: "CreateMcpAccessToken",
  description: "Create MCP access token request",
})
export class CreateMcpAccessTokenDto {
  @ApiProperty({
    description:
      "Thread ID for the MCP access token. If provided, the token will be bound to this thread. If omitted, a sessionless token will be created.",
    example: "thread-123",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  threadId?: string;

  @ApiProperty({
    description:
      "Context key for sessionless MCP access tokens. If not provided, will be extracted from Bearer token.",
    example: "user-context-123",
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  contextKey?: string;
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
    required: false,
  })
  mcpAccessToken?: string;

  @ApiProperty({
    description:
      "Expiration time of the token in milliseconds since epoch. Only included when mcpAccessToken is present.",
    example: 1704123456789,
    required: false,
  })
  expiresAt?: number;

  @ApiProperty({
    description:
      "Whether the token is bound to a specific thread session. Only included when mcpAccessToken is present.",
    example: true,
    required: false,
  })
  hasSession?: boolean;
}
