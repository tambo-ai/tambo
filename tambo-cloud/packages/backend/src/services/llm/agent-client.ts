import {
  AbstractAgent,
  EventType,
  HttpAgent,
  MessagesSnapshotEvent,
  RunFinishedEvent,
  TextMessageContentEvent,
  TextMessageStartEvent,
  ToolCallArgsEvent,
  ToolCallResultEvent,
  ToolCallStartEvent,
} from "@ag-ui/client";
import {
  Message as AGUIMessage,
  StateDeltaEvent,
  ThinkingTextMessageContentEvent,
  ToolCallEndEvent,
} from "@ag-ui/core";
import { CrewAIAgent } from "@ag-ui/crewai";
import { LlamaIndexAgent } from "@ag-ui/llamaindex";
import { MastraAgent } from "@ag-ui/mastra";
import { MastraClient } from "@mastra/client-js";
import {
  AgentProviderType,
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  MessageRole,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { EventHandlerParams, runStreamingAgent } from "./async-adapters";
import { AsyncQueue } from "./async-queue";
import { CompleteParams, LLMResponse } from "./llm-client";
import { generateMessageId } from "./message-id-generator";

export enum AgentResponseType {
  MESSAGE = "message",
  COMPLETE = "complete",
}

interface WithReasoning {
  reasoning?: string[];
  parentMessageId?: string;
}

export type AgentMessage = AGUIMessage & WithReasoning;

export interface AgentResponse {
  type: AgentResponseType;
  message: AgentMessage;
  complete?: true;
}

export class AgentClient {
  private aguiAgent: AbstractAgent | undefined;
  chainId: string;

  private constructor(chainId: string, aguiAgent: AbstractAgent) {
    this.chainId = chainId;
    this.aguiAgent = aguiAgent;
  }
  public static async create({
    agentProviderType,
    agentUrl,
    agentName, // only used for Mastra
    chainId,
    headers,
  }: {
    agentProviderType: AgentProviderType;
    agentUrl: string;
    agentName?: string | null;
    chainId: string;
    headers: Record<string, string>;
  }) {
    switch (agentProviderType) {
      case AgentProviderType.MASTRA: {
        const normalizedAgentName: string | undefined = agentName?.trim();
        if (!normalizedAgentName) {
          throw new Error("Agent name is required");
        }
        const client = new MastraClient({ baseUrl: agentUrl });
        const agents = await MastraAgent.getRemoteAgents({
          mastraClient: client,
        });
        if (!(normalizedAgentName in agents)) {
          throw new Error(`Agent ${normalizedAgentName} not found`);
        }
        const agent = agents[normalizedAgentName];
        const agentClient = new AgentClient(chainId, agent);

        return agentClient;
      }
      case AgentProviderType.CREWAI: {
        const agent = new CrewAIAgent({
          url: agentUrl,
          headers,
        });
        return new AgentClient(chainId, agent as unknown as AbstractAgent);
      }
      case AgentProviderType.LLAMAINDEX: {
        const agent = new LlamaIndexAgent({
          url: agentUrl,
          headers,
        });
        return new AgentClient(chainId, agent as unknown as AbstractAgent);
      }
      case AgentProviderType.PYDANTICAI: {
        const agent = new HttpAgent({
          url: agentUrl,
          headers,
        });
        return new AgentClient(chainId, agent);
      }
      default: {
        throw new Error(
          `Unsupported agent provider type: ${agentProviderType}`,
        );
      }
    }
  }

  async *streamRunAgent(
    queue: AsyncQueue<EventHandlerParams>,
    params: {
      messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
      tools: OpenAI.Chat.Completions.ChatCompletionTool[];
    },
  ): AsyncIterableIterator<AgentResponse> {
    if (!this.aguiAgent) {
      throw new Error("Agent not initialized");
    }

    const agentMessages = params.messages.map((m, msgIndex): AGUIMessage => {
      if (m.role === "function") {
        throw new Error("Function messages are not supported");
      }
      const toolCallId = getToolCallId(m);
      if (m.role === "tool") {
        return {
          role: m.role,
          content: convertMessagesToString(m.content),
          id: `tambo-${m.role}-${msgIndex}`,
          toolCallId: toolCallId,
        };
      }
      if (m.role === "assistant") {
        return {
          role: m.role,
          content: convertMessagesToString(m.content),
          id: `tambo-${m.role}-${msgIndex}`,
          toolCalls: m.tool_calls
            ?.map((t) => {
              if (t.type === "function") {
                return t;
              }
              console.warn(`Unexpected tool call type: ${t.type}`);
              return undefined;
            })
            .filter((t) => t !== undefined),
        };
      }
      return {
        role: m.role,
        content: convertMessagesToString(m.content),
        // TODO: probably include message id in the incoming type
        id: `tambo-${m.role}-${msgIndex}`,
      };
    });
    this.aguiAgent.setMessages(agentMessages);

    const agentTools = params.tools.map((t) => {
      if (t.type !== "function") {
        throw new Error("Only function tools are supported");
      }
      return {
        name: t.function.name,
        description: t.function.description || "",
        parameters: t.function.parameters,
      };
    });
    const generator = runStreamingAgent(this.aguiAgent, queue, [
      { tools: agentTools },
    ]);
    let currentToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall[] =
      [];
    let currentMessage: AgentMessage | undefined = undefined;
    for (;;) {
      // we are doing manual iteration of the generator so we can track the "done" state at the end
      // TODO: figure out if there's a better way to do this
      const { done, value } = await generator.next();
      if (done) {
        const _agentRunResult = value;
        // result is the final result of the agent run, but we might have actually streamed everything already?
        // TODO: figure out if there's a difference between this and the RUN_FINISHED event
        yield {
          type: AgentResponseType.COMPLETE,
          message: {
            id: "tambo-assistant-complete",
            content: "",
            role: "assistant",
          },
        };
        return;
      }
      const { event } = value;
      // here we need to yield the growing event to the caller
      switch (event.type) {
        case EventType.MESSAGES_SNAPSHOT: {
          // HACK: emit the last message from the snapshot. really we want the
          // consumer to replace all the messages they've receieved with all of
          // these, but we don't yet have a way to do that
          const e = event as MessagesSnapshotEvent;
          currentMessage = e.messages[e.messages.length - 1];
          switch (currentMessage.role) {
            case "assistant": {
              yield {
                type: AgentResponseType.MESSAGE,
                message: {
                  content: currentMessage.content,
                  role: currentMessage.role,
                  id: currentMessage.id,
                },
              };
              break;
            }
            case "tool": {
              yield {
                type: AgentResponseType.MESSAGE,
                message: currentMessage,
              };
              break;
            }
            case "developer":
            case "system":
            case "user": {
              yield {
                type: AgentResponseType.MESSAGE,
                message: currentMessage,
              };
              break;
            }
            default: {
              invalidEvent(currentMessage);
            }
          }
          break;
        }

        case EventType.RUN_STARTED: {
          // we don't support "runs" yet, but "started" may be a point to emit a message about the run
          break;
        }
        case EventType.RUN_ERROR: {
          // we don't support "runs" yet, but "error" may be a point to emit a message about the error
          break;
        }
        case EventType.RUN_FINISHED: {
          // we don't support "runs" yet, but "finished" may be a point to emit the final response
          const e = event as RunFinishedEvent;
          if (e.result) {
            currentMessage = {
              ...createNewMessage(MessageRole.Assistant, generateMessageId()),
              content:
                typeof e.result === "string"
                  ? e.result
                  : JSON.stringify(e.result),
            };
            yield {
              type: AgentResponseType.MESSAGE,
              message: currentMessage,
              complete: true,
            };
          }

          // Note at this point, any tools left in currentToolCalls are supposed
          // to be called by the client. It would be nice if there was a way to
          // emit these as well, but it is technically up to the consumer to know
          // that and to call them at the right time

          // done, no more events to emit, this ends the loop
          return;
        }
        case EventType.STATE_SNAPSHOT: {
          break;
        }
        case EventType.STATE_DELTA: {
          const _e = event as StateDeltaEvent;
          break;
        }
        case EventType.TOOL_CALL_START: {
          const e = event as ToolCallStartEvent;
          const messageId = e.parentMessageId ?? generateMessageId();

          // Start a new message if the current message is not the one that is suposed to hold the tool
          if (!currentMessage || currentMessage.id !== messageId) {
            currentMessage = createNewMessage(MessageRole.Assistant, messageId);
          }
          // Also makes sure that types resolve correctly
          if (currentMessage.role !== MessageRole.Assistant) {
            throw new Error("Current message is not an assistant message");
          }
          currentToolCalls = [
            ...currentToolCalls,
            {
              id: e.toolCallId,
              type: "function",
              function: {
                arguments: "",
                name: e.toolCallName,
              },
            },
          ];
          currentMessage = {
            ...currentMessage,
            toolCalls: currentToolCalls,
          };
          yield {
            type: AgentResponseType.MESSAGE,
            message: currentMessage,
          };
          break;
        }
        case EventType.TOOL_CALL_CHUNK:
        case EventType.TOOL_CALL_ARGS: {
          const e = event as ToolCallArgsEvent;
          const currentToolCall = currentToolCalls.find(
            (t) => t.id === e.toolCallId,
          );
          if (!currentToolCall) {
            throw new Error("No tool call found");
          }

          const updatedToolCall = {
            ...currentToolCall,
            function: {
              ...currentToolCall.function,
              arguments: currentToolCall.function.arguments + e.delta,
            },
          };
          currentToolCalls = currentToolCalls.map((t) =>
            t.id === e.toolCallId ? updatedToolCall : t,
          );
          // HACK: we need to generate a message id for the tool call
          // result, but maybe we'll actually emit this in the
          // TOOL_CALL_RESULT event?
          if (!currentMessage) {
            // should never happen, we should have a message by now
            currentMessage = createNewMessage(
              MessageRole.Assistant,
              generateMessageId(),
            );
          }
          if (currentMessage.role === MessageRole.Assistant) {
            // we replace whatever tool calls we had before with the new one,
            // because they are partial/incomplete
            currentMessage = {
              ...currentMessage,
              toolCalls: currentToolCalls,
            };
          }
          yield {
            type: AgentResponseType.MESSAGE,
            message: currentMessage,
          };
          break;
        }
        case EventType.TOOL_CALL_END: {
          const e = event as ToolCallEndEvent;
          const currentToolCall = currentToolCalls.find(
            (t) => t.id === e.toolCallId,
          );
          if (!currentToolCall) {
            throw new Error("No tool call found");
          }
          // HACK: we need to generate a message id for the tool call
          // result, but maybe we'll actually emit this in the
          // TOOL_CALL_RESULT event?
          if (!currentMessage) {
            // should never happen, we should have a message by now
            currentMessage = createNewMessage(
              MessageRole.Assistant,
              generateMessageId(),
            );
          }
          if (currentMessage.role === MessageRole.Assistant) {
            currentMessage = {
              ...currentMessage,
              toolCalls: currentToolCalls,
            };
          }
          yield {
            type: AgentResponseType.MESSAGE,
            message: currentMessage,
          };
          break;
        }
        case EventType.TOOL_CALL_RESULT: {
          const e = event as ToolCallResultEvent;
          currentToolCalls = currentToolCalls.filter(
            (t) => t.id !== e.toolCallId,
          );
          const messageId = e.messageId;
          currentMessage = {
            ...createNewMessage(MessageRole.Tool, messageId),
            content: e.content,
            role: MessageRole.Tool,
            toolCallId: e.toolCallId,
          };
          // this is going to look a lot like the TOOL_CALL_END event, but with a different message id,
          // but the content is almost certainly the same
          yield {
            type: AgentResponseType.MESSAGE,
            // Note that this is the *response* so it is a different message
            // id from the one emitted by the other TOOL_CALL_*/etc events
            message: currentMessage,
          };
          break;
        }
        case EventType.TEXT_MESSAGE_START: {
          const e = event as TextMessageStartEvent;
          currentMessage = createNewMessage(e.role as MessageRole, e.messageId);
          yield {
            type: AgentResponseType.MESSAGE,
            message: currentMessage,
          };
          break;
        }
        case EventType.TEXT_MESSAGE_CONTENT:
        case EventType.TEXT_MESSAGE_CHUNK: {
          const e = event as TextMessageContentEvent;

          if (!currentMessage) {
            throw new Error("No current message");
          }
          currentMessage = {
            // this hacky cast works around a TS type ambiguity
            ...(currentMessage as unknown as AgentMessage),
            content: currentMessage.content + e.delta,
          };
          yield {
            type: AgentResponseType.MESSAGE,
            message: currentMessage,
          };
          break;
        }
        case EventType.TEXT_MESSAGE_END: {
          // nothing to actually do here, the message should have been emitted already?
          break;
        }
        case EventType.STEP_STARTED:
        case EventType.STEP_FINISHED: {
          // We don't really support "steps" yet
          break;
        }
        case EventType.CUSTOM:
        case EventType.RAW: {
          // this is kind of out-of-band events, not sure what to do with them yet.
          break;
        }
        case EventType.THINKING_START: {
          if (!currentMessage) {
            currentMessage = createNewMessage(
              MessageRole.Assistant,
              generateMessageId(),
            );
          }
          currentMessage = {
            ...currentMessage,
            reasoning: [],
          };
          yield {
            type: AgentResponseType.MESSAGE,
            message: currentMessage,
          };
          break;
        }
        case EventType.THINKING_END: {
          break;
        }
        case EventType.THINKING_TEXT_MESSAGE_START: {
          if (!currentMessage) {
            currentMessage = createNewMessage(
              MessageRole.Assistant,
              generateMessageId(),
            );
          }
          // just start a new reasoning string on the current message
          currentMessage = {
            ...currentMessage,
            reasoning: [...(currentMessage.reasoning ?? []), ""],
          };
          yield {
            type: AgentResponseType.MESSAGE,
            message: currentMessage,
          };
          break;
        }

        case EventType.THINKING_TEXT_MESSAGE_CONTENT: {
          const e = event as ThinkingTextMessageContentEvent;
          if (!currentMessage) {
            throw new Error("No current message");
          }
          const currentReasoningString: string =
            currentMessage.reasoning?.at(-1) ?? "";
          currentMessage = {
            ...(currentMessage as unknown as AgentMessage),
            reasoning: [
              ...(currentMessage.reasoning?.slice(0, -1) ?? []),
              currentReasoningString + e.delta,
            ],
          };
          yield {
            type: AgentResponseType.MESSAGE,
            message: currentMessage,
          };
          break;
        }
        case EventType.THINKING_TEXT_MESSAGE_END: {
          break;
        }
        default: {
          invalidEvent(event.type);
        }
      }
    }
  }

  async nonStreamingComplete(_params: CompleteParams): Promise<LLMResponse> {
    if (!this.aguiAgent) {
      throw new Error("Agent not initialized");
    }
    throw new Error("Method not implemented.");
  }
}

function invalidEvent(eventType: never) {
  console.error(`Invalid event type: ${eventType}`);
}

/** Hacky conversion of messages to string */
function convertMessagesToString(
  messages:
    | (
        | ChatCompletionContentPart
        | OpenAI.Chat.Completions.ChatCompletionContentPartRefusal
      )[]
    | null
    | undefined
    | string,
): string {
  if (!messages) {
    return "";
  }
  if (typeof messages === "string") {
    return messages;
  }
  return messages
    .filter((m) => m.type === "text")
    .map((m) => m.text)
    .join("\n");
}

/** Hacky tool id retrieval - types seem to imply that toolCallId can't be undefined */
function getToolCallId(m: ChatCompletionMessageParam): string {
  if (m.role === "assistant") {
    // HACK: grab the first tool call id
    return m.tool_calls?.find((t) => t.id)?.id ?? "";
  }
  if (m.role === "tool") {
    return m.tool_call_id;
  }
  return "";
}

function createNewMessage(
  role: "system" | "user" | "assistant" | "tool" | "developer" | "hydra",
  id: string,
): AgentMessage {
  if (role === MessageRole.Hydra) {
    role = MessageRole.Assistant;
  }
  if (role === MessageRole.Tool) {
    return {
      id: id,
      role: role,
      content: "",
      toolCallId: "",
    };
  }
  return {
    id: id,
    role: role,
    content: "",
  };
}
