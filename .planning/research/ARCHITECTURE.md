# Architecture Patterns: CLI Agent + Headless SDK

**Domain:** CLI-based AI agent systems with tool execution
**Researched:** 2026-02-11

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Entry Point                          │
│                     (tambo init command)                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│                       Agent Orchestrator                         │
│  - Initialize thread via client-core                             │
│  - Assemble codebase context                                     │
│  - Execute agent loop (plan → execute → verify)                  │
│  - Present batch plan for confirmation                           │
│  - Coordinate tool execution                                     │
└─────┬──────────────────────────────────────────┬────────────────┘
      │                                          │
      v                                          v
┌─────────────────────────┐          ┌──────────────────────────┐
│   @tambo-ai/client-core │          │    Tool Executor         │
│   (Headless SDK)        │          │    Runtime               │
│                         │          │                          │
│ - Thread management     │          │ - Codebase analyzer      │
│ - Message streaming     │          │ - File operations        │
│ - Tool call protocol    │          │   (create/edit/delete)   │
│ - Response parsing      │          │ - Validation             │
│ - SSE handling          │          │ - Rollback capability    │
└────────┬────────────────┘          └─────────┬────────────────┘
         │                                     │
         v                                     │
┌────────────────────────┐                     │
│   Tambo Cloud API      │                     │
│   (NestJS Backend)     │                     │
│                        │                     │
│ - Model inference      │                     │
│ - Thread storage       │                     │
│ - Message history      │                     │
│ - Streaming responses  │                     │
└────────────────────────┘                     │
                                               │
         ┌─────────────────────────────────────┘
         v
┌─────────────────────────────────────────────┐
│            User's Codebase                   │
│                                              │
│ - Files modified by tool executor            │
│ - Components registered                      │
│ - TamboProvider injected                     │
└──────────────────────────────────────────────┘
```

### Component Boundaries

| Component                      | Responsibility                                                     | Communicates With                            |
| ------------------------------ | ------------------------------------------------------------------ | -------------------------------------------- |
| **CLI Entry Point**            | Parse commands, authenticate user, validate project context        | Agent Orchestrator, existing CLI auth system |
| **Agent Orchestrator**         | Control flow for agent loop, plan presentation, user confirmation  | client-core, Tool Executor, CLI prompts      |
| **client-core (Headless SDK)** | Pure TypeScript API client, thread/message management, streaming   | Tambo Cloud API (HTTP/SSE)                   |
| **Tool Executor Runtime**      | Execute file operations, validate changes, maintain rollback state | User's codebase, Agent Orchestrator          |
| **Codebase Analyzer**          | Static analysis, framework detection, component discovery          | Tool Executor Runtime, Agent Orchestrator    |
| **Tambo Cloud API**            | LLM inference, thread persistence, authentication                  | client-core via HTTP                         |
| **User Confirmation UI**       | Display batch plan as checklist, collect user approval             | Agent Orchestrator (via inquirer/prompts)    |

### Data Flow

#### 1. Initialization Phase

```
User runs `tambo init`
  → CLI validates auth + project structure
  → Agent Orchestrator creates setup thread via client-core
  → client-core calls `POST /api/threads` on Tambo API
  → Thread ID returned, stored in orchestrator state
```

#### 2. Analysis Phase

```
Agent Orchestrator invokes Codebase Analyzer
  → Analyzer scans project structure (package.json, tsconfig, framework files)
  → Detects React framework, state management, routing patterns
  → Identifies candidate components for AI control
  → Returns structured analysis as JSON
  → Agent Orchestrator formats analysis into context prompt
  → Sends initial message via client-core.sendMessage(threadId, contextPrompt)
```

#### 3. Planning Phase (ReAct Loop)

```
client-core streams LLM response via SSE
  → Model returns tool calls (analyze_component, identify_interactables)
  → Agent Orchestrator executes read-only tools locally
  → Sends tool results back via client-core.sendToolResult()
  → Model synthesizes into recommended plan
  → Model signals "plan complete" via specific tool call or message marker
  → Agent Orchestrator extracts plan items from final response
