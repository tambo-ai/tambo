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
  AsyncQueue,
  ChatCompletionContentPart,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import OpenAI from "openai";
import { aguiContentToString } from "../agui/content-to-string";
import { EventHandlerParams, runStreamingAgent } from "./async-adapters";
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

type NonActivityMessage = Exclude<AGUIMessage, { role: "activity" }>;

export type AgentMessage = NonActivityMessage & WithReasoning;

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
      messages: ThreadMessage[];
      tools: OpenAI.Chat.Completions.ChatCompletionTool[];
    },
  ): AsyncIterableIterator<AgentResponse> {
    if (!this.aguiAgent) {
      throw new Error("Agent not initialized");
    }

    const agentMessages = params.messages.map((m): AGUIMessage => {
      if (m.role === MessageRole.Tool) {
        return {
          role: "tool" as const,
          content: convertContentPartsToString(m.content),
          id: m.id,
          toolCallId: m.tool_call_id ?? "",
        };
      }
      if (m.role === MessageRole.Assistant) {
        if (m.toolCallRequest && !m.tool_call_id) {
          throw new Error(
            "Assistant message has toolCallRequest but no tool_call_id",
          );
        }
        const toolCalls = m.toolCallRequest
          ? [convertToolCallRequestToAGUI(m.toolCallRequest, m.tool_call_id)]
          : undefined;
        return {
          role: "assistant" as const,
          content: convertContentPartsToString(m.content),
          id: m.id,
          toolCalls,
        };
      }
      return {
        role: m.role,
        content: convertContentPartsToString(m.content),
        id: m.id,
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
          const lastMessage = getLastMessage(e.messages);
          if (!lastMessage) {
            break;
          }

          currentMessage = lastMessage;
          switch (currentMessage.role) {
            case "assistant": {
              yield {
                type: AgentResponseType.MESSAGE,
                message: {
                  content: aguiContentToString(currentMessage.content),
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
            const finishedMessage: AgentMessage = {
              ...createNewMessage("assistant", generateMessageId()),
              content:
                typeof e.result === "string"
                  ? e.result
                  : JSON.stringify(e.result),
            };

            currentMessage = finishedMessage;
            yield {
              type: AgentResponseType.MESSAGE,
              message: finishedMessage,
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
            currentMessage = createNewMessage("assistant", messageId);
          }
          // Also makes sure that types resolve correctly
          if (currentMessage.role !== "assistant") {
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
            currentMessage = createNewMessage("assistant", generateMessageId());
          }
          if (currentMessage.role === "assistant") {
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
            currentMessage = createNewMessage("assistant", generateMessageId());
          }
          if (currentMessage.role === "assistant") {
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
            ...createNewMessage("tool", messageId),
            content: e.content,
            role: "tool",
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
          currentMessage = createNewMessage(e.role, e.messageId);
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

          const currentContent = aguiContentToString(currentMessage.content);
          const updatedMessage: AgentMessage = {
            ...(currentMessage as unknown as AgentMessage),
            content: currentContent + e.delta,
          };
          currentMessage = updatedMessage;
          yield {
            type: AgentResponseType.MESSAGE,
            message: updatedMessage,
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
            currentMessage = createNewMessage("assistant", generateMessageId());
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
            currentMessage = createNewMessage("assistant", generateMessageId());
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
        case EventType.ACTIVITY_SNAPSHOT:
        case EventType.ACTIVITY_DELTA: {
          // We don't support activity events yet
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

function getLastMessage(messages: AGUIMessage[]): NonActivityMessage | null {
  // Filter out activity messages and get the last non-activity message
  const nonActivityMessages = messages.filter(
    (m): m is NonActivityMessage => m.role !== "activity",
  );
  return nonActivityMessages.length > 0
    ? nonActivityMessages[nonActivityMessages.length - 1]
    : null;
}

/** Convert ChatCompletionContentPart[] to string for AGUI messages */
function convertContentPartsToString(
  content: ChatCompletionContentPart[],
): string {
  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

/**
 * Convert ToolCallRequest to AGUI-compatible tool call format.
 * Drops parameters with undefined values and sorts keys for
 * deterministic JSON argument strings.
 */
function convertToolCallRequestToAGUI(
  toolCallRequest: ToolCallRequest,
  toolCallId: string | undefined,
): OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall {
  const parameters: Record<string, unknown> = {};
  for (const { parameterName, parameterValue } of toolCallRequest.parameters) {
    if (parameterValue === undefined) {
      continue;
    }
    parameters[parameterName] = parameterValue;
  }
  const orderedParameters = Object.fromEntries(
    Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)),
  );
  return {
    id: toolCallId ?? "",
    type: "function",
    function: {
      name: toolCallRequest.toolName,
      arguments: JSON.stringify(orderedParameters),
    },
  };
}

function createNewMessage(
  role: NonActivityMessage["role"],
  id: string,
): AgentMessage {
  if (role === "tool") {
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
