import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import {
  ActionType,
  ComponentDecision,
  ContentPartType,
  GenerationStage,
  MessageRole,
  ThreadMessage,
} from '@use-hydra-ai/core';
import {
  ChatMessage,
  HydraBackend,
  generateChainId,
} from '@use-hydra-ai/hydra-ai-server';
import { decryptProviderKey } from '../common/key.utils';
import { TransactionInterceptor } from '../common/middleware/db-transaction-middleware';
import { CorrelationLoggerService } from '../common/services/logger.service';
import { ProjectsService } from '../projects/projects.service';
import { ThreadMessageDto } from '../threads/dto/message.dto';
import { ThreadsService } from '../threads/threads.service';
import {
  ComponentDecision as ComponentDecisionDto,
  GenerateComponentResponse,
} from './dto/component-decision.dto';
import {
  AvailableComponentDto,
  GenerateComponentRequest,
  GenerateComponentRequest2,
} from './dto/generate-component.dto';
import {
  HydrateComponentRequest,
  HydrateComponentRequest2,
} from './dto/hydrate-component.dto';
import { ApiKeyGuard } from './guards/apikey.guard';

@ApiSecurity('apiKey')
@UseGuards(ApiKeyGuard)
@UseInterceptors(TransactionInterceptor)
@Controller('components')
export class ComponentsController {
  constructor(
    private projectsService: ProjectsService,
    private threadsService: ThreadsService,
    private logger: CorrelationLoggerService,
  ) {}

  private async validateProjectAndProviderKeys(projectId: string) {
    const project = await this.projectsService.findOneWithKeys(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const providerKeys = project.getProviderKeys();
    if (!providerKeys?.length) {
      throw new NotFoundException('No provider keys found for project');
    }
    const providerKey =
      providerKeys[providerKeys.length - 1].providerKeyEncrypted; // Use the last provider key
    if (!providerKey) {
      throw new NotFoundException('No provider key found for project');
    }
    return decryptProviderKey(providerKey);
  }

  @Post('generate')
  async generateComponent(
    @Body() generateComponentDto: GenerateComponentRequest,
    @Req() request, // Assumes the request object has the projectId
  ): Promise<ComponentDecisionDto> {
    const { messageHistory, availableComponents, threadId, contextKey } =
      generateComponentDto;
    if (!messageHistory?.length) {
      throw new BadRequestException(
        'Message history is required and cannot be empty',
      );
    }
    // TODO: this assumes that only the last message is new - if the payload has
    // additional messages that aren't previously present in the thread, should
    // we add them? Or perhaps this API should only accept a single message and get
    // the rest of the thread from the db.
    const lastMessageEntry = messageHistory[messageHistory.length - 1];
    this.logger.log(
      `generating component for project ${request.projectId}, with message: ${lastMessageEntry.message}`,
    );
    const projectId = request.projectId;
    const decryptedProviderKey =
      await this.validateProjectAndProviderKeys(projectId);

    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
    );

    //TODO: Don't instantiate HydraBackend every request
    const hydraBackend = new HydraBackend(
      decryptedProviderKey.providerKey,
      await generateChainId(resolvedThreadId),
    );
    await this.threadsService.addMessage(resolvedThreadId, {
      role: MessageRole.User,
      content: [{ type: ContentPartType.Text, text: lastMessageEntry.message }],
    });

    const component = await hydraBackend.generateComponent(
      messageHistory,
      availableComponents ?? {},
      resolvedThreadId,
    );
    await this.addDecisionToThread(resolvedThreadId, component);

    return { ...component, threadId: resolvedThreadId };
  }

  @Post('generate2')
  async generateComponent2(
    @Body() generateComponentDto: GenerateComponentRequest2,
    @Req() request, // Assumes the request object has the projectId
  ): Promise<GenerateComponentResponse> {
    const { content, availableComponents, threadId, contextKey } =
      generateComponentDto;
    if (!content?.length) {
      throw new BadRequestException(
        'Message history is required and cannot be empty',
      );
    }
    const projectId = request.projectId;
    const decryptedProviderKey =
      await this.validateProjectAndProviderKeys(projectId);

    const contentText = content.map((part) => part.text).join('');
    this.logger.log(
      `generating component for project ${projectId}, with message: ${contentText}`,
    );
    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
    );