```

#### 4. Confirmation Phase

```
Agent Orchestrator formats plan as checklist
  → Displays via inquirer.checkbox or similar
  → User toggles items they want to execute
  → Confirmed items passed to execution phase
```

#### 5. Execution Phase (Tool Calls)

```
For each confirmed plan item:
  → Agent Orchestrator sends execution request via client-core
  → Model returns tool calls (edit_file, create_file)
  → Tool Executor Runtime validates and executes changes
  → File system changes applied with backup snapshots
  → Tool results sent back to model
  → Loop continues until model signals completion
```

#### 6. Verification Phase

```
Agent Orchestrator validates final state
  → Checks TamboProvider in root layout
  → Verifies registered components
  → Confirms tool definitions created
  → Reports success/failure to user
```

## Patterns to Follow

### Pattern 1: Plan-Then-Execute Agent Loop

**What:** Separate planning from execution into distinct phases with explicit user approval between them.

**When:** CLI agents that modify user code or perform destructive actions.

**Benefits:**

- User maintains control over what gets changed
- Cleaner separation of concerns
- Reduces risk of unintended modifications
- Better error recovery (rollback before approval)

**Example Architecture:**

```typescript
// Agent Orchestrator
class AgentOrchestrator {
  async run(projectPath: string): Promise<void> {
    // Phase 1: Plan
    const thread = await this.clientCore.createThread({ projectId });
    const context = await this.analyzer.analyzeCodebase(projectPath);
    const plan = await this.getPlanFromModel(thread.id, context);

    // Phase 2: Confirm
    const confirmedItems = await this.getUserConfirmation(plan);

    // Phase 3: Execute
    await this.executeConfirmedPlan(thread.id, confirmedItems);
  }
}
```

**References:**

- [Plan-and-Execute Agents](https://blog.langchain.com/planning-agents/) - LangChain pattern overview
- [Plan-Then-Execute Pattern](https://agentic-patterns.com/patterns/plan-then-execute-pattern/) - Detailed implementation guide

### Pattern 2: Headless SDK as Protocol Adapter

**What:** client-core acts as a pure protocol adapter between CLI and API, with zero UI dependencies.

**When:** Building tools that need API access from multiple contexts (CLI, server, tests).

**Structure:**

```typescript
// packages/client-core/src/client.ts
export class TamboClient {
  constructor(
    private apiUrl: string,
    private apiKey: string,
    private httpClient: HTTPClient = new FetchHTTPClient(),
  ) {}

  // Thread management
  async createThread(params: CreateThreadParams): Promise<Thread>;
  async getThread(threadId: string): Promise<Thread>;

  // Message streaming
  async sendMessage(
    threadId: string,
    content: string,
    onChunk: (chunk: MessageChunk) => void,
  ): Promise<Message>;

  // Tool execution protocol
  async sendToolResult(
    threadId: string,
    toolCallId: string,
    result: ToolResult,
  ): Promise<void>;
}
```

**Key Characteristics:**

- No React dependencies
- No DOM/Browser APIs
- Works in Node.js and browser (isomorphic)
- Testable without network (inject mock HTTP client)
- Single responsibility: API communication only

**References:**

- [Vercel AI SDK Architecture](https://strapi.io/blog/openai-sdk-vs-vercel-ai-sdk-comparison) - Headless design at 19.5kb gzipped
- [TypeScript SDK Pattern](https://deepwiki.com/lmstudio-ai/docs/5.1-plugin-architecture) - Async-first API design

### Pattern 3: Tool Registry with Runtime Resolution

**What:** Tools are registered with schemas and execution functions; agent discovers and invokes at runtime.

**When:** Agent needs extensibility without recompiling.

**Implementation:**

```typescript
// Tool Registry
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.name);
    if (!tool) throw new Error(`Unknown tool: ${toolCall.name}`);

    // Validate input against Zod schema
    const validatedInput = tool.inputSchema.parse(toolCall.input);

    // Execute tool function
    return await tool.execute(validatedInput);
  }
}

