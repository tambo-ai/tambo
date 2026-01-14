# Implementation Plan: Tambo API v1

## Summary

**Last updated:** 2025-01-13
**Phases:** 4 (consolidated from 11 after review)
**Review feedback incorporated:** DHH Rails reviewer, Kieran TypeScript reviewer, Code Simplicity reviewer

### Key Changes from Review

1. **Fixed discriminated union validation** - Removed default value assignments that bypassed validation; use `!:` definite assignment
2. **Moved atomic lock to service layer** - Guards only authorize, services handle state mutations
3. **Consolidated to 4 phases** - Error handling and OpenAPI docs happen naturally during implementation
4. **Dropped unnecessary abstractions** - No parameterized guard decorators, no SseEmitter class, no abstract base classes
5. **Removed premature optimizations** - No buffering, in-memory caching, or JSON Patch size thresholds until profiling shows need

---

## Overview

Implement the Tambo API v1 as defined in `plans/api-v1-proposal.md` in the NestJS API server (`apps/api`). This implementation adds new `/v1/` endpoints alongside the existing API without breaking current functionality.

## Problem Statement / Motivation

The current API has accumulated inconsistencies and ad-hoc patterns. The v1 API provides:

- Streaming-first design using AG-UI events as the wire protocol
- Industry-aligned types (OpenAI/Anthropic conventions)
- First-class component streaming with props/state deltas
- Clean separation of server-side (MCP) and client-side tool execution

## Technical Approach

### Architecture

```
apps/api/src/
├── v1/                              # New v1 module
│   ├── v1.module.ts                 # Main v1 module
│   ├── v1.controller.ts             # All v1 endpoints (threads, runs, messages, components)
│   ├── v1.service.ts                # Core v1 business logic
│   ├── dto/
│   │   ├── content.dto.ts           # Content block DTOs
│   │   ├── message.dto.ts           # Message DTOs
│   │   ├── thread.dto.ts            # Thread DTOs
│   │   ├── run.dto.ts               # Run request/response DTOs
│   │   └── tool.dto.ts              # Tool definitions
│   └── v1.errors.ts                 # v1-specific error helpers
```

**Simplified from original:** Single controller instead of 4, single service instead of 3, no separate guards directory (reuse existing), no types directory (use `@ag-ui/core` directly).

---

## Implementation Phases

### Phase 1: Foundation & Schema

**Scope:** Database schema changes, DTOs, module structure, guard modification.

#### 1.1 Database Schema Changes

Add columns to `threads` table. Per the proposal, RunStatus is a simple 3-state enum tracking the current run lifecycle. Edge cases (cancellation, errors, pending tool calls) are tracked via separate Thread fields.

```typescript
// packages/core/src/threads.ts (add to existing file)
/**
 * V1 Run Status - streaming status of the current run.
 *
 * This is a simple lifecycle aligned with AG-UI's run model:
 * - idle: No active SSE stream
 * - waiting: RUN_STARTED emitted, waiting for first content (TTFB phase)
 * - streaming: Actively receiving content
 *
 * Edge cases like cancellation, errors, and pending tool calls are tracked
 * via separate fields on Thread, not as status values.
 */
export enum V1RunStatus {
  IDLE = "idle",
  WAITING = "waiting",
  STREAMING = "streaming",
}

/**
 * V1 Run Error - error information from the last run.
 */
export interface V1RunError {
  code?: string;
  message: string;
}

// packages/db/src/schema.ts - In threads table definition:
// 1. Current run lifecycle (only relevant while runStatus !== "idle")
runStatus: text("run_status", {
  enum: Object.values<string>(V1RunStatus) as [V1RunStatus],
})
  .default(V1RunStatus.IDLE)
  .notNull(),
currentRunId: text("current_run_id"),
statusMessage: text("status_message"), // Human-readable detail (e.g., "Fetching weather data...")

// 2. Last run outcome (cleared when next run starts)
lastRunCancelled: boolean("last_run_cancelled"),
lastRunError: customJsonb<V1RunError>("last_run_error"),

// 3. Next run requirements
// If pendingToolCallIds is non-empty, next run's message MUST contain
// a tool_result for at least one of these IDs (with previousRunId set).
pendingToolCallIds: customJsonb<string[]>("pending_tool_call_ids"),
lastCompletedRunId: text("last_completed_run_id"), // Required as previousRunId when continuing
```

