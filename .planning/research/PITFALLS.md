# Domain Pitfalls

**Domain:** CLI Agent + Headless SDK (streaming, tool execution, code modification)
**Researched:** 2026-02-11

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Silent Failures with Superficial Success

**What goes wrong:** LLMs generate code that appears to run successfully (no syntax errors, no crashes) but fails to perform as intended. This happens through removed safety checks, fake output matching desired formats, or other techniques that avoid execution crashes. Silent failures lurk undetected until surfacing much later in production.

**Why it happens:** Recent LLM models (2025-2026) have reached a quality plateau or are in decline. Tasks that previously took 5 hours assisted by AI now commonly take 7-8 hours or longer. Around 45% of AI-generated code contains security flaws.

**Consequences:**

- User trust destroyed immediately (critical for CLI init tools)
- Silent data corruption from failed workflows is a data integrity breach
- Security vulnerabilities deployed to production
- Debugging takes longer than if the code had crashed immediately

**Prevention:**

- **Implement comprehensive validation layers**: Don't just check syntax, validate behavior
- **Add runtime assertions**: Verify expected state at critical checkpoints
- **Use fail-fast patterns**: Prefer crashes over silent failures
- **Implement transaction logs**: Record all data-changing operations with timestamps for reconstruction
- **Code review integration**: Working in pairs or small teams catches hallucinations and logic errors early

**Detection:**

- Tests pass but feature doesn't work as specified
- Edge cases fail silently
- Security scans reveal vulnerabilities in generated code
- User reports behavior that "seems wrong but doesn't error"

**Phase mapping:** Phase 1 (SDK Core) - Build validation infrastructure early. Phase 2 (CLI Agent) - Implement plan verification before execution.

### Pitfall 2: Concurrent Write File Corruption

**What goes wrong:** AI agents generate multiple concurrent `WorkspaceEdit` calls targeting the same file to maximize throughput, resulting in file corruption through partial writes, race conditions, and inconsistent state.

**Why it happens:** Agents optimize for parallelism without coordinating file access. With the rise of AI agents using VS Code as a headless host, this has become a specific class of corruption issue.

**Consequences:**

- User's working code becomes corrupted
- Git history contaminated with broken commits
- Loss of user trust (one corruption incident = permanent damage for CLI tools)
- Manual recovery required, potentially losing hours of work

**Prevention:**

- **Implement strict mode for WorkspaceEdit**: Prevent concurrent edits to same file
- **Use Saga Orchestration Pattern**: If one step fails, automatically roll back all previous steps
- **Implement Two-Phase Commit Protocol**: Coordinate atomic transactions across multiple operations
- **Add file-level locking**: Queue operations on same file, execute serially
- **Write-ahead logging**: Prepare edits in staging area, apply atomically

**Detection:**

- Syntax errors in previously valid files
- Mixed content from multiple intended edits
- File encoding corruption (UTF-8 issues)
- Git diff shows nonsensical changes

**Phase mapping:** Phase 1 (SDK Core) - Implement atomic write operations with locking. Critical before any code modification features.

### Pitfall 3: Context Window Overload with Large Codebases

**What goes wrong:** Architectural context across services and repositories becomes too large to fit in context window. Consumer-grade AI assistants work great for 10K-line projects but collapse beyond 100K files. The model either truncates critical context or fails entirely.

**Why it happens:** Codebases grow beyond context window limits (even with 200K+ token windows). Naive "dump entire codebase" approaches fail. Architectural context is one of the hardest problems for AI coding assistants at scale.

**Consequences:**

- Model makes recommendations based on incomplete picture
- Breaking changes to APIs not detected
- Recommendations contradict existing patterns
- Slow response times as model processes irrelevant files
- High API costs from processing unnecessary tokens

**Prevention:**

- **Implement semantic chunking**: Use embeddings to retrieve relevant code sections
- **Build architectural maps**: Pre-compute module relationships, update incrementally
- **Smart context selection**: Use AST analysis to identify dependencies
- **Iterative refinement**: Start narrow, expand context only when needed
- **Repository-wide search with semantic embeddings**: Tools like Augment ingest entire repositories and maintain millisecond-level sync with changes
- **Balance is key**: Provide enough context to ground the task, but keep inputs focused and relevant

**Detection:**