// Tool Definition
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  execute: (input: unknown) => Promise<ToolResult>;
}
```

**Built-in Tools for CLI Agent:**

```typescript
// Read-only analysis tools (planning phase)
const analysisTools = [
  {
    name: "analyze_codebase",
    description: "Scan project structure and detect framework",
    inputSchema: z.object({ path: z.string() }),
    execute: async ({ path }) => analyzer.analyze(path),
  },
  {
    name: "list_components",
    description: "Find React components in project",
    inputSchema: z.object({ directory: z.string() }),
    execute: async ({ directory }) => analyzer.findComponents(directory),
  },
];

// Write tools (execution phase)
const executionTools = [
  {
    name: "edit_file",
    description: "Modify existing file",
    inputSchema: z.object({
      path: z.string(),
      content: z.string(),
      strategy: z.enum(["replace", "patch"]),
    }),
    execute: async (input) => fileEditor.edit(input),
  },
  {
    name: "create_file",
    description: "Create new file",
    inputSchema: z.object({
      path: z.string(),
      content: z.string(),
    }),
    execute: async (input) => fileEditor.create(input),
  },
];
```

**References:**

- [ToolRegistry: Protocol-Agnostic Tool Management](https://arxiv.org/html/2507.10593v1) - Academic research on tool management
- [LangChain Tool Execution](https://langchain-tutorials.github.io/langchain-tools-agents-2026/) - Production patterns for tool calling

### Pattern 4: Streaming Response Handling (SSE)

**What:** Use Server-Sent Events for streaming LLM responses and tool calls from API to CLI.

**When:** Long-running model inference where user needs progress feedback.

**Architecture:**

```typescript
// client-core streaming implementation
class TamboClient {
  async sendMessage(
    threadId: string,
    content: string,
    handlers: StreamHandlers,
  ): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          "X-API-Key": this.apiKey,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ content }),
      },
    );

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const events = this.parseSSE(chunk);

      for (const event of events) {
        switch (event.type) {
          case "text_delta":
            handlers.onTextDelta?.(event.data.delta);
            break;
          case "tool_call":
            handlers.onToolCall?.(event.data.toolCall);
            break;
          case "done":
            handlers.onComplete?.(event.data.message);
            break;
        }
      }
    }
  }
}
```

**Protocol Evolution Note:**
Model Context Protocol migrated from HTTP+SSE to Streamable HTTP in version 2026-03-26. For new implementations, consider Streamable HTTP if MCP compatibility is needed.

**References:**

- [SSE vs Streamable HTTP](https://brightdata.com/blog/ai/sse-vs-streamable-http) - MCP protocol evolution
- [REST+SSE Hybrid Pattern](https://apeatling.com/articles/building-a-real-time-agentic-server-with-restsse/) - Commands via REST, responses via SSE
- [better-sse TypeScript Library](https://www.npmjs.com/package/better-sse) - Fully typed SSE implementation

### Pattern 5: Codebase Analysis Pipeline

**What:** Multi-stage static analysis to understand project structure and identify modification targets.

**When:** Agent needs to understand unfamiliar codebases before making changes.

**Stages:**

```typescript
class CodebaseAnalyzer {
  async analyze(projectPath: string): Promise<CodebaseAnalysis> {
    // Stage 1: Framework detection
    const framework = await this.detectFramework(projectPath);

    // Stage 2: Dependency analysis
    const dependencies = await this.analyzeDependencies(projectPath);

    // Stage 3: File structure mapping
    const structure = await this.mapFileStructure(projectPath);

    // Stage 4: Component discovery
    const components = await this.findComponents(projectPath, framework);

    // Stage 5: State management detection
    const stateManagement = await this.detectStateManagement(projectPath);

    return {
      framework,
      dependencies,
      structure,
      components,
      stateManagement,
      recommendations: this.generateRecommendations(/* ... */),
    };
  }
}
```

**Analysis Techniques:**

1. **Lexical Analysis**: Parse package.json, tsconfig.json for metadata
2. **AST Analysis**: Use `ts-morph` to parse TypeScript files for components
3. **Pattern Matching**: Regex for import statements, component patterns
4. **Heuristics**: File naming conventions, directory structure

**References:**

- [AST Metrics](https://github.com/Halleck45/ast-metrics) - Multi-language static analyzer with architectural insights
- [Static Code Analysis 2026](https://zencoder.ai/blog/static-code-analysis) - Modern analysis approaches
- [Semgrep](https://zencoder.ai/blog/static-code-analysis) - Pattern-based code scanning

### Pattern 6: Sandboxed Tool Execution

**What:** Execute file operations in isolated context with rollback capability.

**When:** Agent modifies user code (need safety guarantees).

**Implementation:**

```typescript
class SandboxedToolExecutor {
  private snapshots = new Map<string, string>();

