# Memory for Tambo: V1 Proposal

## Problems

### The user experience problem

**Nothing persists between conversations.** Users have to re-explain who they are, what they're working on, and what they prefer every time they start a new thread. Facts shared in one conversation don't carry to the next. The AI never learns or adapts — every interaction feels like talking to a stranger. For example, a message like "what restaurants in the area would I like?" will not show anything based on the user's particular preferences unless the developer has custom-built a tool to enable it.

### The developer problem

Developers want to solve this for their users, but Tambo gives them no primitives for it. Today, a developer who wants memory has to: pick a storage backend, decide what to extract, write extraction logic, build retrieval, inject context into the prompt, manage staleness and deduplication, handle scoping per end-user.

---

## What Memory Means in This Context

Memory is **persistent, retrievable knowledge that outlives a single thread or run.** It includes:

- **Facts** the AI learns about the user ("works at Acme Corp", "prefers TypeScript")
- **Preferences** expressed or inferred ("likes concise responses", "always wants error handling")
- **Conversation summaries** from prior threads
- **Developer-defined context** that should persist ("this user is on the Pro plan", "their team uses PostgreSQL")

Memory is NOT:

- The current thread's message history (that's already handled)
- Component state within a thread (that's `useTamboComponentState`)
- Static configuration (that's project custom instructions)

---

## Scope

### In scope for V1

1. **Works out of the box.** Memory works with zero configuration. Opt-out, not opt-in.
2. **Scoped to contextKey.** Memory isolates per end-user automatically. Developers don't have to think about multi-tenancy.
3. **Developers can disable it.** A project-level setting turns memory off entirely.
4. **Cross-thread.** Facts learned in one thread are available in another for the same contextKey.
5. **Respects token limits.** Never injects so much memory that it crowds out the conversation or tool definitions.

### Later

- Automatic shared memory across contextKeys (memory at the project level). We will need to consider whether this is just for observability, or whether it should affect responses like per-user memory, and what security issues might come up.
- Advanced configuration:
  - how much of the context to allocate to memories
  - specific users to turn memories off for
  - max memories per user
  - instructions about what types of memories to ignore
  - how long memories live
- Developers can plug in their own memory system.
- Access/observability of a project's memories. Maybe:
  - UI for semantic search over memories
  - Memory importance scoring and automatic pruning
  - React hook for client-side memory access (`useTamboMemory`)
  - Memory analytics (what's being remembered, retrieval frequency)

---

## High-Level Implementation Thoughts

All memory logic lives server-side in the Tambo API (V1 routes). The client sends context as it does today. Client-side configuration is deferred to a future version.

Rather than building memory storage and retrieval from scratch, we can use an existing external service like Mem0, Zep, or similar. They handle the logic to understand what stored memories are relevant given the current conversation, and how to store new memories considering things like conflict resolution.

There are two main jobs for the memory system:

1. **Retrieve and inject** — before sending a request to the LLM, pull relevant memories for this user and add them to the context so the model knows what it's already learned.
2. **Extract and save** — after a request completes, figure out if anything worth remembering was said and persist it for next time.

### Retrieval: how memories get into the prompt

During a run, after messages are loaded from the DB but before the LLM call, Tambo calls the memory service with the project ID, context key, and the latest user message. The service returns relevant memories as a list of facts. Tambo appends these to the existing system prompt so the model has them as context for the conversation. Skip if project has disabled memory.

---

### Extraction: how memories get stored

After a run completes and `RUN_FINISHED` is emitted, Tambo sends the latest messages to the memory service in the background (fire-and-forget). The service extracts anything worth remembering and stores it. We will need to decide whether only user messages are sent, and how often these are sent (after each run? Or on some async timer?). Skip if project has disabled memory.

---

### Future: bring-your-own memory service

In future we can decide to enable developers to bring their own memory service rather than use Tambo's built-in. Here are some ways we could handle that:

- **Server-side webhook.** Tambo calls the developer's memory service HTTP API directly during the run lifecycle, configured at the project level with retrieve/store URLs and auth credentials.
- **MCP server.** Developer configures their memory service as an MCP server. The model calls memory tools during the conversation.
- **Developer-managed via run API.** Developers call their service themselves and pass pre-retrieved memories via a new `memories` field on the run DTO. Tambo just injects whatever it receives.

---

## Open Questions

1. **Memory service selection** - Which external service do we integrate with first? Mem0 and Zep support these initial basic features. Zep is something like $1 per 1000 messages. Mem0 is $250 for 50,000 per month, higher than that needs enterprise pricing.

2. **Default on or off?**

3. **User Memory Access** - Should a project owner be able to see and even edit the memories stored for their users?

4. **Enable for old projects** - Is there any reason we should not enable memories for existing projects?