- Recommendations ignore existing similar implementations
- Breaking changes to internal APIs
- Response times > 30 seconds for analysis
- Model requests clarification on basic project structure
- Token usage spikes without quality improvement

**Phase mapping:** Phase 2 (CLI Agent) - Implement context management before codebase analysis features. This is architectural, not a later optimization.

### Pitfall 4: Agent Coordination and Inter-Agent Misalignment

**What goes wrong:** Multi-agent LLM systems fail at 41-86.7% rates in production because specification ambiguity and unstructured coordination protocols cause agents to misinterpret roles and duplicate work. Inter-agent misalignment accounts for the largest percentage of all observed breakdowns.

**Why it happens:**

- One model's reply exceeds another's context window, causing critical details to vanish
- Specifications are ambiguous about role boundaries
- No formal coordination protocol between agents
- Context loss creates misalignment patterns that compound across interactions

**Consequences:**

- Duplicated work (two agents edit same file differently)
- Contradictory changes (one agent undoes another's work)
- Workflow deadlocks (agents waiting for each other)
- Exponential cost increase from repeated operations
- User sees confusing, contradictory progress messages

**Prevention:**

- **Single-agent architecture for MVP**: Avoid multi-agent complexity initially
- **Explicit role boundaries**: If multiple agents needed, define clear non-overlapping responsibilities
- **Formal handoff protocols**: Use structured data for agent-to-agent communication
- **Centralized state management**: Single source of truth for workflow state
- **Distributed transaction logs**: Each agent records operations for coordination

**Detection:**

- Same file edited multiple times in single workflow
- Progress messages contradict each other
- Workflow stalls without clear error
- API costs 2-3x higher than expected
- User reports "confused" or "contradictory" behavior

**Phase mapping:** Phase 2 (CLI Agent) - Start with single-agent architecture. Only introduce multi-agent if absolutely necessary, with explicit coordination layer.

### Pitfall 5: Tool Call Infinite Loops and Repetition

**What goes wrong:** Agent enters infinite loop of tool calls, either repeating identical calls with same arguments or alternating between two tools indefinitely. This happens even with models achieving 60% pass@1 on benchmarks.

**Why it happens:**

- Tool returns error, model retries with identical parameters
- Rate limits hit but model doesn't back off
- No detection of repetition patterns
- Missing `max_iterations` or `max_execution_time` limits

**Consequences:**

- API costs explode (hundreds of identical calls)
- User sees "stuck" progress indicator
- Rate limits exhausted, affecting other operations
- Timeout without useful result
- Self-inflicted DoS attack on external APIs

**Prevention:**

- **Implement max_iterations limit**: Prevent unbounded execution (typically 10-20 iterations)
- **Set max_execution_time**: Time limit for entire workflow (e.g., 5 minutes)
- **Detect repetition patterns**: Argument-aware detection of alternating or repeated tool calls with identical inputs
- **Stop immediately on repetition**: Clear explanation to user when detected
- **Circuit breakers**: Automatically stop after N consecutive failures
- **Exponential backoff for rate limits**: Retry logic with exponential delays and jitter

**Detection:**

- Same tool called 3+ times with identical arguments
- Execution time exceeds reasonable bounds (> 2 minutes for simple tasks)
- Rate limit errors in logs
- Progress indicator shows same action repeatedly
- API costs spike unexpectedly

**Phase mapping:** Phase 1 (SDK Core) - Build loop detection into execution engine. Non-negotiable safety feature.

## Moderate Pitfalls

### Pitfall 6: Package Hallucinations and Dependency Invention

**What goes wrong:** LLMs generate dependencies that don't actually exist, inventing package names that sound plausible. Hallucination frequency can be as high as 48% in some cases.

**Prevention:**

- Provide explicit dependency list in prompts
- Validate all generated imports against package registries
- Use RAG to ground package suggestions in real package data
- Implement pre-execution validation of all imports

**Phase mapping:** Phase 2 (CLI Agent) - Add dependency validation before code generation.

### Pitfall 7: Streaming Protocol Mismatches

**What goes wrong:** Runtime environment constraints conflict with streaming requirements. Vercel AI SDK's `StreamingTextResponse` requires Edge runtime exclusively—Node.js applications cannot use these features. Text responses appear in 2-3 big chunks instead of character-by-character streaming.

**Prevention:**

- Verify runtime environment compatibility early
- Choose SDK based on deployment constraints
- Implement proper stream parsing at protocol level
- Test streaming granularity across different network conditions

**Phase mapping:** Phase 1 (SDK Core) - Validate streaming approach matches deployment environment.

### Pitfall 8: Poor Progress Indication and UX Feedback

**What goes wrong:** Long-running operations show no progress, leaving users wondering if tool crashed. TUI deadlocks under high streaming throughput. Tools appear "stuck" when actually processing.

**Prevention:**

- Show progress immediately ("Analyzing your request...")
- Render incrementally without buffering entire response
- Display tool uses as they happen
- Show in-progress activity instead of appearing stuck
- Implement OSC 9;4 terminal progress bars
- Break complex tasks into discrete steps with progress tracking
- Use AG-UI protocol for standardized progress communication

**Phase mapping:** Phase 2 (CLI Agent) - Build progress UX early. Critical for user perception.

### Pitfall 9: Line Number Brittleness in Diffs

**What goes wrong:** LLMs generate diffs with incorrect hunk header line numbers. Traditional patch tools fail because file has changed since diff was generated. Applying LLM-generated diffs using line numbers causes edits to apply to wrong sections or fail entirely.

**Prevention:**

- **Use context-based matching**: Match on surrounding code, not line numbers
- **Apply hunks dynamically**: Adjust offsets as edits are applied
- **Implement Morph Fast Apply pattern**: Deterministic merging of edit snippets
- **Preserve unchanged code**: Explicitly keep sections not targeted for edits
- **Fuzzy matching with fallback**: If exact context not found, try approximate match with user confirmation

**Phase mapping:** Phase 3 (Code Modification) - Use context-based diff application from day one.

### Pitfall 10: Reliability vs Consistency Gap

**What goes wrong:** Agents achieving 60% pass@1 on benchmarks may exhibit only 25% consistency across multiple trials when run 1,000 times under realistic network conditions with occasional API failures. Single-run success rates are misleading for production reliability.

**Prevention:**

- Test under realistic network conditions (occasional failures, timeouts)
- Measure consistency across multiple runs, not just single success
- Implement comprehensive retry logic with exponential backoff
- Use circuit breakers and fallback strategies
- Monitor production reliability metrics, not just success rates

**Phase mapping:** Phase 1 (SDK Core) - Build reliability testing into CI from start.

## Minor Pitfalls

### Pitfall 11: UTF-8 Encoding Assumptions

**What goes wrong:** Code modification assumes UTF-8 everywhere but encounters files with different encodings or BOM markers. Double-encoding corrupts text. Platform differences in line endings cause inconsistencies.

**Prevention:**

- Detect file encoding before reading
- Explicitly specify UTF-8 for all operations
- Handle BOM markers correctly
- Normalize line endings consistently
- Validate encoding after write operations

**Phase mapping:** Phase 3 (Code Modification) - Add encoding detection to file operations.

### Pitfall 12: Naive Retry Logic Creates DoS

**What goes wrong:** Simple retry-on-failure without exponential backoff creates self-inflicted DoS attacks. LLMs don't inherently know how to back off when hitting rate limits.

**Prevention:**

- Implement exponential backoff with jitter
- Use libraries like Tenacity (Python) for retry logic
- Set maximum retry attempts (typically 3-5)
- Add circuit breakers for repeated failures
- Monitor retry rates to detect issues early

**Phase mapping:** Phase 1 (SDK Core) - Implement retry strategy in SDK foundation.

### Pitfall 13: Over-Mocking in Tests Hides Integration Issues

**What goes wrong:** Tests mock everything including internal functions, creating tests that pass but don't reflect real behavior. Integration issues only discovered in production.

**Prevention:**

- Only mock at system boundaries (external APIs, databases, file systems)
- Don't mock what you own (internal functions)
- Test real code paths whenever possible
- Use integration tests to verify component communication
- Keep unit tests fast, but integration tests realistic

**Phase mapping:** All phases - Establish testing philosophy early, reinforce throughout.

### Pitfall 14: Tool Execution Without Output Validation

**What goes wrong:** Tools return unexpected formats or fail internally, but agent proceeds as if successful. Error messages don't help model understand what went wrong.

**Prevention:**

- Validate tool outputs against expected schema
- Return informative error messages to model
- Distinguish between retriable errors and permanent failures
- Log tool execution results for debugging
- Implement fallback tools for critical operations

**Phase mapping:** Phase 1 (SDK Core) - Build tool validation into execution framework.

### Pitfall 15: Hardcoded Timeouts for Variable Operations

**What goes wrong:** Single timeout value used for all operations. Fast operations wait unnecessarily, slow operations timeout prematurely. Especially problematic for codebase analysis (varies by size).

**Prevention:**

- Set operation-specific timeouts
- Scale timeouts based on input size for analysis operations
- Allow configuration override for special cases
- Provide clear timeout exceeded messages with suggested fixes
- Implement progress callbacks to prevent unnecessary timeouts

**Phase mapping:** Phase 2 (CLI Agent) - Design timeout strategy during architecture phase.

## Phase-Specific Warnings

| Phase Topic                       | Likely Pitfall                                 | Mitigation                                                                                 |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| SDK Core - Streaming              | Runtime environment mismatch (Edge vs Node.js) | Validate deployment target before choosing streaming approach                              |
| SDK Core - Tool Execution         | Infinite loops and repetition                  | Implement max_iterations, repetition detection, circuit breakers from day one              |
| SDK Core - Error Handling         | Silent failures propagate                      | Build fail-fast validation layers into SDK foundation                                      |
| SDK Core - Retries                | Naive retry creates DoS                        | Use exponential backoff with jitter and circuit breakers                                   |
| CLI Agent - Context Management    | Context window overload                        | Implement semantic chunking and smart context selection before analysis features           |
| CLI Agent - Progress UX           | Appearing "stuck"                              | Build incremental rendering and progress indication early                                  |
| CLI Agent - Dependencies          | Package hallucinations                         | Validate all generated imports against registries                                          |
| Code Modification - Atomic Writes | Concurrent file corruption                     | Implement file-level locking and two-phase commit before any code modification             |
| Code Modification - Diffs         | Line number brittleness                        | Use context-based matching, not line numbers                                               |
| Code Modification - Encoding      | UTF-8 assumptions break                        | Detect file encoding before operations                                                     |
| Multi-Agent (if introduced)       | Inter-agent misalignment                       | Start single-agent. Only go multi-agent if absolutely necessary with explicit coordination |

## Sources

### Tool Execution & Loop Control

- [Handling Tool Errors and Agent Recovery](https://apxml.com/courses/langchain-production-llm/chapter-2-sophisticated-agents-tools/agent-error-handling)
- [Agents: Loop Control](https://ai-sdk.dev/docs/agents/loop-control)
- [Agent Loop - Strands Agents](https://strandsagents.com/latest/documentation/docs/user-guide/concepts/agents/agent-loop/)
- [Tracing Claude Code's LLM Traffic](https://medium.com/@georgesung/tracing-claude-codes-llm-traffic-agentic-loop-sub-agents-tool-use-prompts-7796941806f5)
- [ReliabilityBench: Evaluating LLM Agent Reliability](https://arxiv.org/pdf/2601.06112)
- [LLM Tool-Calling in Production](https://medium.com/@komalbaparmar007/llm-tool-calling-in-production-rate-limits-retries-and-the-infinite-loop-failure-mode-you-must-2a1e2a1e84c8)
- [Tool Calling Explained: The Core of AI Agents (2026 Guide)](https://composio.dev/blog/ai-agent-tool-calling-guide)

### Streaming & SDK Implementation

- [Foundations: Streaming](https://ai-sdk.dev/docs/foundations/streaming)
- [Real-time AI in Next.js: How to stream responses with the Vercel AI SDK](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)
- [OpenAI SDK vs Vercel AI SDK: Which Should You Choose in 2026](https://strapi.io/blog/openai-sdk-vs-vercel-ai-sdk-comparison)
- [Agent Network Streaming Issue](https://www.answeroverflow.com/m/1428243966310088724)

### Code Modification & Silent Failures

- [AI Coding Degrades: Silent Failures Emerge](https://spectrum.ieee.org/ai-coding-degrades)
- [Why Multi-Agent LLM Systems Fail](https://galileo.ai/blog/multi-agent-llm-systems-fail)
- [Why Multi-Agent LLM Systems Fail (and How to Fix Them)](https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them)
- [My LLM coding workflow going into 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e)

### Context Window & Codebase Analysis

- [A Comparison of AI Code Assistants for Large Codebases](https://intuitionlabs.ai/articles/ai-code-assistants-large-codebases)
- [Understanding Context Window for AI Performance](https://www.qodo.ai/blog/context-windows/)
- [13 Best AI Coding Tools for Complex Codebases in 2026](https://www.augmentcode.com/tools/13-best-ai-coding-tools-for-complex-codebases)
- [Legacy Code Modernization with Claude Code](https://www.tribe.ai/applied-ai/legacy-code-modernization-with-claude-code-breaking-through-context-window-barriers)
- [How Augment Code Solved the Large Codebase Problem](https://blog.codacy.com/ai-giants-how-augment-code-solved-the-large-codebase-problem)

### File Corruption & Atomic Operations

- [5 Key Strategies to Prevent Data Corruption in Multi-Agent AI](https://galileo.ai/blog/prevent-data-corruption-multi-agent-ai)
- [AI Agent Security: Why Reliability is the Missing Defense Against Data Corruption](https://composio.dev/blog/ai-agent-security-reliability-data-integrity)
- [Strict Mode for WorkspaceEdit to prevent concurrent AI agent corruption](https://github.com/microsoft/vscode/issues/279589)
- [Cascading Failures in Agentic AI: Complete OWASP ASI08 Security Guide 2026](https://adversa.ai/blog/cascading-failures-in-agentic-ai-complete-owasp-asi08-security-guide-2026/)

### Progress UX & CLI Agents

- [Production-Grade Agentic Apps with AG-UI: Real-Time Streaming Guide 2026](https://medium.datadriveninvestor.com/production-grade-agentic-apps-with-ag-ui-real-time-streaming-guide-2026-5331c452684a)
- [The 2026 Guide to Coding CLI Tools: 15 AI Agents Compared](https://www.tembo.io/blog/coding-cli-tools-comparison)
- [Building an Agentic CLI for Everyday Tasks](https://composio.dev/blog/building-an-agentic-cli-for-everyday-tasks)

### Trust & Hallucinations

- [Blind Trust in AI: Most Devs Use AI-Generated Code They Don't Understand](https://clutch.co/resources/devs-use-ai-generated-code-they-dont-understand)
- [Building Trust in AI-Powered Code Generation](https://checkmarx.com/learn/ai-security/building-trust-in-ai-powered-code-generation-a-guide-for-secure-adoption/)
- [The Mirage of AI Programming: Hallucinations and Code Integrity](https://www.trendmicro.com/vinfo/us/security/news/vulnerabilities-and-exploits/the-mirage-of-ai-programming-hallucinations-and-code-integrity)

### Retries & Rate Limits

- [How to handle rate limits | OpenAI Cookbook](https://cookbook.openai.com/examples/how_to_handle_rate_limits)
- [Tenacity Retries: Exponential Backoff Decorators 2026](https://johal.in/tenacity-retries-exponential-backoff-decorators-2026/)
- [How to Handle API Rate Limits Gracefully (2026 Guide)](https://apistatuscheck.com/blog/how-to-handle-api-rate-limits)

### Testing Strategies

- [The Complete FastAPI × pytest Guide](https://blog.greeden.me/en/2026/01/06/the-complete-fastapi-x-pytest-guide-building-fearless-to-change-apis-with-unit-tests-api-tests-integration-tests-and-mocking-strategies/)
- [How to Mock in Integration Tests](https://geekyants.com/en-us/blog/how-to-mock-in-integration-tests-tools-and-implementation)
- [Integration Testing LLM Workflows](https://apxml.com/courses/python-llm-workflows/chapter-9-testing-evaluating-llm-apps/integration-testing-llm-workflows)

### Code Diffs & Merge Conflicts

- [AI Apply Patch: Deterministic Merges for LLM Edits](https://www.morphllm.com/ai-apply-patch)
- [Context Over Line Numbers: A Robust Way to Apply LLM Code Diffs](https://medium.com/@surajpotnuru/context-over-line-numbers-a-robust-way-to-apply-llm-code-diffs-eb239e56283f)
- [Git Merge Conflict Resolution Leveraging Strategy Classification and LLM](https://ieeexplore.ieee.org/document/10366637/)
- [Exploring the Capabilities of LLMs for Code Change Related Tasks](https://arxiv.org/html/2407.02824v1)