  async executeWithRollback<T>(operation: () => Promise<T>): Promise<T> {
    // Create snapshots before execution
    await this.createSnapshots();

    try {
      const result = await operation();
      this.clearSnapshots(); // Success, clear backups
      return result;
    } catch (error) {
      await this.rollback(); // Restore from snapshots
      throw error;
    }
  }

  private async createSnapshots(): Promise<void> {
    // Snapshot files that will be modified
    // Store in memory or temp directory
  }

  private async rollback(): Promise<void> {
    for (const [path, content] of this.snapshots) {
      await fs.writeFile(path, content, "utf-8");
    }
    this.snapshots.clear();
  }
}
```

**Security Considerations:**

- **Filesystem Isolation**: Block writes outside project directory
- **Config Protection**: Prevent modification of .git, .env, sensitive files
- **Path Validation**: Resolve symlinks, check for path traversal
- **Whitelist Approach**: Only allow specific file extensions

**References:**

- [How to Sandbox AI Agents](https://northflank.com/blog/how-to-sandbox-ai-agents) - MicroVMs, gVisor, isolation strategies
- [Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk) - NVIDIA security guidance
- [Claude Code Sandboxing](https://code.claude.com/docs/en/sandboxing) - Real-world CLI agent sandboxing

## Anti-Patterns to Avoid

### Anti-Pattern 1: God Object Orchestrator

**What:** Single orchestrator class that handles thread management, tool execution, file operations, user interaction, and business logic.

**Why bad:**

- Violates single responsibility principle
- Impossible to test in isolation
- Tight coupling between concerns
- Hard to extend or modify

**Instead:** Extract into focused components:

```typescript
// BAD
class Orchestrator {
  async run() {
    const thread = await this.createThread(); // HTTP client logic
    const analysis = this.analyzeCodebase(); // File system logic
    const plan = this.getPlan(); // LLM interaction
    this.confirmWithUser(); // CLI prompts
    this.executeChanges(); // File mutations
  }
}

// GOOD
class AgentOrchestrator {
  constructor(
    private client: TamboClient, // Handles HTTP
    private analyzer: CodebaseAnalyzer, // Handles analysis
    private executor: ToolExecutor, // Handles file ops
    private ui: UserInterface, // Handles prompts
  ) {}

  async run() {
    const thread = await this.client.createThread();
    const analysis = await this.analyzer.analyze();
    const plan = await this.getPlanFromModel(thread.id, analysis);
    const confirmed = await this.ui.confirmPlan(plan);
    await this.executor.executePlan(confirmed);
  }
}
```

### Anti-Pattern 2: Inline Tool Definitions

**What:** Defining tools as inline functions or objects at call sites instead of a registry.

**Why bad:**

- Tools not discoverable by other parts of the system
- No schema validation
- Can't extend or override tools
- Duplicated definitions across execution contexts

**Instead:** Use centralized registry pattern (see Pattern 3).

### Anti-Pattern 3: Silent Fallbacks in File Operations

**What:** When a file operation fails, silently skip it or fall back to alternative behavior.

**Why bad:**

- Masks errors that should be surfaced
- Creates unpredictable system state
- User doesn't know what succeeded vs. failed
- Debugging becomes nightmare

**Instead:**

```typescript
// BAD
async function editFile(path: string, content: string) {
  try {
    await fs.writeFile(path, content);
  } catch {
    // Silently skip, continue execution
  }
}

