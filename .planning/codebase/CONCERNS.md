# Codebase Concerns

**Analysis Date:** 2026-02-11

## Tech Debt

**Incomplete MCP Handler Implementation:**

- Issue: Elicitation handler is not yet implemented, throws "Not implemented yet"
- Files: `apps/api/src/threads/util/thread-mcp-handlers.ts:141`, `apps/api/src/mcp-server/server.ts:34`
- Impact: MCP elicitation requests will fail at runtime; feature is advertised but unsupported
- Fix approach: Complete elicitation handler implementation following the sampling handler pattern. Add integration tests to prevent regressions.

**Batch Message Operations Not Optimized:**

- Issue: MCP sampling handler adds messages serially in a loop instead of batch insert
- Files: `apps/api/src/threads/util/thread-mcp-handlers.ts:52`
- Impact: Performance degradation with large message volumes (linear O(n) database round-trips)
- Fix approach: Implement batched insert operation via `operations` module, similar to thread initialization patterns

**Large Service File - Complexity Concentration:**

- Issue: `threads.service.ts` is 2,371 lines with highly complex streaming logic
- Files: `apps/api/src/threads/threads.service.ts`
- Impact: Difficult to test, maintain, and reason about; increases bug surface area; harder onboarding
- Fix approach: Extract streaming orchestration logic into separate StreamingThreadService; move tool call handling into ToolCallOrchestrator; separate concerns into focused, testable units

## Fragile Areas

**Async Streaming with Fire-and-Forget Cleanup:**

- Files: `packages/backend/src/services/llm/async-adapters.ts:82`, `apps/api/src/mcp-server/server.ts:244-248`
- Why fragile: Fire-and-forget promises (`void resultPromise.catch()`, `res.on("close")`) may silently fail; no guaranteed cleanup order; transport close racing with request handlers
- Safe modification: Add explicit cleanup tracking; log all failures; ensure synchronization barriers before returning
- Test coverage: Need explicit tests for cleanup races, connection drops, and partial message streams

**MCP Handler Error Propagation:**

- Files: `apps/api/src/threads/util/thread-mcp-handlers.ts:86-97`
- Why fragile: Filters out "resource" content with `console.warn()` instead of structured error handling; silently modifies message content before LLM call without validation
- Safe modification: Use structured logging via `Logger`; validate filtered content doesn't break LLM contract; add test for resource filtering scenarios

**Authorization Guard Chaining:**

- Files: Multiple auth guards in `apps/api/src`
- Why fragile: Silent fallback in `authenticateMcpRequest` (lines 203-205) catches all errors without distinction; doesn't log error details for debugging
- Safe modification: Log error type and message for debugging; distinguish authentication vs permission failures; add explicit error monitoring

**React Query Hook Context Sharing:**

- Files: `react-sdk/src/hooks/react-query-hooks.ts`
- Why fragile: Internal query client must stay synchronized with user-provided hooks; version mismatches cause subtle state management bugs
- Safe modification: Add version checks in provider bootstrap; document strict version constraints; add tests that verify hook interop with external React Query

## Missing Critical Features

**Elicitation Handler Stub:**

- Problem: MCP elicitation capability is advertised but completely unimplemented
- Blocks: Any MCP server requesting elicitation (sampling requests work, but elicitation requests fail)
- Severity: High - breaks MCP compatibility for servers that rely on elicitation

**Session-Less MCP Access Control:**

- Problem: Session-less MCP tokens (contextKey-based) lack thread isolation validation
- Blocks: Proper resource scoping for public/shared MCP endpoints
- Impact: Potential information disclosure between different contextKeys if not validated at resource access layer

## Test Coverage Gaps

**Streaming Edge Cases:**

- What's not tested: Network interruptions during stream, partial message recovery, chunking boundaries, backpressure handling
- Files: `apps/api/src/threads/threads.service.ts` (streaming loop)
- Risk: Silent data loss or corruption during streaming; difficult to debug in production
- Priority: High

**Tool Call Limit Enforcement:**

- What's not tested: Interaction between tool limits and streaming; tool call count boundary conditions (limit = 0, limit = 1, etc.)
- Files: `apps/api/src/threads/util/tool-call-tracking.ts`, `apps/api/src/threads/threads.service.ts:1829-1850`
- Risk: Users could exceed intended tool call limits; cost controls fail
- Priority: High

**MCP Handler Cleanup:**

- What's not tested: MCP client closure on request abort; resource cleanup under connection failures
- Files: `apps/api/src/mcp-server/server.ts:244-248`
- Risk: Resource leaks accumulating over time; connection pool exhaustion
- Priority: Medium

**Content Part Filtering:**

- What's not tested: Filtering of resource content parts; interaction with component decisions and tool calls
- Files: `apps/api/src/threads/util/thread-mcp-handlers.ts:86-97`
- Risk: Resource content silently dropped; LLM context becomes incomplete
- Priority: Medium

**MCP Server Availability:**

- What's not tested: Behavior when MCP servers are unavailable during sampling; error propagation through queue
- Files: `apps/api/src/threads/util/thread-mcp-handlers.ts:98-103`
- Risk: Thread gets stuck waiting for MCP response; no timeout or fallback mechanism visible
- Priority: Medium

## Error Handling & Silent Failures

**Console Warnings Instead of Structured Logging:**

- Issue: Code uses `console.warn()` and `console.error()` in MCP context and cleanup code
- Files: `apps/api/src/threads/util/thread-mcp-handlers.ts:90`, `react-sdk/src/mcp/tambo-mcp-provider.tsx:176-183`
- Impact: Warnings go to console only; not captured by observability systems; harder to monitor in production
- Fix: Replace with structured `Logger` service calls; ensure all production warnings are traceable

