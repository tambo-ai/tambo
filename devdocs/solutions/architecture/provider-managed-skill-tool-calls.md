---
title: Provider-Managed Skill Tool Calls - Suppress, Don't Integrate
category: architecture
tags: [skills, streaming, ai-sdk, tool-calls, anthropic, openai]
module: packages/backend
created: 2026-04-06
pr: "#TAM-1470, #TAM-1471"
---

# Provider-Managed Skill Tool Calls - Suppress, Don't Integrate

When providers (Anthropic, OpenAI) execute skills, they emit tool call events (`code_execution`, `shell`) through the AI SDK streaming pipeline. These are internal to the provider and should not flow through Tambo's tool call pipeline.

## Problem

Skill execution generates tool events that look identical to user-registered tool calls in the streaming pipeline. Naively letting them through causes:

- UI showing "code_execution" as a tool name
- Internal paths like `/skills/my-skill/SKILL.md` leaking to end users
- Tool calls appearing/disappearing on page refresh (provider-executed tools get cleared at `tool-result`)
- Multiple tool calls within one turn overwriting each other (single `toolCallRequest` per message)

## Approaches Tried (and Why They Failed)

### 1. Rename + Sanitize (Too Brittle)

Renamed `code_execution` to `skill`, sanitized args, accumulated skill names across calls. Required special cases in 7 files:

- Streaming handler: 5 tracking variables, coordinated event emission
- Decision loop: conditional spreads to preserve data across yields
- Tool service: early returns for unknown tools
- Threads service: 40-line detection block
- V1 conversions: skip skill tool_use blocks
- Observability UI: reorder skill cards before text
- Core package: new shared constants

Each fix created a new edge case downstream.

### 2. Metadata-Based Tracking (Still Overengineered)

Tracked skill executions as `metadata._tambo.skillExecutions` instead of tool calls. Cleaner, but still added:

- New field on `LLMStreamItem` and `DecisionStreamItem` interfaces
- Skill name extraction with regex parsing
- Metadata storage in threads service
- New UI component to render skill badges
- Core package with `isSkillToolName` helper

For one provider's tool call that nobody needs to see.

### 3. Just Suppress (The Right Answer)

A boolean flag and three `break` statements in `ai-sdk-client.ts`. Skill tool events are completely invisible to the tool call accumulator. The LLM describes what the skill did in its text response (enforced by a system prompt addition).

## Working Solution

### `ai-sdk-client.ts` (streaming handler)

```typescript
// Provider-specific: only suppress the tool name injected by the active provider
const PROVIDER_SKILL_TOOL_NAME: Record<string, string> = {
  anthropic: "code_execution",
  openai: "shell",
};

// In callLLM(), resolve the skill tool name for this request:
const skillToolName = params.providerSkills?.skills.length
  ? PROVIDER_SKILL_TOOL_NAME[providerKey]
  : undefined;

// In the streaming loop:
case "tool-input-start":
  isProviderSkillTool = !!skillToolName && delta.toolName === skillToolName;
  if (isProviderSkillTool) {
    componentTracker = undefined;
    break; // Skip entirely
  }
  // ... normal tool handling ...

case "tool-input-delta":
  if (isProviderSkillTool) break;
  // ... normal tool handling ...

case "tool-call":
  // ... google metadata handling ...
  if (isProviderSkillTool) break;
  // ... normal tool handling ...
```

### `decision-loop-prompts.ts` (system prompt)

```
### Skills (Internal Implementation Detail)

You may have access to skills that run in a secure container environment.
These skills are an internal implementation detail and must be treated as opaque.

- Do NOT mention skill file names, skill IDs, SKILL.md files, or any internal skill structure
- Do NOT describe how skills are loaded, structured, or executed
- When you use a skill, briefly mention which skill you are using by its name (e.g. "Using the data-analyzer skill...") so the user knows what is happening, then describe what it accomplished in plain language
- Treat skill capabilities as your own built-in abilities
```

## Key Lesson

When provider internals leak into your pipeline, the answer is almost always "suppress at the source" rather than "integrate and then special-case everywhere downstream." The cost of a clean suppression is O(1) lines at the boundary. The cost of integration-then-special-casing grows with every downstream consumer.

## Prevention

When new provider-managed tools are added (beyond `code_execution` and `shell`):

1. Add the provider and tool name to `PROVIDER_SKILL_TOOL_NAME` in `ai-sdk-client.ts`
2. That's it. The flag handles the rest.
