import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiSecurity } from "@nestjs/swagger";
import {
  ChatMessage,
  generateChainId,
  TamboBackend,
} from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  GenerationStage,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import { Request } from "express";
import { decryptProviderKey } from "../common/key.utils";
import { CorrelationLoggerService } from "../common/services/logger.service";
import { ProjectsService } from "../projects/projects.service";
import { ThreadsService } from "../threads/threads.service";
import { ComponentDecisionDto } from "./dto/component-decision.dto";
import { GenerateComponentRequest } from "./dto/generate-component.dto";
import { HydrateComponentRequest } from "./dto/hydrate-component.dto";
import { ApiKeyGuard, ProjectId } from "./guards/apikey.guard";

@ApiSecurity("apiKey")
@UseGuards(ApiKeyGuard)
@Controller("components")
export class ComponentsController {
  constructor(
    private projectsService: ProjectsService,
    private threadsService: ThreadsService,
    private logger: CorrelationLoggerService,
  ) {}

  private async validateProjectAndProviderKeys(projectId: string) {
    const project = await this.projectsService.findOneWithKeys(projectId);
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    const providerKeys = project.getProviderKeys();
    if (!providerKeys?.length) {
      throw new NotFoundException("No provider keys found for project");
    }
    const providerKey =
      providerKeys[providerKeys.length - 1].providerKeyEncrypted; // Use the last provider key
    if (!providerKey) {
      throw new NotFoundException("No provider key found for project");
    }
    return decryptProviderKey(providerKey);
  }

  @ApiOperation({ deprecated: true })
  @Post("generate")
  async generateComponent(
    @Body() generateComponentDto: GenerateComponentRequest,
    @Req() request: Request, // Assumes the request object has the projectId
  ): Promise<ComponentDecisionDto> {
    const { messageHistory, availableComponents, threadId, contextKey } =
      generateComponentDto;
    if (!messageHistory?.length) {
      throw new BadRequestException(
        "Message history is required and cannot be empty",
      );
    }
    // TODO: this assumes that only the last message is new - if the payload has
    // additional messages that aren't previously present in the thread, should
    // we add them? Or perhaps this API should only accept a single message and get
    // the rest of the thread from the db.
    const lastMessageEntry = messageHistory[messageHistory.length - 1];
    this.logger.log(
      `generating component for project ${request[ProjectId]}, with message: ${lastMessageEntry.message}`,
    );
    const projectId = request[ProjectId];
    if (!projectId) {
      throw new BadRequestException("Project ID is required");
    }
    const decryptedProviderKey =
      await this.validateProjectAndProviderKeys(projectId);

    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
    );

    //TODO: Don't instantiate TamboBackend every request
    const tamboBackend = new TamboBackend(
      decryptedProviderKey.providerKey,
      await generateChainId(resolvedThreadId),
    );
    await this.threadsService.addMessage(resolvedThreadId, {
      role: MessageRole.User,
      content: [{ type: ContentPartType.Text, text: lastMessageEntry.message }],
    });

    const component = await tamboBackend.generateComponent(
      legacyChatMessagesToThreadMessages(messageHistory, resolvedThreadId),
      availableComponents ?? {},
      resolvedThreadId,
    );
    await this.addDecisionToThread(resolvedThreadId, component);

    return { ...component, threadId: resolvedThreadId };
  }

  private async addDecisionToThread(
    threadId: string,
    component: LegacyComponentDecision,
  ) {
    return await this.threadsService.addMessage(threadId, {
      role: MessageRole.Assistant,
      content: [{ type: ContentPartType.Text, text: component.message }],
      // HACK: for now just jam the full component decision into the content,
      // but we should filter out the old toolCallRequest / suggestedActions
      component: component,
      actionType: component.toolCallRequest ? ActionType.ToolCall : undefined,
      toolCallRequest: component.toolCallRequest,
      // suggestedActions: component.suggestedActions,
    });
  }

  @ApiOperation({ deprecated: true })
  @Post("hydrate")
  async hydrateComponent(
    @Body() hydrateComponentDto: HydrateComponentRequest,
    @Req() request: Request, // Assumes the request object has the projectId
  ): Promise<ComponentDecisionDto> {
    const {
      messageHistory = [],
      component,
      toolResponse,
      threadId,
      contextKey,
    } = hydrateComponentDto;
    const projectId = request[ProjectId];
    if (!projectId) {
      throw new BadRequestException("Project ID is required");
    }
    const decryptedProviderKey =
      await this.validateProjectAndProviderKeys(projectId);

    if (!component) {
      throw new BadRequestException("Component is required");
    }
    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
    );

    const tamboBackend = new TamboBackend(
      decryptedProviderKey.providerKey,
      await generateChainId(resolvedThreadId),
    );

    const toolResponseString =
      typeof toolResponse === "string"
        ? toolResponse
        : JSON.stringify(toolResponse);
    try {
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.HYDRATING_COMPONENT,
        `Hydrating ${component.name}...`,
      );

      await this.threadsService.addMessage(resolvedThreadId, {
        role: MessageRole.Tool,
        content: [{ type: ContentPartType.Text, text: toolResponseString }],
        actionType: ActionType.ToolResponse,
      });

      const hydratedComponent = await tamboBackend.hydrateComponentWithData(
        legacyChatMessagesToThreadMessages(messageHistory, resolvedThreadId),
        component,
        toolResponse,
        undefined,
        resolvedThreadId,
      );

      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.COMPLETE,
        `Hydrated ${component.name} successfully`,
      );

      await this.addDecisionToThread(resolvedThreadId, hydratedComponent);

      this.logger.log(
        `hydrated component: ${JSON.stringify(hydratedComponent)}`,
      );
      return { ...hydratedComponent, threadId: resolvedThreadId };
    } catch (error: any) {
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.ERROR,
        "Error hydrating component",
      );
      throw error;
    }
  }

  private async ensureThread(
    projectId: string,
    threadId: string | undefined,
    contextKey: string | undefined,
    preventCreate: boolean = false,
  ) {
    // If the threadId is provided, ensure that the thread belongs to the project
    if (threadId) {
      await this.threadsService.ensureThreadByProjectId(threadId, projectId);
      // TODO: should we update contextKey?
      return threadId;
    }

    if (preventCreate) {
      throw new BadRequestException(
        "Thread ID is required, and cannot be created",
      );
    }
    // If the threadId is not provided, create a new thread
    const newThread = await this.threadsService.createThread({
      projectId,
      contextKey,
    });
    return newThread.id;
  }
}

function legacyChatMessagesToThreadMessages(
  messageHistory: ChatMessage[],
  threadId: string,
): ThreadMessage[] {
  return messageHistory.map(
    (message, index): ThreadMessage => ({
      role:
        message.sender === "hydra"
          ? MessageRole.User
          : (message.sender as MessageRole),
      id: `message-${index}`,
      threadId,
      ...message,
      content: [
        {
          type: "text",
          text: message.message,
        },
      ],
      componentState: {},
      createdAt: new Date(),
      tool_call_id: undefined,
    }),
  );
}