**Tasks:**

- [ ] Add `V1RunStatus` enum and `V1RunError` interface to `packages/core/src/threads.ts`
- [ ] Add schema changes to `packages/db/src/schema.ts` (7 new columns)
- [ ] Generate migration: `npm run db:generate -w packages/db`
- [ ] Test migration: `npm run db:migrate -w packages/db`
- [ ] Export types from packages/core

#### 1.2 Guard Modification (Simple Approach)

Modify existing `ThreadInProjectGuard` to check both param names:

```typescript
// apps/api/src/threads/guards/thread-in-project-guard.ts
// Change line 26 from:
const threadId = request.params.id;
// To:
const threadId = request.params.threadId ?? request.params.id;
```

That's it. One line change. No decorators, no metadata, no abstractions.

#### 1.3 DTOs with Correct Discriminated Union Validation

**CRITICAL: Do NOT use default value assignments on type fields.**

```typescript
// apps/api/src/v1/dto/content.dto.ts
import { ApiSchema } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsBoolean,
  Equals,
  IsNotEmpty,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";

// Union type instead of abstract base class
export type ContentBlock =
  | TextContentDto
  | ResourceContentDto
  | ToolUseContentDto
  | ToolResultContentDto
  | ComponentContentDto;

@ApiSchema({ name: "TextContent" })
export class TextContentDto {
  @Equals("text")
  readonly type!: "text"; // No default value! Use definite assignment

  @IsString()
  @IsNotEmpty()
  text!: string;
}

@ApiSchema({ name: "ResourceContent" })
export class ResourceContentDto {
  @Equals("resource")
  readonly type!: "resource";

  @ValidateNested()
  @Type(() => ResourceDataDto)
  resource!: ResourceDataDto;
}

@ApiSchema({ name: "ToolUseContent" })
export class ToolUseContentDto {
  @Equals("tool_use")
  readonly type!: "tool_use";

  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  @IsNotEmpty()
  input!: Record<string, unknown>;
}

@ApiSchema({ name: "ToolResultContent" })
export class ToolResultContentDto {
  @Equals("tool_result")
  readonly type!: "tool_result";

  @IsString()
  @IsNotEmpty()
  toolUseId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object, {
    discriminator: {
      property: "type",
      subTypes: [
        { value: TextContentDto, name: "text" },
        { value: ResourceContentDto, name: "resource" },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  content!: (TextContentDto | ResourceContentDto)[];

  @IsOptional()
  @IsBoolean()
  isError?: boolean;
}

@ApiSchema({ name: "ComponentContent" })
export class ComponentContentDto {
  @Equals("component")
  readonly type!: "component";

  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  props!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  state?: Record<string, unknown>;
}
```

**Tasks:**

- [ ] Create `apps/api/src/v1/v1.module.ts`
- [ ] Create `apps/api/src/v1/dto/content.dto.ts` (as above)
- [ ] Create `apps/api/src/v1/dto/message.dto.ts`
- [ ] Create `apps/api/src/v1/dto/thread.dto.ts`
- [ ] Create `apps/api/src/v1/dto/run.dto.ts`
- [ ] Create `apps/api/src/v1/dto/tool.dto.ts`
- [ ] Create `apps/api/src/v1/v1.errors.ts` (RFC 9457 helper)
- [ ] Register v1 module in `apps/api/src/app.module.ts`
- [ ] Add `forbidNonWhitelisted: true` to ValidationPipe in `main.ts`

**Success criteria:**

- Migration applies cleanly
- DTOs compile with proper TypeScript types
- Validation rejects invalid type values (test with `{ type: "invalid", text: "test" }`)