// GOOD
async function editFile(path: string, content: string) {
  try {
    await fs.writeFile(path, content);
  } catch (error) {
    throw new FileOperationError(`Failed to write ${path}: ${error.message}`, {
      path,
      cause: error,
    });
  }
}
```

### Anti-Pattern 4: Synchronous Blocking in Agent Loop

**What:** Using synchronous file operations or blocking calls during the agent loop.

**Why bad:**

- Blocks Node.js event loop
- CLI becomes unresponsive during operations
- Can't show progress indicators
- Poor user experience

**Instead:** Always use async/await with proper streaming:

```typescript
// BAD
function analyzeCodebase(path: string) {
  const files = fs.readdirSync(path); // Blocks
  return files.map((f) => fs.readFileSync(f)); // Blocks repeatedly
}

// GOOD
async function analyzeCodebase(path: string) {
  const files = await fs.readdir(path);
  return await Promise.all(files.map((f) => fs.readFile(f, "utf-8")));
}
```

### Anti-Pattern 5: Coupling SDK to API Internals

**What:** client-core directly depends on API implementation details (DTOs, internal types, database schemas).

**Why bad:**

- SDK breaks when API changes
- Can't version SDK independently
- Circular dependencies between packages
- Violates API contract principle

**Instead:** Define explicit API contracts:

```typescript
// BAD - client-core imports from apps/api
import { CreateThreadDto } from "../../apps/api/src/threads/dto";

// GOOD - client-core defines its own types
interface CreateThreadParams {
  projectId: string;
  metadata?: Record<string, unknown>;
}

