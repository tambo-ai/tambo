# TAM-1486: Capture Skill Usage for Each Provider

## Enhancement Summary

**Deepened on:** 2026-04-09
**Agents used:** architecture-strategist, performance-oracle, type-design-analyzer

### Key Improvements from Review

1. Resolved plan contradiction: TOOL_CALL_RESULT emitted only from threads.service.ts (not ai-sdk-client.ts)
2. DB writes moved to post-stream batch to avoid blocking the streaming hot path
3. ProviderSkillCall type tightened: literal `"load_skill"` type, readonly fields, fail-fast on missing ID
4. Eliminated double-write (appendNewMessageToThread + updateMessage) in favor of single addMessage
5. Added `isProviderSkillMessage` type guard for DRY metadata filtering

## Summary

When a provider-managed skill tool fires during streaming (`shell` for OpenAI, `code_execution` for Anthropic), normalize it to `load_skill`, emit standard AG-UI tool call events + `TOOL_CALL_RESULT`, store as messages in the DB, and filter them out of conversations sent to the LLM.

## Requirements

1. **Normalize tool name**: `"shell"` / `"code_execution"` -> `"load_skill"` (only when tool name matches `PROVIDER_SKILL_TOOL_NAME` and skills are configured)
2. **Emit AG-UI events**: `TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END`, `TOOL_CALL_RESULT` -- identical to how a server-side (system) tool call looks to the client
3. **Store in DB**: assistant message with `toolCallRequest` + tool response message with provider result verbatim. Both get `metadata: { _tambo: { providerSkill: true } }`
4. **Store raw args**: no skill name extraction yet -- pass through whatever the provider sends
5. **Filter from LLM conversation**: when building messages for the next LLM run, skip messages where `metadata._tambo.providerSkill === true`
6. **Separate pairs**: each skill tool call gets its own `load_skill` tool call + response pair
7. **V1 API**: let `load_skill` tool_use blocks through (no special filtering)

## Architecture

### How system tool calls work today

From the client's perspective, system (MCP) tool calls look like server-handled tool calls. The implementation:

1. The LLM generates text, then stops to make a tool call
2. During streaming, AG-UI events (`TOOL_CALL_START/ARGS/END`) flow to the client, but `toolCallRequest` is stripped from the message DTO
3. The stream ends; post-stream branching detects the system tool call
4. The tool is executed server-side, a tool response message is created, and `advanceThread` recurses
5. A new decision loop starts, streaming more chunks to the same `AsyncQueue`
6. The client sees one continuous stream

### How provider skill tools differ

1. The LLM generates text, the provider loads a skill (emitting `shell`/`code_execution` tool events), returns a result, and the LLM continues generating text -- all within **one** LLM stream
2. There is no recursive `advanceThread` -- the provider handles execution internally
3. The tool call + result happen **mid-stream**, not at stream end
4. After `tool-result`, the `accumulatedToolCall` state is cleared, so `finalThreadMessage.toolCallRequest` will be `undefined` when the stream ends
5. The post-stream branching won't see the skill tool call

### Key design decision: carry completed skill calls on stream items

Because skill tool calls happen mid-stream and get cleared before the stream ends, we carry completed skill calls on a separate field:

```typescript
/** A completed provider-managed skill tool invocation. */
interface ProviderSkillCall {
  readonly toolCallId: string;
  readonly toolName: "load_skill";
  /** Raw JSON arguments string as accumulated from the provider's tool-input-delta events. */
  readonly args: string;
  /**
   * The provider's tool execution result. Shape varies by provider:
   * OpenAI shell returns a string; Anthropic code_execution returns
   * a structured object.
   */
  readonly result: unknown;
}
```

Added to both `LLMStreamItem` and `DecisionStreamItem` as `completedProviderSkillCalls?: ProviderSkillCall[]`.

This field is populated once per skill call, on the `tool-result` delta. AG-UI events (`TOOL_CALL_START/ARGS/END`) flow via `aguiEvents` during the stream. `TOOL_CALL_RESULT` is emitted by `threads.service.ts` after the DB write (not from `ai-sdk-client.ts`), so the messageId matches the persisted tool response message.

### Research Insights

**Layer separation**: `TOOL_CALL_RESULT` must be emitted from `threads.service.ts` (not `ai-sdk-client.ts`) because the event requires a `messageId` that matches the persisted tool response message. Emitting from the LLM layer would require pre-generating message IDs and a new `addMessageWithId` DB operation, coupling the LLM layer to DB identity concerns.