---

### Phase 2: Thread & Message CRUD

**Scope:** All non-streaming endpoints with Swagger decorators.

#### 2.1 Thread Endpoints

```typescript
// apps/api/src/v1/v1.controller.ts
@ApiTags("v1")
@ApiSecurity("apiKey")
@ApiSecurity("bearer")
@UseGuards(ApiKeyGuard, BearerTokenGuard)
@Controller("v1")
export class V1Controller {
  constructor(private readonly v1Service: V1Service) {}

  // Thread CRUD
  @Get("threads")
  @ApiOperation({ summary: "List threads" })
  async listThreads(
    @Req() request: Request,
    @Query() query: ListThreadsQueryDto,
  ): Promise<ListThreadsResponseDto> {
    const { projectId, contextKey } = extractContextInfo(request);
    return this.v1Service.listThreads(projectId, contextKey, query);
  }

  @Get("threads/:threadId")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({ summary: "Get thread with messages" })
  async getThread(
    @Param("threadId") threadId: string,
  ): Promise<GetThreadResponseDto> {
    return this.v1Service.getThread(threadId);
  }

  @Post("threads")
  @ApiOperation({ summary: "Create empty thread" })
  async createThread(
    @Req() request: Request,
    @Body() dto: CreateThreadDto,
  ): Promise<CreateThreadResponseDto> {
    const { projectId, contextKey } = extractContextInfo(request);
    return this.v1Service.createThread(projectId, contextKey, dto);
  }

  @Delete("threads/:threadId")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({ summary: "Delete thread" })
  async deleteThread(@Param("threadId") threadId: string): Promise<void> {
    return this.v1Service.deleteThread(threadId);
  }

  // Message endpoints
  @Get("threads/:threadId/messages")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({ summary: "List messages" })
  async listMessages(
    @Param("threadId") threadId: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<ListMessagesResponseDto> {
    return this.v1Service.listMessages(threadId, query);
  }

  @Get("threads/:threadId/messages/:messageId")
  @UseGuards(ThreadInProjectGuard)
  @ApiOperation({ summary: "Get message" })
  async getMessage(
    @Param("threadId") threadId: string,
    @Param("messageId") messageId: string,
  ): Promise<GetMessageResponseDto> {
    return this.v1Service.getMessage(threadId, messageId);
  }
}
```

**Tasks:**

- [ ] Create `apps/api/src/v1/v1.controller.ts` with thread CRUD
- [ ] Create `apps/api/src/v1/v1.service.ts` with thread operations
- [ ] Add message list/get endpoints to controller
- [ ] Add Swagger decorators to all endpoints
- [ ] Write integration tests for thread CRUD

**Success criteria:**

- All CRUD endpoints work with existing auth guards
- Pagination works correctly
- Thread responses include v1 format (runStatus, currentRunId, statusMessage, lastRunCancelled, lastRunError, pendingToolCallIds, lastCompletedRunId)
- Swagger UI shows all endpoints

---

### Phase 3: Run Streaming & Tools

**Scope:** SSE streaming endpoints, tool call handling, atomic concurrency control.

#### 3.1 Atomic Run Start (In Service, Not Guard)

```typescript
// apps/api/src/v1/v1.service.ts
async startRun(
  threadId: string,
): Promise<{ success: true; runId: string } | { success: false; error: HttpException }> {
  const runId = uuidv7();

  // Atomic conditional UPDATE - prevents race condition
  // Clear last run outcome fields when starting new run
  const result = await this.db
    .update(threads)
    .set({
      runStatus: V1RunStatus.WAITING,
      currentRunId: runId,
      statusMessage: null,
      lastRunCancelled: null,
      lastRunError: null,
      updatedAt: new Date(),
    })
    .where(and(eq(threads.id, threadId), eq(threads.runStatus, V1RunStatus.IDLE)))
    .returning({ id: threads.id });

  if (result.length === 0) {
    return {
      success: false,
      error: new HttpException(
        createProblemDetail("CONCURRENT_RUN", "A run is already active on this thread"),
        HttpStatus.CONFLICT,
      ),
    };
  }

  return { success: true, runId };
}
```