// API adapter maps between SDK types and internal DTOs
class TamboClient {
  async createThread(params: CreateThreadParams): Promise<Thread> {
    // SDK type → API payload mapping happens here
    const response = await this.http.post("/threads", {
      project_id: params.projectId,
      metadata: params.metadata,
    });
    return this.parseThreadResponse(response);
  }
}
```

## Scalability Considerations

| Concern               | At 100 users               | At 10K users                         | At 1M users                                              |
| --------------------- | -------------------------- | ------------------------------------ | -------------------------------------------------------- |
| **Thread Creation**   | Direct API calls           | Connection pooling, API client reuse | Distributed thread management, regional endpoints        |
| **File Operations**   | Synchronous with snapshots | Async with streaming progress        | Parallel operations with worker threads                  |
| **Codebase Analysis** | Full AST parsing           | Incremental analysis, caching        | Distributed analysis, fingerprint-based change detection |
| **Tool Execution**    | Local process              | Process pool                         | Distributed execution queue (BullMQ/Celery)              |
| **API Latency**       | Simple retries             | Exponential backoff                  | Circuit breakers, fallback models                        |
| **Streaming**         | Single SSE connection      | Multiplexed connections              | WebSocket upgrade, compression                           |

## Build Order Recommendations

Based on dependency analysis, recommended implementation order:

### Phase 1: Foundation (Week 1-2)

1. **client-core package structure** - Set up monorepo package, TypeScript config, build scripts
2. **HTTP client abstraction** - Implement FetchHTTPClient with error handling
3. **Basic thread operations** - createThread, getThread, listThreads
4. **Authentication** - API key header injection, error handling for 401/403

**Blocker:** Must be complete before CLI can use client-core.

### Phase 2: Streaming Infrastructure (Week 2-3)

1. **SSE parser** - Parse Server-Sent Events format, handle reconnection
2. **Message streaming** - sendMessage with onChunk callbacks
3. **Tool call protocol** - Parse tool call events from stream
4. **Tool result submission** - sendToolResult to continue agent loop

**Blocker:** Required for agent loop to function.

### Phase 3: CLI Integration (Week 3-4)

1. **Agent orchestrator** - Control flow for plan → confirm → execute
2. **Tool registry** - Register built-in tools (analyze, edit, create)
3. **User confirmation UI** - Inquirer-based checklist for plan approval
4. **Codebase analyzer** - Framework detection, component discovery

**Blocker:** Depends on client-core (Phase 1-2).

### Phase 4: Tool Execution Runtime (Week 4-5)

1. **File operation tools** - edit_file, create_file with validation
2. **Snapshot system** - Backup files before modification
3. **Rollback mechanism** - Restore from snapshots on error
4. **Path sandboxing** - Prevent writes outside project directory

**Blocker:** Depends on tool registry (Phase 3).

### Phase 5: Polish & Error Handling (Week 5-6)

1. **Progress indicators** - Ora spinners during long operations
2. **Error recovery** - Graceful handling of API failures, partial rollback
3. **Logging** - Structured logs for debugging
4. **Testing** - Integration tests for full init flow

**Dependencies:** All previous phases must be stable.

## Critical Integration Points

### 1. client-core ↔ Tambo Cloud API

**Contract:** OpenAPI spec from apps/api
**Format:** JSON over HTTP, SSE for streaming
**Auth:** X-API-Key header (already provisioned via tambo login)

**Failure Modes:**

- Network errors → Retry with exponential backoff
- 401/403 → Clear error message, prompt to re-authenticate
- 429 Rate limit → Delay and retry, show wait time to user
- 500 Server error → Fail fast with actionable error message

### 2. CLI ↔ client-core

**Contract:** TypeScript API defined by client-core package
**Format:** Direct function calls (same process)
**State:** client-core is stateless; CLI manages thread ID

**Failure Modes:**

- Invalid API key → Detected by client-core, surfaced to CLI
- Thread not found → CLI should not cache stale thread IDs
- Validation errors → client-core throws, CLI catches and displays

### 3. Tool Executor ↔ User Codebase

**Contract:** File system operations
**Format:** UTF-8 text files, respect .gitignore patterns
**Validation:** Check file exists before edit, parent directory exists before create

**Failure Modes:**

- Permission denied → Show clear error, suggest running with correct permissions
- Disk full → Fail early, don't corrupt files
- File locked → Retry with timeout, then fail
- Invalid path → Reject with validation error

### 4. Agent Loop ↔ LLM

**Contract:** Tool call/result protocol via Tambo API
**Format:** JSON tool calls, text/JSON tool results
**Termination:** Model signals "done" via specific tool call or message

**Failure Modes:**

- Model hallucinates tool names → Tool registry returns error, send to model
- Infinite loop → CLI enforces max iterations (e.g., 20), then abort
- Model never signals done → Timeout after N minutes, present partial plan
- Invalid tool arguments → Zod validation fails, send schema error to model

## References & Sources

### Agent Architecture Patterns

- [How CLI-Based Coding Agents Work](https://medium.com/softtechas/how-cli-based-coding-agents-work-33a36cf463fa) - Architecture deep dive
- [Agentic Terminal - CLI Agents](https://www.infoq.com/articles/agentic-terminal-cli-agents/) - InfoQ article on terminal agents
- [OpenAI Codex CLI Internals](https://www.infoq.com/news/2026/02/codex-agent-loop/) - Real-world agent loop design
- [Plan-and-Execute Agents](https://blog.langchain.com/planning-agents/) - LangChain pattern guide
- [Plan-Then-Execute Pattern](https://agentic-patterns.com/patterns/plan-then-execute-pattern/) - Agentic pattern catalog
- [Agent Design Patterns](https://rlancemartin.github.io/2026/01/09/agent_design/) - 2026 design patterns overview

### Headless SDK Architecture

- [OpenAI SDK vs Vercel AI SDK](https://strapi.io/blog/openai-sdk-vs-vercel-ai-sdk-comparison) - SDK comparison and design patterns
- [AI System Design Patterns 2026](https://zenvanriel.nl/ai-engineer-blog/ai-system-design-patterns-2026/) - Scalable architecture patterns
- [LangChain vs Vercel AI SDK](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide) - Framework comparison
- [TypeScript SDK Plugin Architecture](https://deepwiki.com/lmstudio-ai/docs/5.1-plugin-architecture) - Async-first TypeScript patterns

### Tool Execution & Registry

- [ToolRegistry: Protocol-Agnostic Tool Management](https://arxiv.org/html/2507.10593v1) - Academic research on tool management
- [LangChain Tools and Agents 2026](https://langchain-tutorials.github.io/langchain-tools-agents-2026/) - Production-ready patterns
- [Agent System with Middleware](https://deepwiki.com/langchain-ai/langchain/4.1-agent-system-with-middleware) - LangChain middleware architecture
- [What is AI Agent Registry](https://www.truefoundry.com/blog/ai-agent-registry) - Registry pattern overview
- [OpenAI AgentKit](https://openai.com/index/introducing-agentkit/) - Connector registry pattern

### Streaming & SSE

- [better-sse npm package](https://www.npmjs.com/package/better-sse) - TypeScript SSE implementation
- [SSE vs Streamable HTTP](https://brightdata.com/blog/ai/sse-vs-streamable-http) - MCP protocol evolution
- [REST+SSE Hybrid Pattern](https://apeatling.com/articles/building-a-real-time-agentic-server-with-restsse/) - Real-time agentic server design
- [Using Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) - MDN SSE guide
- [Enhanced SSE Support](https://www.speakeasy.com/blog/release-sse-improvements) - Speakeasy SDK improvements

### Codebase Analysis

- [Static Code Analysis 2026](https://zencoder.ai/blog/static-code-analysis) - Modern analysis techniques
- [AST Metrics](https://github.com/Halleck45/ast-metrics) - Multi-language architectural analysis
- [Guide to Static Code Analysis](https://www.codeant.ai/blogs/static-code-analysis-tools) - Best practices 2026

### Sandboxing & Security

- [How to Sandbox AI Agents](https://northflank.com/blog/how-to-sandbox-ai-agents) - MicroVMs, gVisor, isolation strategies
- [Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk) - NVIDIA security guidance
- [Claude Code Sandboxing](https://code.claude.com/docs/en/sandboxing) - Production CLI agent sandboxing
- [5 Code Sandboxes for AI Agents](https://www.kdnuggets.com/5-code-sandbox-for-your-ai-agents) - Sandbox options comparison

### CLI Design & UX

- [Command Line Interface Guidelines](https://clig.dev/) - CLI design principles
- [10 Design Principles for Delightful CLIs](https://www.atlassian.com/blog/it-teams/10-design-principles-for-delightful-clis) - Atlassian guide
- [UX Patterns for CLI Tools](https://lucasfcosta.com/2022/06/01/ux-patterns-cli-tools.html) - Detailed UX patterns
- [Typer Prompt](https://typer.tiangolo.com/tutorial/prompt/) - Interactive confirmation patterns

### Context Management

- [Model Context Protocol Architecture](https://modelcontextprotocol.io/docs/learn/architecture) - Official MCP docs
- [OpenAI Assistants vs Responses API](https://ragwalla.com/blog/openai-assistants-api-vs-openai-responses-api-complete-comparison-guide) - API evolution (Threads → Conversations)
- [MCP in Production](https://bytebridge.medium.com/what-it-takes-to-run-mcp-model-context-protocol-in-production-3bbf19413f69) - Production deployment patterns
- [MCP Context Management](https://portkey.ai/blog/model-context-protocol-context-management-in-high-throughput/) - High-throughput scenarios

### Monorepo & TypeScript

- [TypeScript Monorepo Setup](https://earthly.dev/blog/setup-typescript-monorepo/) - Build system patterns
- [Managing TypeScript Packages in Monorepos](https://nx.dev/blog/managing-ts-packages-in-monorepos) - Nx guidance
- [Live Types in TypeScript Monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo) - Project references
- [Package Structure & Monorepo](https://deepwiki.com/better-auth/better-auth/1.1-package-structure-and-monorepo) - Better-auth example

---

_Architecture research: 2026-02-11_
