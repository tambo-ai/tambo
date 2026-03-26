import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { type HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/database-provider";
import { SkillsService } from "./skills.service";
import { ApiKeyGuard } from "../projects/guards/apikey.guard";
import { BearerTokenGuard } from "../projects/guards/bearer-token.guard";
import {
  ProjectAccessOwnGuard,
  ProjectIdParameterKey,
} from "../projects/guards/project-access-own.guard";
import { CreateSkillDto } from "./dto/create-skill.dto";
import { UpdateSkillDto } from "./dto/update-skill.dto";

@ApiTags("skills")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("v1/projects/:projectId/skills")
export class SkillsController {
  private readonly logger = new Logger(SkillsController.name);

  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
    private readonly skillsService: SkillsService,
  ) {}

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Post()
  @ApiOperation({ summary: "Create a skill for a project" })
  @ApiParam({ name: "projectId", description: "Project ID" })
  async create(
    @Param("projectId") projectId: string,
    @Body() dto: CreateSkillDto,
  ) {
    return await operations.createSkill(this.db, {
      projectId,
      name: dto.name,
      description: dto.description,
      instructions: dto.instructions,
    });
  }

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Get()
  @ApiOperation({ summary: "List all skills for a project" })
  @ApiParam({ name: "projectId", description: "Project ID" })
  async list(@Param("projectId") projectId: string) {
    return await operations.listSkillsForProject(this.db, projectId);
  }

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Get(":skillId")
  @ApiOperation({ summary: "Get a skill by ID" })
  @ApiParam({ name: "projectId", description: "Project ID" })
  @ApiParam({ name: "skillId", description: "Skill ID" })
  async get(
    @Param("projectId") projectId: string,
    @Param("skillId") skillId: string,
  ) {
    const skill = await operations.getSkill(this.db, projectId, skillId);
    if (!skill) {
      throw new NotFoundException(`Skill ${skillId} not found`);
    }
    return skill;
  }

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Put(":skillId")
  @ApiOperation({ summary: "Update a skill" })
  @ApiParam({ name: "projectId", description: "Project ID" })
  @ApiParam({ name: "skillId", description: "Skill ID" })
  async update(
    @Param("projectId") projectId: string,
    @Param("skillId") skillId: string,
    @Body() dto: UpdateSkillDto,
  ) {
    const updated = await operations.updateSkill(this.db, {
      projectId,
      skillId,
      name: dto.name,
      description: dto.description,
      instructions: dto.instructions,
      enabled: dto.enabled,
    });
    if (!updated) {
      throw new NotFoundException(`Skill ${skillId} not found`);
    }
    return updated;
  }

  @ProjectIdParameterKey("projectId")
  @UseGuards(ProjectAccessOwnGuard)
  @Delete(":skillId")
  @ApiOperation({ summary: "Delete a skill" })
  @ApiParam({ name: "projectId", description: "Project ID" })
  @ApiParam({ name: "skillId", description: "Skill ID" })
  async delete(
    @Param("projectId") projectId: string,
    @Param("skillId") skillId: string,
  ) {
    // Best-effort provider cleanup before DB delete
    const skill = await operations.getSkill(this.db, projectId, skillId);
    if (skill) {
      const project = await operations.getProject(this.db, projectId);
      const providerName = project?.defaultLlmProviderName;
      if (providerName && this.skillsService.supportsSkills(providerName)) {
        const apiKey = await this.skillsService.getProviderApiKey(
          projectId,
          providerName,
        );
        if (apiKey) {
          await this.skillsService.deleteFromProvider({
            skill,
            providerName,
            apiKey,
          });
        }
      }
    }
    await operations.deleteSkill(this.db, projectId, skillId);
  }
}