**Silent Error Swallowing in Cleanup Paths:**

- Issue: `Promise.allSettled()` swallows all cleanup errors intentionally; no logging of failures
- Files: `apps/api/src/mcp-server/server.ts:76-85`
- Impact: Resource leaks go undetected; no visibility into why cleanup failed
- Fix: Log each failed cleanup with context (MCP client URL, error type); increment metrics for cleanup failures

**Missing Error Cases for Tool Call Response:**

- Issue: Tool call response validation only checks `isError` flag; doesn't validate response content structure
- Files: `react-sdk/src/mcp/tambo-mcp-provider.tsx:317-322`
- Impact: Malformed tool responses accepted without validation; could cause downstream crashes
- Fix: Add schema validation for tool response content; throw with clear error if format is unexpected

## Performance Bottlenecks

**Hash Generation in React Hooks:**

- Problem: `hashString()` uses DJB2-like synchronous hash instead of crypto for non-security token change detection
- Files: `react-sdk/src/mcp/tambo-mcp-provider.tsx:157-163`
- Impact: No measurable performance issue currently, but is a workaround for async crypto in React; may mask future refactoring opportunities
- Improvement path: Document why sync hash was chosen; add assertion that tokens are pre-validated at boundary; consider memoizing hash if token changes frequently

**Streaming Performance Tracking:**

- Problem: Throughput metrics calculated but only logged to Sentry breadcrumbs, not exposed as observability data
- Files: `apps/api/src/threads/threads.service.ts:1811-1823`
- Impact: No visibility into streaming performance trends; can't detect degradation
- Improvement path: Push chunks/second metrics to performance monitoring; add SLO tracking; log when chunksPerSecond drops below threshold

**Serial MCP Tool Registration:**

- Problem: Each tool from `listTools()` creates a new registration call; no batching
- Files: `react-sdk/src/mcp/tambo-mcp-provider.tsx:273-343`
- Impact: Tool registration scales linearly with tool count; many small network/state updates
- Improvement path: Batch tool registrations; defer registry updates until all tools loaded

## Security Considerations

**CORS Configuration:**

- Risk: MCP handler explicitly sets `origin: "*"` in CORS configuration
- Files: `apps/api/src/mcp-server/server.ts:264`
- Current mitigation: Bearer token authentication required on every request; origin is less critical when bearer token needed
- Recommendations: Document that this is intentional for MCP Inspector compatibility; add configuration option to restrict origins in production; monitor for token leakage via referrer headers

**Authorization Token in URL:**

- Risk: Authorization token passed in bearer header instead of requiring secure transport
- Files: `apps/api/src/threads/util/thread-mcp-handlers.ts` (uses tokens from database)
- Current mitigation: Tokens stored encrypted in database; not exposed in logs or responses
- Recommendations: Ensure HTTPS-only enforcement at infrastructure layer; add token expiration validation; rotate tokens on suspicious patterns

**Provider Key Encryption:**

- Risk: Provider keys (OAuth, API keys) encrypted but decryption key centralized
- Files: `packages/core/src/oauth.ts` (uses `decryptProviderKey`)
- Current mitigation: Encryption at rest; key access limited to service layer
- Recommendations: Implement key rotation strategy; audit access to decryption key; consider HSM integration for sensitive deployments

## Scaling Limits

**Streaming Message Accumulation:**

- Current capacity: Queue-based streaming with in-memory buffering
- Limit: Large message volumes or slow consumers cause memory pressure; no backpressure visible
- Scaling path: Implement streaming resume with checkpoints; add queue persistence; implement consumer flow control

**MCP Server Connection Pool:**

- Current capacity: One MCP client per server per request
- Limit: High concurrency with many MCP servers creates connection overhead
- Scaling path: Implement MCP client connection pooling; reuse clients across requests within same thread/project

**Database Query Load During Streaming:**

- Current capacity: Each message addition is one database transaction
- Limit: High-frequency streaming (many updates per second) creates transaction load
- Scaling path: Batch message updates; defer metadata updates; use eventual consistency for non-critical fields

## Dependencies at Risk

**@modelcontextprotocol/sdk Version Constraint:**

- Risk: MCP SDK is young; breaking changes possible; monorepo tightly coupled to specific version
- Impact: Breaking MCP changes block entire service; no graceful degradation for incompatible servers
- Migration plan: Pin version explicitly; add interface wrapper around MCP types to decouple; implement MCP version negotiation

**React 18/19 Peer Dependency:**

- Risk: React SDK targets both 18 and 19; subtle hook behavior differences between versions
- Impact: Testing must cover both versions; users hitting version-specific bugs
- Migration plan: Split test matrix; document exact version compatibility; consider dropping React 18 support in next major version

## Data Integrity Concerns

**Tool Call Request Unstrictification:**

- Problem: Tool call request is "unstrictified" during streaming, modifying original type
- Files: `apps/api/src/threads/threads.service.ts:1825-1827`
- Risk: Unstrictified data used for limit checking; if unstrictification changes semantics, limits could be bypassed
- Fix: Validate that unstrictification is idempotent; add test that limit check produces same result for original and unstrictified request

**Content Part Type Filtering Without Validation:**

- Problem: Resource content filtered out silently; no validation that removed content isn't critical
- Files: `apps/api/src/threads/util/thread-mcp-handlers.ts:88-96`
- Risk: Content type assumptions change in future; silently dropping could break LLM context
- Fix: Add explicit test for each content type; document why each type is kept/filtered; add metrics for filtered content

---

_Concerns audit: 2026-02-11_