**Immutability**: Do not mutate `streamItem.aguiEvents` when adding `TOOL_CALL_RESULT`. Create a new array: `const eventsWithResult = [...streamItem.aguiEvents, resultEvent]`.

**Architectural reversal**: The existing architecture doc (`provider-managed-skill-tool-calls.md`) explicitly documents suppression as the "right answer." The update should frame this as a deliberate reversal based on new observability requirements, not a refutation of the original reasoning.

## Implementation Steps

### Step 1: Types

**File**: `packages/backend/src/services/llm/llm-client.ts`

Add `ProviderSkillCall` interface (readonly fields, literal `"load_skill"` type). Add `completedProviderSkillCalls?: ProviderSkillCall[]` to `LLMStreamItem`.

**File**: `packages/backend/src/services/decision-loop/decision-loop-service.ts`

Add `completedProviderSkillCalls?: ProviderSkillCall[]` to `DecisionStreamItem`.

**File**: `packages/core/src/` (or `packages/backend/src/util/`)

Add `isProviderSkillMessage` type guard:

```typescript
function isProviderSkillMessage(msg: {
  metadata?: Record<string, unknown>;
}): boolean {
  const tambo = msg.metadata?._tambo;
  return (
    typeof tambo === "object" &&
    tambo !== null &&
    (tambo as Record<string, unknown>).providerSkill === true
  );
}
```

### Step 2: `ai-sdk-client.ts` -- Emit events + accumulate skill calls

**File**: `packages/backend/src/services/llm/ai-sdk-client.ts`

Add a skill call accumulator alongside the existing `accumulatedToolCall`:

```typescript
const accumulatedSkillCall: { id?: string; arguments: string } = {
  arguments: "",
};
const completedSkillCalls: ProviderSkillCall[] = [];
```

**`tool-input-start` (~line 625)**:

- Still set `isProviderSkillTool` flag via `!!skillToolName && delta.toolName === skillToolName`
- When true:
  - Set `accumulatedSkillCall.id = delta.id`, reset `accumulatedSkillCall.arguments = ""`
  - Emit `TOOL_CALL_START` with `toolCallName: "load_skill"`, `toolCallId: delta.id`, `parentMessageId: textMessageId`
  - Do NOT touch `accumulatedToolCall` (keep the main pipeline clean)
  - Do NOT create a `ComponentStreamTracker`

**`tool-input-delta` (~line 674)**:

- When `isProviderSkillTool`:
  - `accumulatedSkillCall.arguments += delta.delta`
  - Emit `TOOL_CALL_ARGS` with `toolCallId: delta.id`, `delta: delta.delta`

**`tool-call` (~line 695)**:

- When `isProviderSkillTool`:
  - `accumulatedSkillCall.id = delta.toolCallId` (may differ from input-start id)
  - Emit `TOOL_CALL_END` with `toolCallId: delta.toolCallId`

**`tool-result` (~line 722)**:

- When `providerExecuted`:
  - **Fail fast** if ID is missing:
    ```typescript
    if (!accumulatedSkillCall.id) {
      throw new Error(
        "Provider skill tool-result received without a tool call ID",
      );
    }
    ```
  - Push to `completedSkillCalls`:
    ```typescript
    completedSkillCalls.push({
      toolCallId: accumulatedSkillCall.id,
      toolName: "load_skill",
      args: accumulatedSkillCall.arguments,
      result: delta.result,
    });
    ```
  - Do NOT emit `TOOL_CALL_RESULT` here (emitted by threads.service.ts after DB write)
  - Reset `accumulatedSkillCall`
  - Reset `isProviderSkillTool = false`

**Yield** (bottom of loop): include `completedProviderSkillCalls` when non-empty, then clear:

```typescript
yield {
  llmResponse: { ... },
  aguiEvents,
  toolCallProviderOptionsById,
  ...(completedSkillCalls.length > 0 && {
    completedProviderSkillCalls: completedSkillCalls.splice(0),
  }),
};
```

**Text stitching**: Keep the existing logic. The `wasProviderSkillTool` check at `text-start` (line ~559) still triggers, reusing `textMessageId` and prepending `"\n\n"`. The main assistant text message remains continuous.

### Step 3: `decision-loop-service.ts` -- Pass through

**File**: `packages/backend/src/services/decision-loop/decision-loop-service.ts`

In the `for await` loop (~line 215), pass `completedProviderSkillCalls` through:

```typescript
yield {
  decision: accumulatedDecision,
  aguiEvents: streamItem.aguiEvents,
  toolCallProviderOptionsById: streamItem.toolCallProviderOptionsById,
  completedProviderSkillCalls: streamItem.completedProviderSkillCalls,
};
```

No changes to `buildToolCallRequest` -- skill calls don't flow through `accumulatedToolCall` / `tool_calls`, so it never sees `"load_skill"`.

### Step 4: `threads.service.ts` -- Accumulate during streaming, persist post-stream

**File**: `apps/api/src/threads/threads.service.ts`

#### During streaming: accumulate skill calls

In the streaming loop (lines 1795-1941), collect completed skill calls into a list (DO NOT write to DB here -- avoid blocking the stream):

```typescript
const allCompletedSkillCalls: ProviderSkillCall[] = [];

// Inside the for-await loop, before the queue push:
if (streamItem.completedProviderSkillCalls?.length) {
  allCompletedSkillCalls.push(...streamItem.completedProviderSkillCalls);
}
```

AG-UI events (`TOOL_CALL_START/ARGS/END`) already flow to the client via `streamItem.aguiEvents` on the queue push.

#### Post-stream: persist + emit TOOL_CALL_RESULT

After the streaming loop completes and before `finishInProgressMessage` (~line 1998), persist all accumulated skill calls and emit result events:

```typescript
const skillResultEvents: BaseEvent[] = [];

for (const skillCall of allCompletedSkillCalls) {
  const providerSkillMetadata = { _tambo: { providerSkill: true } };

  // Save assistant message with tool call (single insert, no double-write)
  const skillAssistantMsg = await addMessage(db, {
    threadId,
    parentMessageId: currentThreadMessage?.id ?? userMessage.id,
    role: MessageRole.Assistant,
    content: [],
    toolCallRequest: {
      toolName: skillCall.toolName,
      parameters: jsonArgsToParameters(skillCall.args),
    },
    tool_call_id: skillCall.toolCallId,
    actionType: ActionType.ToolCall,
    metadata: providerSkillMetadata,
  });

  // Save tool response message (single insert)
  const toolResponseMsg = await addMessage(db, {
    threadId,
    parentMessageId: skillAssistantMsg.id,
    role: MessageRole.Tool,
    content: [
      {
        type: ContentPartType.Text,
        text:
          typeof skillCall.result === "string"
            ? skillCall.result
            : JSON.stringify(skillCall.result),
      },
    ],
    tool_call_id: skillCall.toolCallId,
    actionType: ActionType.ToolResponse,
    metadata: providerSkillMetadata,
  });

  // Collect TOOL_CALL_RESULT events (emitted to client after DB write)
  skillResultEvents.push({
    type: EventType.TOOL_CALL_RESULT,
    toolCallId: skillCall.toolCallId,
    messageId: toolResponseMsg.id,
    content:
      typeof skillCall.result === "string"
        ? skillCall.result
        : JSON.stringify(skillCall.result),
    timestamp: Date.now(),
  });
}

// Emit all TOOL_CALL_RESULT events in one queue push
if (skillResultEvents.length > 0) {
  queue.push({ aguiEvents: skillResultEvents });
}
```

#### Helper: `jsonArgsToParameters`

The plan references `tryParseJsonToParameters` which doesn't exist. Add a utility:

```typescript
function jsonArgsToParameters(json: string): ToolCallRequest["parameters"] {
  try {
    const parsed: Record<string, unknown> = JSON.parse(json);
    return Object.entries(parsed).map(([parameterName, parameterValue]) => ({
      parameterName,
      parameterValue,
    }));
  } catch {
    // If args aren't valid JSON, store as a single parameter
    return [{ parameterName: "raw", parameterValue: json }];
  }
}
```

### Research Insights: Performance

**Why post-stream persistence**: Mid-stream DB writes (`appendNewMessageToThread` + `updateMessage`) would add ~30-90ms of blocking latency per skill call (3 sequential awaited operations: verify consistency + INSERT + UPDATE thread timestamp). This creates visible stream stalls for the client. Moving persistence to post-stream eliminates this.

**Why single addMessage**: The plan originally called for `appendNewMessageToThread` (INSERT in transaction with consistency check) followed by `updateMessage` (another UPDATE). That's 6 SQL statements for what should be 3. The `appendNewMessageToThread` consistency check is unnecessary for side-band skill messages that don't need to maintain the main message chain ordering invariant.