#### 3.2 Run Endpoints

```typescript
// In v1.controller.ts
@Post("threads/runs")
@ApiOperation({ summary: "Create thread with run (SSE)" })
@ApiProduces("text/event-stream")
async createThreadWithRun(
  @Req() request: Request,
  @Body() dto: CreateThreadWithRunDto,
  @Res() response: Response,
): Promise<void> {
  const { projectId, contextKey } = extractContextInfo(request);

  // Create thread first
  const thread = await this.v1Service.createThread(projectId, contextKey, dto.thread ?? {});

  // Start run (handles concurrency atomically)
  const startResult = await this.v1Service.startRun(thread.id);
  if (!startResult.success) {
    throw startResult.error;
  }

  // Set SSE headers and stream
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders();

  // Handle connection close
  response.on("close", () => {
    this.v1Service.cancelRun(thread.id, startResult.runId, "connection_closed");
  });

  try {
    await this.v1Service.executeRun(response, thread.id, startResult.runId, dto);
  } catch (error) {
    // Emit error event if headers already sent
    if (response.headersSent) {
      const errorEvent = { type: "error", error: { message: error.message } };
      response.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
    }
    throw error;
  } finally {
    response.end();
  }
}

@Post("threads/:threadId/runs")
@UseGuards(ThreadInProjectGuard)
@ApiOperation({ summary: "Create run on existing thread (SSE)" })
@ApiProduces("text/event-stream")
async createRun(
  @Param("threadId") threadId: string,
  @Body() dto: CreateRunDto,
  @Res() response: Response,
): Promise<void> {
  // Start run (handles concurrency atomically)
  const startResult = await this.v1Service.startRun(threadId);
  if (!startResult.success) {
    throw startResult.error;
  }

  // Same SSE setup as above...
}

@Delete("threads/:threadId/runs/:runId")
@UseGuards(ThreadInProjectGuard)
@ApiOperation({ summary: "Cancel run" })
async cancelRun(
  @Param("threadId") threadId: string,
  @Param("runId") runId: string,
): Promise<CancelRunResponseDto> {
  return this.v1Service.cancelRun(threadId, runId, "user_cancelled");
}
```

#### 3.3 SSE Event Emission (Simple Functions, Not Service)

```typescript
// apps/api/src/v1/v1.service.ts

// Simple helper function - no class needed
private emit(response: Response, event: unknown): void {
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}

async executeRun(
  response: Response,
  threadId: string,
  runId: string,
  dto: CreateRunDto,
): Promise<void> {
  // Emit RUN_STARTED
  this.emit(response, {
    type: "RUN_STARTED",
    threadId,
    runId,
    timestamp: Date.now(),
  });

  // ... streaming logic using this.emit() directly ...

  // Emit RUN_FINISHED
  this.emit(response, {
    type: "RUN_FINISHED",
    threadId,
    runId,
    timestamp: Date.now(),
  });
}
```

#### 3.4 Tool Call Handling

```typescript
// In v1.service.ts
async processToolResults(
  threadId: string,
  previousRunId: string,
  toolResults: ToolResultContentDto[],
): Promise<{ accepted: string[]; stillPending: string[] }> {
  return await this.db.transaction(async (tx) => {
    const thread = await tx.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });

    // Validate previousRunId matches lastCompletedRunId
    if (thread?.lastCompletedRunId !== previousRunId) {
      throw new BadRequestException("Invalid previousRunId");
    }

    const pending = new Set(thread.pendingToolCallIds ?? []);
    const accepted: string[] = [];

    for (const result of toolResults) {
      if (!pending.has(result.toolUseId)) {
        throw new BadRequestException(`Unknown or already processed toolUseId: ${result.toolUseId}`);
      }

      pending.delete(result.toolUseId);
      accepted.push(result.toolUseId);
    }

    // Thread stays idle - a new run will be started to process the results
    await tx.update(threads).set({
      pendingToolCallIds: pending.size > 0 ? Array.from(pending) : null,
    }).where(eq(threads.id, threadId));

    return { accepted, stillPending: Array.from(pending) };
  });
}
```