    //TODO: Don't instantiate HydraBackend every request
    const hydraBackend = new HydraBackend(
      decryptedProviderKey.providerKey,
      await generateChainId(resolvedThreadId),
      { version: 'v2' },
    );

    await this.threadsService.addMessage(resolvedThreadId, {
      role: MessageRole.User,
      content,
    });

    // Now refetch the whole thread to get the entire message history
    const currentThreadMessages =
      await this.threadsService.getMessages(resolvedThreadId);
    const messageHistory = convertThreadMessagesToLegacyThreadMessages(
      currentThreadMessages,
    );
    const availableComponentMap: Record<string, AvailableComponentDto> =
      availableComponents.reduce((acc, component) => {
        acc[component.name] = component;
        return acc;
      }, {});
    try {
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.CHOOSING_COMPONENT,
      );
      const component = await hydraBackend.generateComponent(
        messageHistory,
        availableComponentMap,
        resolvedThreadId,
      );
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        component.toolCallRequest
          ? GenerationStage.FETCHING_CONTEXT
          : GenerationStage.COMPLETE,
        component.toolCallRequest &&
          `Fetching extra data to hydrate ${component.componentName}...`,
      );
      const message = await this.addDecisionToThread(
        resolvedThreadId,
        component,
      );

      return { message };
    } catch (error: any) {
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.ERROR,
        'Error generating component',
      );
      throw error;
    }
  }

  @Post('generatestream')
  async generateComponentStream(
    @Body() generateComponentDto: GenerateComponentRequest2,
    @Req() request,
    @Res() response,
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    const { content, availableComponents, threadId, contextKey } =
      generateComponentDto;
    if (!content?.length) {
      throw new BadRequestException(
        'Message history is required and cannot be empty',
      );
    }

    const projectId = request.projectId;
    const decryptedProviderKey =
      await this.validateProjectAndProviderKeys(projectId);

    const contentText = content.map((part) => part.text).join('');
    this.logger.log(
      `generating component for project ${projectId}, with message: ${contentText}`,
    );
    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
    );

    const hydraBackend = new HydraBackend(
      decryptedProviderKey.providerKey,
      await generateChainId(resolvedThreadId),
      { version: 'v2' },
    );

    await this.threadsService.addMessage(resolvedThreadId, {
      role: MessageRole.User,
      content,
    });

    const currentThreadMessages =
      await this.threadsService.getMessages(resolvedThreadId);
    const messageHistory = convertThreadMessagesToLegacyThreadMessages(
      currentThreadMessages,
    );
    const availableComponentMap: Record<string, AvailableComponentDto> =
      availableComponents.reduce((acc, component) => {
        acc[component.name] = component;
        return acc;
      }, {});

    try {
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.CHOOSING_COMPONENT,
      );

      const stream = await hydraBackend.generateComponent(
        messageHistory,
        availableComponentMap,
        resolvedThreadId,
        true,
      );

      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.STREAMING_RESPONSE,
        'Streaming response...',
      );

      let finalComponent: ComponentDecision | undefined;
      let lastUpdateTime = 0;
      const updateIntervalMs = 500;

      const inProgressMessage = await this.addDecisionToThread(
        resolvedThreadId,
        {
          message: 'streaming in progress...',
          toolCallRequest: undefined,
          componentName: '',
          props: {},
          threadId: resolvedThreadId,
        },
      );

      for await (const chunk of stream) {
        finalComponent = chunk;
        const currentTime = Date.now();

        // Update db message on interval
        if (currentTime - lastUpdateTime >= updateIntervalMs) {
          await this.updateMessage(inProgressMessage.id, {
            ...chunk,
            message:
              chunk.message.length > 0
                ? chunk.message
                : 'streaming in progress...',
          });
          lastUpdateTime = currentTime;
        }

        response.write(
          `data: ${JSON.stringify({
            ...inProgressMessage,
            content: [{ type: ContentPartType.Text, text: chunk.message }],
            component: chunk,
            actionType: chunk.toolCallRequest ? ActionType.ToolCall : undefined,
            toolCallRequest: chunk.toolCallRequest,
          })}\n\n`,
        );
      }

      // Ensure final state is saved
      if (finalComponent) {
        await this.threadsService.updateGenerationStage(
          resolvedThreadId,
          finalComponent.toolCallRequest
            ? GenerationStage.FETCHING_CONTEXT
            : GenerationStage.COMPLETE,
          finalComponent.toolCallRequest &&
            `Fetching extra data to hydrate ${finalComponent.componentName}...`,
        );
        await this.updateMessage(inProgressMessage.id, {
          ...finalComponent,
          message:
            finalComponent.message.length > 0
              ? finalComponent.message
              : 'streaming in progress...',
        });
      }
    } catch (error: any) {
      this.logger.error('Error in generateComponentStream:', error);
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.ERROR,
        'Error generating component',
      );
      response.write(
        `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`,
      );
    } finally {
      response.write('data: DONE\n\n');
      response.end();
    }
  }

  private async addDecisionToThread(
    threadId: string,
    component: ComponentDecision,
  ) {
    return await this.threadsService.addMessage(threadId, {
      role: MessageRole.Hydra,
      content: [{ type: ContentPartType.Text, text: component.message }],
      // HACK: for now just jam the full component decision into the content,
      // but we should filter out the old toolCallRequest / suggestedActions
      component: component,
      actionType: component.toolCallRequest ? ActionType.ToolCall : undefined,
      toolCallRequest: component.toolCallRequest,
      // suggestedActions: component.suggestedActions,
    });
  }

  private async updateMessage(messageId: string, component: ComponentDecision) {
    return await this.threadsService.updateMessage(messageId, {
      role: MessageRole.Hydra,
      content: [{ type: ContentPartType.Text, text: component.message }],
      component: component,
      actionType: component.toolCallRequest ? ActionType.ToolCall : undefined,
      toolCallRequest: component.toolCallRequest,
    });
  }

  @Post('hydrate')
  async hydrateComponent(
    @Body() hydrateComponentDto: HydrateComponentRequest,
    @Req() request, // Assumes the request object has the projectId
  ): Promise<ComponentDecisionDto> {
    const {
      messageHistory = [],
      component,
      toolResponse,
      threadId,
      contextKey,
    } = hydrateComponentDto;
    const projectId = request.projectId;
    const decryptedProviderKey =
      await this.validateProjectAndProviderKeys(projectId);

    if (!component) {
      throw new BadRequestException('Component is required');
    }
    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
    );

    const hydraBackend = new HydraBackend(
      decryptedProviderKey.providerKey,
      await generateChainId(resolvedThreadId),
    );

    const toolResponseString =
      typeof toolResponse === 'string'
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

      const hydratedComponent = await hydraBackend.hydrateComponentWithData(
        messageHistory,
        component,
        toolResponse,
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
        'Error hydrating component',
      );
      throw error;
    }
  }

  @Post('hydrate2')
  async hydrateComponent2(
    @Body() hydrateComponentDto: HydrateComponentRequest2,
    @Req() request, // Assumes the request object has the projectId
  ): Promise<GenerateComponentResponse> {
    const { component, toolResponse, threadId, contextKey } =
      hydrateComponentDto;
    const projectId = request.projectId;
    const decryptedProviderKey =
      await this.validateProjectAndProviderKeys(projectId);

    if (!component) {
      throw new BadRequestException('Component is required');
    }
    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
      true,
    );

    const hydraBackend = new HydraBackend(
      decryptedProviderKey.providerKey,
      await generateChainId(resolvedThreadId),
      { version: 'v2' },
    );

    const toolResponseString =
      typeof toolResponse === 'string'
        ? toolResponse
        : JSON.stringify(toolResponse);
    await this.threadsService.addMessage(resolvedThreadId, {
      role: MessageRole.Tool,
      content: [{ type: ContentPartType.Text, text: toolResponseString }],
      actionType: ActionType.ToolResponse,
    });

    const currentThreadMessages =
      await this.threadsService.getMessages(resolvedThreadId);
    const messageHistory = convertThreadMessagesToLegacyThreadMessages(
      currentThreadMessages,
    );
    try {
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.HYDRATING_COMPONENT,
        `Hydrating ${component.name}...`,
      );
      const hydratedComponent = await hydraBackend.hydrateComponentWithData(
        messageHistory,
        component,
        toolResponse,
        resolvedThreadId,
      );

      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.COMPLETE,
        `Hydrated ${component.name} successfully`,
      );

      const message = await this.addDecisionToThread(
        resolvedThreadId,
        hydratedComponent,
      );

      this.logger.log(
        `hydrated component: ${JSON.stringify(hydratedComponent)}`,
      );
      return { message };
    } catch (error: any) {
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.ERROR,
        'Error hydrating component',
      );
      throw error;
    }
  }

  @Post('hydratestream')
  async hydrateComponentStream(
    @Body() hydrateComponentDto: HydrateComponentRequest2,
    @Req() request, // Assumes the request object has the projectId
    @Res() response,
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    const { component, toolResponse, threadId, contextKey } =
      hydrateComponentDto;
    const projectId = request.projectId;
    const decryptedProviderKey =
      await this.validateProjectAndProviderKeys(projectId);

    if (!component) {
      throw new BadRequestException('Component is required');
    }
    const resolvedThreadId = await this.ensureThread(
      projectId,
      threadId,
      contextKey,
      true,
    );

    const hydraBackend = new HydraBackend(
      decryptedProviderKey.providerKey,
      await generateChainId(resolvedThreadId),
      { version: 'v2' },
    );

    const toolResponseString =
      typeof toolResponse === 'string'
        ? toolResponse
        : JSON.stringify(toolResponse);
    await this.threadsService.addMessage(resolvedThreadId, {
      role: MessageRole.Tool,
      content: [{ type: ContentPartType.Text, text: toolResponseString }],
      actionType: ActionType.ToolResponse,
    });

    const currentThreadMessages =
      await this.threadsService.getMessages(resolvedThreadId);
    const messageHistory = convertThreadMessagesToLegacyThreadMessages(
      currentThreadMessages,
    );
    await this.threadsService.updateGenerationStage(
      resolvedThreadId,
      GenerationStage.HYDRATING_COMPONENT,
      `Hydrating ${component.name}...`,
    );
    const stream = await hydraBackend.hydrateComponentWithData(
      messageHistory,
      component,
      toolResponse,
      resolvedThreadId,
      true,
    );

    try {
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.STREAMING_RESPONSE,
      );
      let finalComponent: ComponentDecision | undefined;
      let lastUpdateTime = 0;
      const updateIntervalMs = 500;

      const inProgressMessage = await this.addDecisionToThread(
        resolvedThreadId,
        {
          message: 'streaming in progress...',
          toolCallRequest: undefined,
          componentName: '',
          props: {},
          threadId: resolvedThreadId,
        },
      );

      for await (const chunk of stream) {
        finalComponent = chunk;
        const currentTime = Date.now();

        // Update db message on interval
        if (currentTime - lastUpdateTime >= updateIntervalMs) {
          await this.updateMessage(inProgressMessage.id, {
            ...chunk,
            message:
              chunk.message.length > 0
                ? chunk.message
                : 'streaming in progress...',
          });

          lastUpdateTime = currentTime;
        }

        response.write(
          `data: ${JSON.stringify({
            ...inProgressMessage,
            content: [{ type: ContentPartType.Text, text: chunk.message }],
            component: chunk,
            actionType: chunk.toolCallRequest ? ActionType.ToolCall : undefined,
            toolCallRequest: chunk.toolCallRequest,
          })}\n\n`,
        );
      }

      // Ensure final state is saved
      if (finalComponent) {
        await this.threadsService.updateGenerationStage(
          resolvedThreadId,
          GenerationStage.COMPLETE,
          `Hydrated ${component.name} successfully`,
        );

        await this.updateMessage(inProgressMessage.id, {
          ...finalComponent,
          message:
            finalComponent.message.length > 0
              ? finalComponent.message
              : 'streaming in progress...',
        });
      }
    } catch (error: any) {
      this.logger.error('Error in hydrateComponentStream:', error);
      await this.threadsService.updateGenerationStage(
        resolvedThreadId,
        GenerationStage.ERROR,
        'Error hydrating component',
      );
      response.write(
        `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`,
      );
    } finally {
      response.write('data: DONE\n\n');
      response.end();
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
        'Thread ID is required, and cannot be created',
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

function convertThreadMessagesToLegacyThreadMessages(
  currentThreadMessages: ThreadMessage[] | ThreadMessageDto[],
) {
  return currentThreadMessages.map(
    (message): ChatMessage => ({
      sender: [MessageRole.User, MessageRole.Tool].includes(message.role)
        ? (message.role as 'user' | 'tool')
        : 'hydra',
      message: message.content
        .map((part) => {
          switch (part.type) {
            case ContentPartType.Text:
              return part.text ?? '';
            default:
              return '';
          }
        })
        .join(''),
    }),
  );
}