**Edge case -- large results**: Provider skill results (code execution output) can be arbitrarily large. Consider logging a warning for results exceeding ~64KB. Not a V1 blocker but worth monitoring.

### Step 5: `thread-to-model-message-conversion.ts` -- Filter skill messages

**File**: `packages/backend/src/util/thread-to-model-message-conversion.ts`

In `threadMessagesToModelMessages` (~line 89), integrate the filter into the existing loop rather than adding a separate `.filter()` pass:

```typescript
for (let i = 0; i < messages.length; i++) {
  const message = messages[i];
  if (isProviderSkillMessage(message)) continue;
  // ... existing switch on message.role
}
```

Use the `isProviderSkillMessage` type guard from Step 1.

### Step 6: Tests

**`packages/backend/src/services/llm/ai-sdk-client.test.ts`**:

- Rewrite "suppresses skill tool calls" -> "emits load_skill TOOL_CALL events for skill tools"
  - Assert `TOOL_CALL_START` has `toolCallName: "load_skill"`
  - Assert `TOOL_CALL_ARGS` events contain the arg deltas
  - Assert `TOOL_CALL_END` fires
  - Assert `completedProviderSkillCalls` is populated with correct data (toolCallId, args, result)
  - Assert NO `TOOL_CALL_RESULT` event is emitted (that comes from threads.service.ts)
- Rewrite "suppresses all TOOL_CALL events" -> assert events ARE emitted
- Keep "does NOT suppress tools named 'shell' when skill tool is 'code_execution'" (unchanged)
- Keep "does NOT suppress tools when no skill tool name is set" (unchanged)
- Update "stitches text segments" -- text stitching should still work
- Add test: missing tool call ID at tool-result throws Error

**`packages/backend/src/util/thread-to-model-message-conversion.test.ts`**:

- Add test: messages with `metadata._tambo.providerSkill = true` are excluded
- Add test: non-skill tool messages are unaffected

### Step 7: Update architecture doc

**File**: `devdocs/solutions/architecture/provider-managed-skill-tool-calls.md`

Update to document "Normalize and Emit" approach. Frame as a deliberate reversal based on new observability requirements (TAM-1486), not a refutation of the original suppression reasoning. Keep history of previous approaches as useful context.

## File Change Summary

| File                                                                   | Change                                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `packages/backend/src/services/llm/llm-client.ts`                      | Add `ProviderSkillCall` type (readonly, literal "load_skill"), add `completedProviderSkillCalls` to `LLMStreamItem` |
| `packages/backend/src/services/llm/ai-sdk-client.ts`                   | Emit `TOOL_CALL_START/ARGS/END` for skill tools, accumulate + yield completed skill calls, fail-fast on missing ID  |
| `packages/backend/src/services/decision-loop/decision-loop-service.ts` | Add `completedProviderSkillCalls` to `DecisionStreamItem`, pass through                                             |
| `packages/core/src/` or `packages/backend/src/util/`                   | Add `isProviderSkillMessage` type guard                                                                             |
| `apps/api/src/threads/threads.service.ts`                              | Accumulate skill calls during streaming, persist post-stream with single addMessage calls, emit `TOOL_CALL_RESULT`  |
| `packages/backend/src/util/thread-to-model-message-conversion.ts`      | Filter out `providerSkill` messages using type guard in existing loop                                               |
| `devdocs/solutions/architecture/provider-managed-skill-tool-calls.md`  | Update doc (frame as deliberate reversal)                                                                           |
| `packages/backend/src/services/llm/ai-sdk-client.test.ts`              | Rewrite suppression tests -> emission tests, add fail-fast test                                                     |
| `packages/backend/src/util/thread-to-model-message-conversion.test.ts` | Add filtering tests                                                                                                 |

## Edge Cases

1. **Multiple skills per turn**: Each gets separate TOOL_CALL_START/ARGS/END events during streaming and separate messages post-stream. Client sees: text -> tool events -> text -> tool events -> text.
2. **Missing tool call ID**: Fail fast with Error at tool-result time. Don't silently degrade with empty string.
3. **Large skill results**: Store verbatim for V1. Monitor for results >64KB and consider truncation later.
4. **Metadata corruption**: The `isProviderSkillMessage` type guard handles this gracefully via optional chaining -- corrupted metadata just means the message isn't filtered (safe default).
5. **Concurrent streams**: Post-stream persistence avoids DB connection pool contention during the streaming hot path.
