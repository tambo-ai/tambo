import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import {
  ActionType,
  ComponentDecision,
  ContentPartType,
  MessageRole,
  ThreadMessage,
} from '@use-hydra-ai/core';
import {
  ChatMessage,
  HydraBackend,
  generateChainId,
} from '@use-hydra-ai/hydra-ai-server';
import { decryptProviderKey } from '../common/key.utils';
import { CorrelationLoggerService } from '../common/services/logger.service';
import { ProjectsService } from '../projects/projects.service';
import { ThreadMessageDto } from '../threads/dto/message.dto';
import { ThreadsService } from '../threads/threads.service';
import {
  ComponentDecision as ComponentDecisionDto,
  GenerateComponentResponse,
} from './dto/component-decision.dto';
import {
  AvailableComponent,
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
    const availableComponentMap: Record<string, AvailableComponent> =
      availableComponents.reduce((acc, component) => {
        acc[component.name] = component;
        return acc;
      }, {});
    const component = await hydraBackend.generateComponent(
      messageHistory,
      availableComponentMap,
      resolvedThreadId,
    );
    const message = await this.addDecisionToThread(resolvedThreadId, component);

    return { message };
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
    const availableComponentMap: Record<string, AvailableComponent> =
      availableComponents.reduce((acc, component) => {
        acc[component.name] = component;
        return acc;
      }, {});

    try {
      const stream = await hydraBackend.generateComponent(
        messageHistory,
        availableComponentMap,
        resolvedThreadId,
        true,
      );

      const tempId = new Date().toISOString();
      let finalComponent: ComponentDecision | undefined;
      for await (const chunk of stream) {
        //TODO: don't create threadmessage here, add 'in-progress' message to thread and update on each chunk
        finalComponent = chunk;
        const threadMessage: ThreadMessageDto = {
          role: MessageRole.Hydra,
          content: [{ type: ContentPartType.Text, text: chunk.message }],
          id: tempId,
          threadId: resolvedThreadId,
          component: chunk,
          createdAt: new Date(),
          actionType: chunk.toolCallRequest ? ActionType.ToolCall : undefined,
          toolCallRequest: chunk.toolCallRequest,
        };
        response.write(`data: ${JSON.stringify(threadMessage)}\n\n`);
      }
      if (finalComponent) {
        await this.addDecisionToThread(resolvedThreadId, finalComponent);
      }
    } catch (error: any) {
      this.logger.error('Error in generateComponentStream:', error);
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

    await this.addDecisionToThread(resolvedThreadId, hydratedComponent);

    this.logger.log(`hydrated component: ${JSON.stringify(hydratedComponent)}`);
    return { ...hydratedComponent, threadId: resolvedThreadId };
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
    const hydratedComponent = await hydraBackend.hydrateComponentWithData(
      messageHistory,
      component,
      toolResponse,
      resolvedThreadId,
    );

    const message = await this.addDecisionToThread(
      resolvedThreadId,
      hydratedComponent,
    );

    this.logger.log(`hydrated component: ${JSON.stringify(hydratedComponent)}`);
    return { message };
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
    const stream = await hydraBackend.hydrateComponentWithData(
      messageHistory,
      component,
      toolResponse,
      resolvedThreadId,
      true,
    );

    try {
      const tempId = new Date().toISOString();
      let finalComponent: ComponentDecision | undefined;

      for await (const chunk of stream) {
        //TODO: don't create threadmessage here, add 'in-progress' message to thread and update on each chunk
        finalComponent = chunk;
        const threadMessage: ThreadMessageDto = {
          role: MessageRole.Hydra,
          content: [{ type: ContentPartType.Text, text: chunk.message }],
          id: tempId,
          threadId: resolvedThreadId,
          component: chunk,
          createdAt: new Date(),
          actionType: chunk.toolCallRequest ? ActionType.ToolCall : undefined,
          toolCallRequest: chunk.toolCallRequest,
        };
        response.write(`data: ${JSON.stringify(threadMessage)}\n\n`);
      }
      if (finalComponent) {
        await this.addDecisionToThread(resolvedThreadId, finalComponent);
      }
    } catch (error: any) {
      this.logger.error('Error in hydrateComponentStream:', error);
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