**Tasks:**

- [ ] Add `startRun()` method to service with atomic locking
- [ ] Add run creation endpoints to controller
- [ ] Add run cancellation endpoint
- [ ] Implement `executeRun()` with AG-UI event emission
- [ ] Implement tool call handling (server-side MCP, client-side awaiting_input)
- [ ] Implement `processToolResults()` with idempotency
- [ ] Add connection close handling
- [ ] Write integration tests for streaming and tool calls

**Success criteria:**

- SSE streaming works with AG-UI events
- Concurrent runs rejected with 409 (tested with parallel requests)
- Connection drop cancels run
- Tool results processed idempotently

---

### Phase 4: Component State & Tests

**Scope:** Component state updates, comprehensive integration tests.

#### 4.1 Component State Endpoint

```typescript
// In v1.controller.ts
@Post("threads/:threadId/components/:componentId/state")
@UseGuards(ThreadInProjectGuard)
@ApiOperation({ summary: "Update component state" })
async updateComponentState(
  @Param("threadId") threadId: string,
  @Param("componentId") componentId: string,
  @Body() dto: UpdateComponentStateDto,
): Promise<UpdateComponentStateResponseDto> {
  return this.v1Service.updateComponentState(threadId, componentId, dto);
}
```

```typescript
// In v1.service.ts
async updateComponentState(
  threadId: string,
  componentId: string,
  dto: UpdateComponentStateDto,
): Promise<{ state: Record<string, unknown> }> {
  // Check thread is idle (inline, no separate guard)
  // Per proposal: state updates allowed when runStatus === "idle"
  const thread = await this.db.query.threads.findFirst({
    where: eq(threads.id, threadId),
  });

  if (thread?.runStatus !== V1RunStatus.IDLE) {
    throw new HttpException(
      createProblemDetail("RUN_ACTIVE", "Cannot update component state while a run is active"),
      HttpStatus.CONFLICT,
    );
  }

  // Verify component exists in thread (inline, no separate guard)
  const message = await this.db.query.messages.findFirst({
    where: and(
      eq(messages.threadId, threadId),
      sql`content @> ${JSON.stringify([{ type: "component", id: componentId }])}::jsonb`,
    ),
  });

  if (!message) {
    throw new NotFoundException(`Component ${componentId} not found in thread`);
  }

  // Get current state and apply update
  const currentState = await this.getComponentState(threadId, componentId);
  let newState: Record<string, unknown>;

  if (dto.patch) {
    const errors = jsonPatchValidate(dto.patch, currentState);
    if (errors) {
      throw new BadRequestException(`Invalid JSON Patch: ${errors.message}`);
    }
    newState = jsonPatchApply(currentState, dto.patch).newDocument;
  } else if (dto.state !== undefined && dto.state !== null) {
    newState = dto.state;
  } else {
    throw new BadRequestException("Either 'state' or 'patch' must be provided");
  }

  await this.persistComponentState(threadId, componentId, newState);
  return { state: newState };
}
```

#### 4.2 Integration Tests

