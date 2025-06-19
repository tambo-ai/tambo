import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { Request } from "express";
import { AppService } from "./app.service";
import {
  CreateMcpAccessTokenDto,
  McpAccessTokenResponseDto,
} from "./common/dto/mcp-access-token.dto";
import { AuthService } from "./common/services/auth.service";
import { ApiKeyGuard, ProjectId } from "./projects/guards/apikey.guard";

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
    return await this.appService.checkHealth();
  }

  @ApiSecurity("apiKey")
  @UseGuards(ApiKeyGuard)
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
    if (!request[ProjectId]) {
      throw new BadRequestException("Project ID is required");
    }

    const projectId = request[ProjectId];
    const { threadId } = createMcpAccessTokenDto;

    const mcpAccessToken = await this.authService.generateMcpAccessToken(
      projectId,
      threadId,
    );

    return {
      mcpAccessToken,
    };
  }
}
