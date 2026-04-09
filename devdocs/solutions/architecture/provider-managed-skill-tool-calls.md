---
title: Provider-Managed Skill Tool Calls - Normalize and Emit
category: architecture
tags: [skills, streaming, ai-sdk, tool-calls, anthropic, openai]
module: packages/backend
created: 2026-04-06
updated: 2026-04-09
pr: "#TAM-1470, #TAM-1471, #TAM-1486"
---

# Provider-Managed Skill Tool Calls - Normalize and Emit

When providers (Anthropic, OpenAI) execute skills, they emit tool call events (`code_execution`, `shell`) through the AI SDK streaming pipeline. These events are normalized to `load_skill` and emitted as standard AG-UI tool call events for observability, while being filtered out of conversations sent back to the LLM.

## History

### Original approach: Suppress (TAM-1470, TAM-1471)

The original implementation completely suppressed skill tool events at the streaming boundary. This was the right call at the time — the requirement was to prevent internal provider details from leaking to the client, and suppression accomplished that with a boolean flag and three `break` statements.

### Why it changed: Observability (TAM-1486)

Suppression meant zero visibility into skill usage. Developers had no way to know through observability whether a skill was loaded, making debugging skill updates difficult. The new requirement: capture skill tool usage for each provider.

## Current Approach: Normalize and Emit

### Overview

1. Provider skill tool events (`code_execution`, `shell`) are detected in the streaming handler
2. The tool name is normalized to `load_skill`
3. Standard AG-UI events (`TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END`) are emitted during streaming
4. Completed skill calls are captured as `ProviderSkillCall` objects on the stream item
5. Post-stream, skill call messages are persisted to the DB with `metadata._tambo.providerSkill = true`
6. A `TOOL_CALL_RESULT` AG-UI event is emitted after persistence
7. When building the conversation for the next LLM call, skill messages are filtered out

### Detection

```typescript
const PROVIDER_SKILL_TOOL_NAME: Record<string, string> = {
  anthropic: "code_execution",
  openai: "shell",
};

// In the streaming loop:
isProviderSkillTool = !!skillToolName && delta.toolName === skillToolName;
```

A user tool that happens to share a name with a provider's skill tool (e.g. user tool "shell" on Anthropic) is not affected — only the matching provider's skill tool name is normalized.

### `ai-sdk-client.ts` (streaming handler)

Instead of suppressing, the handler:

- Emits `TOOL_CALL_START` with `toolCallName: "load_skill"` (normalized)
- Accumulates args via `TOOL_CALL_ARGS` events
- Emits `TOOL_CALL_END` on `tool-call`
- At `tool-result`, captures a `ProviderSkillCall` with the tool call ID, raw args, and result
- Yields `completedProviderSkillCalls` on the `LLMStreamItem`

Text stitching (reusing `textMessageId` across skill boundaries with `"\n\n"` separator) is preserved.

### `threads.service.ts` (persistence)

Skill calls are accumulated during streaming and persisted post-stream to avoid blocking the hot path with DB writes. For each completed skill call:

1. An assistant message is saved with `toolCallRequest` and `metadata._tambo.providerSkill = true`
2. A tool response message is saved with the result and the same metadata
3. A `TOOL_CALL_RESULT` AG-UI event is emitted with the persisted message ID

### `thread-to-model-message-conversion.ts` (filtering)

Messages with `metadata._tambo.providerSkill === true` are skipped when building the conversation for the next LLM call. This prevents skill tool call/response pairs from polluting the LLM context.

## Key Design Decisions

1. **Normalize tool name**: `"shell"` / `"code_execution"` -> `"load_skill"` so clients see a consistent tool name regardless of provider.

2. **Separate accumulator**: Skill calls use `accumulatedSkillCall` instead of `accumulatedToolCall` to keep the main tool call pipeline clean. The two never interact.

3. **Post-stream persistence**: DB writes happen after the streaming loop, not during it. This avoids injecting latency into the real-time stream.

4. **Metadata-based filtering**: `metadata._tambo.providerSkill = true` is used to identify skill messages for filtering. This is checked by `isProviderSkillMessage()` in `llm-client.ts`.

## Adding New Providers

When a new provider adds skill support with a different tool name:

1. Add the provider and tool name to `PROVIDER_SKILL_TOOL_NAME` in `ai-sdk-client.ts`
2. The normalization, emission, and persistence all apply automatically
