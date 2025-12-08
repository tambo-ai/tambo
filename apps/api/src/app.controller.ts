import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { operations } from "@tambo-ai-cloud/db";
import { type Request } from "express";
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
  @Post("auth/mcp/access-token")
  @ApiOperation({
    summary: "Create an MCP access token",
    description:
      "Creates a JWT MCP access token for the project. If threadId is provided, the token will be bound to that thread. If threadId is omitted, a sessionless token will be created using the provided contextKey (or from Bearer token if not provided). Sessionless tokens can only access resources and prompts, not session-specific features. The token expires in 15 minutes and can be used as a bearer token.",
  })
  @ApiResponse({
    status: 201,
    description: "MCP access token created successfully",
    type: McpAccessTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - invalid authentication context or API key",
  })
  @ApiResponse({
    status: 404,
    description: "Thread not found or does not belong to project",
  })
  async createMcpAccessToken(
    @Body() createMcpAccessTokenDto: CreateMcpAccessTokenDto,
    @Req() request: Request,
  ): Promise<McpAccessTokenResponseDto> {
    const { threadId, contextKey: bodyContextKey } = createMcpAccessTokenDto;
    const contextInfo = extractContextInfo(request, bodyContextKey);
    const { projectId, contextKey } = contextInfo;

    // Only generate MCP access token if project has MCP servers configured
    const hasMcpServers = await operations.projectHasMcpServers(
      this.authService.getDb(),
      projectId,
    );

    if (!hasMcpServers) {
      return {};
    }

    // If threadId is provided, create a session-bound token
    if (threadId) {
      // Verify thread exists and belongs to project
      const thread = await operations.getThreadForProjectId(
        this.authService.getDb(),
        threadId,
        projectId,
      );
      if (!thread) {
        throw new NotFoundException("Thread not found");
      }

      const result = await this.authService.generateMcpAccessToken(projectId, {
        threadId,
      });

      return {
        mcpAccessToken: result.token,
        expiresAt: result.expiresAt,
        hasSession: result.hasSession,
      };
    }

    // Otherwise, create a sessionless token
    if (!contextKey) {
      throw new BadRequestException(
        "Context key is required for sessionless tokens (provide in body or use Bearer token authentication)",
      );
    }

    const result = await this.authService.generateMcpAccessToken(projectId, {
      contextKey,
    });

    return {
      mcpAccessToken: result.token,
      expiresAt: result.expiresAt,
      hasSession: result.hasSession,
    };
  }
}