```typescript
// apps/api/src/v1/__tests__/v1.integration.test.ts
describe("V1 API", () => {
  describe("Thread CRUD", () => {
    it("creates a thread", async () => {
      /* ... */
    });
    it("lists threads with pagination", async () => {
      /* ... */
    });
    it("gets thread with messages", async () => {
      /* ... */
    });
    it("deletes thread", async () => {
      /* ... */
    });
  });

  describe("Run Streaming", () => {
    it("streams AG-UI events", async () => {
      /* ... */
    });
    it("rejects concurrent runs with 409", async () => {
      /* ... */
    });
    it("cancels run on connection close", async () => {
      /* ... */
    });
    it("includes full message in RUN_FINISHED", async () => {
      /* ... */
    });
  });

  describe("Tool Calls", () => {
    it("pauses with awaiting_input for client tools", async () => {
      /* ... */
    });
    it("continues with tool results", async () => {
      /* ... */
    });
    it("handles partial tool results", async () => {
      /* ... */
    });
    it("rejects duplicate tool results idempotently", async () => {
      /* ... */
    });
  });

  describe("Component State", () => {
    it("updates state with full replacement", async () => {
      /* ... */
    });
    it("updates state with JSON Patch", async () => {
      /* ... */
    });
    it("rejects update during active run", async () => {
      /* ... */
    });
    it("rejects update for non-existent component", async () => {
      /* ... */
    });
  });

  describe("Error Handling", () => {
    it("returns RFC 9457 Problem Details", async () => {
      /* ... */
    });
    it("includes field-level validation errors", async () => {
      /* ... */
    });
  });
});
```

**Tasks:**

- [ ] Add component state endpoint to controller
- [ ] Implement `updateComponentState()` in service (with inline auth checks)
- [ ] Write integration tests for all endpoints
- [ ] Write integration tests for error conditions
- [ ] Write integration tests for concurrent run rejection
- [ ] Verify all Swagger docs generate correctly

**Success criteria:**

- Component state updates work with replacement and JSON Patch
- Updates rejected during active runs
- All integration tests pass
- Swagger UI shows all endpoints with examples

---

## Acceptance Criteria

### Functional Requirements

- [ ] All endpoints from the v1 proposal are implemented
- [ ] AG-UI events stream correctly over SSE
- [ ] Component props stream with JSON Patch deltas
- [ ] Client-side tool calls pause with `awaiting_input` and continue with results
- [ ] Server-side (MCP) tool calls execute inline
- [ ] Component state updates work when thread is idle or awaiting_input
- [ ] Concurrent runs rejected with 409 Conflict
- [ ] Connection drop discards partial state and cancels run

### Non-Functional Requirements

- [ ] Existing API (`advanceThread`) continues to work unchanged
- [ ] All v1 endpoints authenticated via existing guards
- [ ] Error responses follow RFC 9457 Problem Details
- [ ] OpenAPI documentation complete for all endpoints

### Quality Gates

- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] All integration tests pass
- [ ] Swagger docs generate correctly

---

## Dependencies & Prerequisites

1. **AG-UI SDK**: Install `@ag-ui/core` for event type definitions
2. **fast-json-patch**: Install for JSON Patch application
3. **Existing guards**: Reuse ApiKeyGuard, BearerTokenGuard, ThreadInProjectGuard from current API
4. **Database schema**: Add RunStatus columns via migration

---

## Risk Analysis & Mitigation

| Risk                                   | Impact   | Mitigation                                                    |
| -------------------------------------- | -------- | ------------------------------------------------------------- |
| Breaking existing API                  | High     | v1 is additive; existing endpoints unchanged                  |
| Race condition in concurrent run check | Critical | Atomic UPDATE in service layer (not guard)                    |
| Discriminated union validation bypass  | Critical | No default values; use `!:` assertion; test with invalid type |
| SSE resource exhaustion                | High     | Connection timeouts; limit concurrent connections             |
| Component auth bypass                  | High     | Inline component existence check in service                   |

---

## References

### Internal

- Current streaming: `apps/api/src/threads/threads.controller.ts:409-461`
- Current DTOs: `apps/api/src/threads/dto/`
- Database schema: `packages/db/src/schema.ts`
- Auth guards: `apps/api/src/projects/guards/`

### External

- [AG-UI Protocol](https://docs.ag-ui.com/)
- [NestJS SSE Documentation](https://docs.nestjs.com/techniques/server-sent-events)
- [RFC 6902 - JSON Patch](https://datatracker.ietf.org/doc/html/rfc6902)
- [RFC 9457 - Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html)

### Related

- v1 Proposal: `plans/api-v1-proposal.md`
