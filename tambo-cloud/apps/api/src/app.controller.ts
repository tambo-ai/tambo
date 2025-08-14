import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { AppService } from "./app.service";
import {
  CreateMcpAccessTokenDto,
  McpAccessTokenResponseDto,
} from "./common/dto/mcp-access-token.dto";
import { AuthService } from "./common/services/auth.service";
import { extractContextInfo } from "./common/utils/extract-context-info";
import { ApiKeyGuard } from "./projects/guards/apikey.guard";
import { BearerTokenGuard } from "./projects/guards/bearer-token.guard";

@ApiTags("Auth")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("health")
  async checkHealth() {
    const health = await this.appService.checkHealth();
    return {
      ...health,
      timestamp: new Date().toISOString(),
      sentry: {
        enabled: !!process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
      },
    };
  }

  @ApiSecurity("apiKey")
  @UseGuards(ApiKeyGuard, BearerTokenGuard)
  @Post("auth/mcp-access-token")
  @ApiOperation({
    summary: "Create an MCP access token",
    description:
      "Creates a JWT MCP access token using the project ID from the API key and a context key. The token expires in 15 minutes and can be used as a bearer token.",
  })
  @ApiResponse({
    status: 201,
    description: "MCP access token created successfully",
    type: McpAccessTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - missing context key or invalid API key",
  })
  async createMcpAccessToken(
    @Body() createMcpAccessTokenDto: CreateMcpAccessTokenDto,
    @Req() request: Request,
  ): Promise<McpAccessTokenResponseDto> {
    const { projectId, contextKey } = extractContextInfo(
      request,
      createMcpAccessTokenDto.contextKey,
    );

    const { threadId } = createMcpAccessTokenDto;

    const mcpAccessToken = await this.authService.generateMcpAccessToken(
      projectId,
      threadId,
      contextKey,
    );

    return {
      mcpAccessToken,
    };
  }
}
