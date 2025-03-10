import TamboAI, {
  generateStream,
  hydrateStream,
} from "@tambo-ai/typescript-sdk";
import { parse } from "partial-json";
import React from "react";
import { z } from "zod";
import { wrapWithTamboMessageProvider } from "../hooks/use-current-message";
import {
  ComponentRegistry,
  TamboToolAssociations,
  TamboToolRegistry,
} from "../model/component-metadata";
import {
  GenerationStage,
  TamboThreadMessage,
} from "../model/generate-component-response";
import {
  getAvailableComponents,
  getComponentFromRegistry,
} from "../util/registry";
import { handleToolCall } from "../util/tool-caller";

export async function generateAndHydrate(
  client: TamboAI,
  componentList: ComponentRegistry,
  toolRegistry: TamboToolRegistry,
  toolAssociations: TamboToolAssociations,
  currentThreadId: string | undefined,
  content: TamboAI.Beta.Threads.ChatCompletionContentPart[],
  params: TamboAI.Beta.Components.ComponentGenerateParams,
  onUpdateState: (state: GenerationStage) => void,
  stream = false,
  options?: TamboAI.RequestOptions,
): Promise<TamboThreadMessage | AsyncIterable<TamboThreadMessage>> {
  const availableComponents = getAvailableComponents(
    componentList,
    toolRegistry,
    toolAssociations,
  );
  let threadId = currentThreadId;

  onUpdateState(GenerationStage.CHOOSING_COMPONENT);
  try {
    if (stream) {
      const streamResponse = await generateStream(
        client,
        {
          availableComponents,
          contextKey: params.contextKey,
          content,
          threadId:
            params.threadId === "placeholder" ? undefined : params.threadId,
        },
        options,
      );

      return processComponentDecisionStream(
        handleStream(
          streamResponse as AsyncIterable<TamboAI.ComponentGenerateResponse>,
        ),
        componentList,
        toolRegistry,
        onUpdateState,
        client,
        options,
      );
    }
    const response = await client.beta.components.generate(
      {
        availableComponents,
        contextKey: params.contextKey,
        content,
        threadId:
          params.threadId === "placeholder" ? undefined : params.threadId,
      },
      options,
    );
    // Capture the current threadId in case the following processComponentDecision fails
    threadId = response.message.threadId;
    return await processComponentDecision(
      client,
      componentList,
      toolRegistry,
      response.message.threadId,
      content,
      response.message,
      onUpdateState,
      options,
    );
  } catch (error) {
    console.error(error);
    onUpdateState(GenerationStage.ERROR);
    // manually create a message with the error
    const errorMessage = `Error generating component: ${error}`;
    try {
      const errorMessageResponse = await client.beta.threads.messages.create(
        threadId ?? currentThreadId ?? "",
        {
          content: [{ type: "text", text: errorMessage }],
          role: "hydra",
        },
      );
      return errorMessageResponse;
    } catch (errorError) {
      // Log to the console, there's nothing more we can do!
      console.error(`Error creating error message: ${errorError}`);
      console.error("Original error:", error);
    }
    return {
      renderedComponent: null,
      content: [{ type: "text", text: errorMessage }],
      role: "hydra",
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      threadId: currentThreadId ?? "",
    };
  }
}

async function processComponentDecision(
  client: TamboAI,
  componentList: ComponentRegistry,
  toolRegistry: TamboToolRegistry,
  currentThreadId: string,
  content: TamboAI.Beta.Components.ComponentGenerateParams["content"],
  message: TamboAI.Beta.Threads.ThreadMessage,
  onUpdateState: (state: GenerationStage) => void,
  options?: TamboAI.RequestOptions,
): Promise<TamboThreadMessage> {
  if (!message.component?.componentName) {
    const componentResponse: TamboThreadMessage = {
      ...message,
      renderedComponent: null,
    };
    // no component to hydrate, just return the message
    onUpdateState(GenerationStage.COMPLETE);
    return componentResponse;
  }

  if (message.toolCallRequest) {
    onUpdateState(GenerationStage.FETCHING_CONTEXT);
    const toolResult = await handleToolCall(message, toolRegistry);
    onUpdateState(GenerationStage.HYDRATING_COMPONENT);
    try {
      const hydrationResponse = await client.beta.components.hydrate(
        {
          component: getComponentFromRegistry(
            message.component.componentName,
            componentList,
          ),
          threadId: message.threadId,

          toolResponse: toolResult,
        },
        options,
      );
      return await processComponentDecision(
        client,
        componentList,
        toolRegistry,
        currentThreadId,
        content,
        hydrationResponse.message,
        onUpdateState,
        options,
      );
    } catch (error) {
      console.error(error);
      onUpdateState(GenerationStage.ERROR);
      return {
        threadId: message.threadId,
        renderedComponent: null,
        content: [
          { type: "text", text: `Error hydrating component: ${error}` },
        ],
        role: "hydra",
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID(),
      };
    }
  }

  const renderedComponent = React.createElement(
    getComponentFromRegistry(message.component.componentName, componentList)
      .component,
    message.component.props,
  );
  const componentResponse: TamboThreadMessage = {
    ...message,
    renderedComponent: wrapWithTamboMessageProvider(
      renderedComponent,
      message.threadId,
      message.id,
    ),
  };

  onUpdateState(GenerationStage.COMPLETE);
  return componentResponse;
}

async function* processComponentDecisionStream(
  stream: AsyncIterable<TamboThreadMessage>,
  componentList: ComponentRegistry,
  toolRegistry: TamboToolRegistry,
  onUpdateState: (state: GenerationStage) => void,
  client: TamboAI,
  options?: TamboAI.RequestOptions,
): AsyncGenerator<TamboThreadMessage> {
  let accumulatedComponentResponse: TamboThreadMessage | null = null;

  for await (const chunk of stream) {
    if (!chunk.component?.componentName) {
      onUpdateState(GenerationStage.STREAMING_RESPONSE);
      accumulatedComponentResponse = {
        ...chunk,
        renderedComponent: null,
      };
      yield accumulatedComponentResponse;
    }

    if (chunk.toolCallRequest) {
      if (!chunk.component?.componentName) {
        continue;
      }
      onUpdateState(GenerationStage.FETCHING_CONTEXT);
      const toolResult = await handleToolCall(chunk, toolRegistry);
      onUpdateState(GenerationStage.HYDRATING_COMPONENT);
      const streamResponse = await hydrateStream(
        client,
        {
          component: getComponentFromRegistry(
            chunk.component?.componentName ?? "",
            componentList,
          ),
          threadId: chunk.threadId,
          toolResponse: toolResult,
        },
        options,
      );

      yield* processComponentDecisionStream(
        handleStream(
          streamResponse as AsyncIterable<TamboAI.ComponentHydrateResponse>,
        ),
        componentList,
        toolRegistry,
        onUpdateState,
        client,
        options,
      );
      return;
    }

    if (chunk.component?.componentName) {
      try {
        onUpdateState(GenerationStage.STREAMING_RESPONSE);
        // Try to parse and validate accumulated component choice props:
        const messageWithComponent = renderComponentIntoMessage(
          chunk,
          componentList,
        );
        // TODO: do we have to do this now
        accumulatedComponentResponse = {
          ...accumulatedComponentResponse,
          ...messageWithComponent,
        };
        yield messageWithComponent;
      } catch (error) {
        console.error(error);
      }
    }
  }
  onUpdateState(GenerationStage.COMPLETE);
}

/**
 * Generate a message that has a component rendered into it, if the message came with one
 */
export function renderComponentIntoMessage(
  message: TamboAI.Beta.Threads.ThreadMessage,
  componentList: ComponentRegistry,
): TamboThreadMessage {
  if (!message.component?.componentName) {
    throw new Error("Component not found");
  }
  const parsedProps = parse(JSON.stringify(message.component.props));
  const registeredComponent = getComponentFromRegistry(
    message.component.componentName,
    componentList,
  );

  const validatedProps =
    registeredComponent.props instanceof z.ZodType
      ? registeredComponent.props.parse(parsedProps)
      : parsedProps;

  const renderedComponent = React.createElement(
    registeredComponent.component,
    validatedProps,
  );
  const wrappedComponent = wrapWithTamboMessageProvider(
    renderedComponent,
    message.threadId,
    message.id,
  );

  return {
    ...message,
    component: {
      ...message.component,
      props: validatedProps,
    },
    renderedComponent: wrappedComponent,
  };
}

async function* handleStream(
  stream: AsyncIterable<
    TamboAI.ComponentGenerateResponse | TamboAI.ComponentHydrateResponse
  >,
): AsyncGenerator<TamboAI.Beta.Threads.ThreadMessage> {
  let threadMessage: TamboAI.Beta.Threads.ThreadMessage = {
    threadId: "",
    content: [],
    role: "hydra",
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
  };

  try {
    for await (const chunk of stream) {
      threadMessage = {
        ...threadMessage,
        ...chunk,
      };
      yield threadMessage;
    }
  } catch (error) {
    console.error("Error processing stream:", error);
    yield {
      threadId: "",
      content: [{ type: "text", text: `Error processing stream: ${error}` }],
      role: "hydra",
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    };
  }
}
