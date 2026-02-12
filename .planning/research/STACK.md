# Technology Stack

**Project:** Tambo Magic CLI Init
**Researched:** 2026-02-11

## Recommended Stack

### Core Framework - Headless API Client (@tambo-ai/client-core)

| Technology         | Version | Purpose                    | Why                                                                                                                                                                                                                                                                           |
| ------------------ | ------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ofetch             | ^1.5.1  | HTTP client with streaming | Better fetch wrapper - works everywhere (Node.js, browser, workers), smart JSON parsing with destr, automatic error handling, built-in retry logic, TypeScript-first, zero dependencies. Superior to axios for modern TypeScript projects and smaller bundle size than axios. |
| eventsource-parser | ^3.0.6  | SSE stream parsing         | Industry standard for parsing server-sent events. Source-agnostic design works with any data source. Dual API (callback-based + TransformStream). Used by 8.7M+ weekly downloads including major AI SDKs. Full EventSource spec compliance.                                   |
| zod                | ^4.3.6  | Runtime validation         | TypeScript-first validation that bridges compile-time types and runtime validation. Use safeParse() for error handling, validates at trust boundaries (API responses, user input), enables schema-first approach with type inference. Current as of January 2026.             |

### Agent Loop & Tool Execution (CLI package)

| Technology     | Version | Purpose                     | Why                                                                                                                                                                                                                                                          |
| -------------- | ------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| @clack/prompts | ^1.0.0  | Interactive CLI prompts     | Modern CLI prompt library that just hit 1.0.0 (published 15 days ago). 80% smaller than inquirer, better UX with intro/outro/spinner, isCancel for CTRL+C detection, consistent styling. Widely adopted (3,811 projects). Replace inquirer for new features. |
| execa          | ^9.6.1  | Shell command execution     | Process execution for humans. Promise-based API, template string syntax, cross-platform, no shell injection risk, clean error reporting. v9 is the latest major release. Superior to child_process for programmatic usage.                                   |
| ts-morph       | ^27.0.2 | AST analysis & manipulation | TypeScript Compiler API wrapper for static analysis and code changes. Already in use in CLI package. Enables parsing TypeScript/JavaScript codebases, navigating AST, programmatic refactoring. 3,286 projects using it. Essential for codebase analysis.    |

### File System & Pattern Matching

| Technology  | Version | Purpose               | Why                                                                                                                                                                                                                                   |
| ----------- | ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| globby      | ^13.2.1 | File pattern matching | User-friendly glob matching based on fast-glob. Auto-respects .gitignore files, Promise API, TypeScript support. Updated 4 days ago (Feb 2026). Slightly slower than fast-glob but adds critical conveniences like gitignore support. |
| ignore      | latest  | .gitignore parsing    | Manager and filter for .gitignore rules. Used by eslint, gitbook, and many others. Essential for respecting user's gitignore when analyzing codebase.                                                                                 |
| fs/promises | native  | File operations       | Use native Node.js fs/promises instead of fs-extra. Node.js 22+ has comprehensive async file APIs. No additional dependency needed.                                                                                                   |

### Terminal UI

| Technology | Version | Purpose                    | Why                                                                                                                                                                                                                                                                                   |
| ---------- | ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| picocolors | ^1.1.1  | Terminal colors            | 14x smaller and 2x faster than chalk. Used by PostCSS, SVGO, Stylelint. Zero dependencies, TypeScript types included, cross-platform. Despite last release being 1 year ago, it's stable and complete. For new code, prefer picocolors; keep chalk for existing CLI code consistency. |
| chalk      | ^5.6.0  | Terminal colors (existing) | Already in CLI package. Keep for consistency in existing code, but use picocolors for new client-core and agent loop code.                                                                                                                                                            |

## Alternatives Considered

| Category        | Recommended                         | Alternative        | Why Not                                                                                                                                                                                                                                        |
| --------------- | ----------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP Client     | ofetch                              | axios              | Axios adds unnecessary weight (304KB vs 15KB). ofetch has better TypeScript support, works in all environments, and has smart JSON parsing. Axios only wins if you need complex interceptors or HTTP/2. For AI API client, ofetch is superior. |
| HTTP Client     | ofetch                              | ky                 | Ky targets browsers primarily. ofetch works everywhere (Node.js, browser, workers) via conditional exports and automatic polyfills. Better for a package that needs universal compatibility.                                                   |
| HTTP Client     | ofetch                              | native fetch       | Native fetch requires manual error handling, retry logic, base URL management, and JSON parsing. ofetch wraps fetch with sensible defaults.                                                                                                    |
| SSE Parser      | eventsource-parser                  | native EventSource | EventSource is browser-only. eventsource-parser works everywhere and handles partial chunks correctly for streaming.                                                                                                                           |
| SSE Parser      | eventsource-parser                  | sse-js/client-kit  | eventsource-parser has 8.7M weekly downloads vs minimal adoption of alternatives. Battle-tested by major AI SDK implementations.                                                                                                               |
| Validation      | zod                                 | TypeScript only    | TypeScript provides compile-time safety but cannot validate untrusted runtime data (API responses, user input). Zod validates at trust boundaries.                                                                                             |
| CLI Prompts     | @clack/prompts                      | inquirer           | inquirer is larger, older API. Clack is modern, 80% smaller, better DX, just hit stable 1.0.0. For new features, clack is the current best practice.                                                                                           |
| Shell Execution | execa                               | child_process      | child_process requires manual promise wrapping, escaping, error handling. execa provides modern API with template strings, no shell injection risk.                                                                                            |
| Glob Matching   | globby                              | fast-glob          | fast-glob is faster but doesn't auto-respect .gitignore. For codebase analysis, respecting gitignore is critical. Performance difference negligible for CLI use case.                                                                          |
| Glob Matching   | globby                              | node-glob          | globby is faster and has better API. node-glob is legacy approach.                                                                                                                                                                             |
| Colors          | picocolors (new) + chalk (existing) | chalk everywhere   | Picocolors is 14x smaller and 2x faster. But chalk is already in CLI package. Use picocolors for new packages to reduce bundle size.                                                                                                           |
| File Operations | fs/promises                         | fs-extra           | Node.js 22+ has native Promise-based fs operations. fs-extra adds methods like ensureDir and copy, but modern fs.mkdir with recursive: true and manual copy implementations are cleaner than adding a dependency.                              |

## Installation

### New Package: @tambo-ai/client-core

```bash
# Core dependencies
npm install ofetch eventsource-parser zod

# Dev dependencies
npm install -D @types/node typescript
```

### Existing Package: cli

```bash
# Add to existing CLI package
npm install @clack/prompts execa globby ignore picocolors

# Already installed (no action needed)
# - ts-morph (^27.0.2)
# - chalk (^5.6.0)
```

## Architecture Recommendations

### 1. Package Structure

Create `packages/client-core/` (not `apps/client-core/`) because it's a library, not an application.

```
packages/
  client-core/
    src/
      client.ts          # Main TamboClient class
      streaming.ts       # SSE streaming utilities
      types.ts           # Zod schemas + inferred types
      errors.ts          # Custom error classes
      index.ts           # Public exports
    package.json
    tsconfig.json
```

### 2. Streaming Architecture

Use ofetch for requests + eventsource-parser for SSE:

```typescript
// Streaming response handler
async function* streamMessages(response: Response) {
  const parser = createParser({
    onEvent: (event) => {
      // Handle parsed SSE events
    },
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    parser.feed(chunk);
  }
}
```

### 3. Validation Strategy

Use Zod at trust boundaries (API responses), TypeScript everywhere else:

```typescript
// Define schemas
const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(["user", "assistant"]),
});

// Infer types
type Message = z.infer<typeof MessageSchema>;

// Validate at boundary
const response = await client.get("/messages");
const result = MessageSchema.safeParse(response);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

### 4. CLI Agent Loop

Use @clack/prompts for UX, execa for command execution:

```typescript
import { intro, outro, confirm, spinner } from "@clack/prompts";
import { execa } from "execa";

// Show intro
intro("Tambo Magic Init");

// Display changes as checklist
const shouldApply = await confirm({
  message: "Apply these changes?",
});

// Execute with spinner
const s = spinner();
s.start("Applying changes");
await execa`git add .`;
s.stop("Changes applied");

outro("Done!");
```

### 5. Codebase Analysis

Use ts-morph + globby + ignore:

```typescript
import { Project } from "ts-morph";
import { globby } from "globby";
import ignore from "ignore";
import { readFile } from "fs/promises";

// Load gitignore
const gitignoreContent = await readFile(".gitignore", "utf-8");
const ig = ignore().add(gitignoreContent);

// Find TypeScript files
const files = await globby("**/*.{ts,tsx}", {
  ignore: ["node_modules/**", "dist/**"],
  gitignore: true, // Auto-respects .gitignore
});

// Filter through ignore
const filteredFiles = files.filter((file) => !ig.ignores(file));

// Analyze with ts-morph
const project = new Project();
for (const file of filteredFiles) {
  const sourceFile = project.addSourceFileAtPath(file);
  // Analyze AST...
}
```

## Confidence Assessment

| Technology         | Confidence | Evidence                                                                                                                                          |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| ofetch             | HIGH       | Official npm page, GitHub releases, UnJS documentation. Version 1.5.1 published 3 months ago. Widely adopted in modern TypeScript projects.       |
| eventsource-parser | HIGH       | npm stats (8.7M weekly downloads), GitHub releases, official docs. Version 3.0.6 published 5 months ago. Industry standard for SSE parsing.       |
| zod                | HIGH       | Official docs updated for v4, npm page, version 4.3.6 published 20 days ago (Jan 2026). TypeScript validation standard in 2026.                   |
| @clack/prompts     | HIGH       | npm page, version 1.0.0 published 15 days ago (Jan 2026). Modern replacement for inquirer with strong adoption (3,811 projects).                  |
| execa              | HIGH       | GitHub releases, npm page. Version 9.6.1 published 2 months ago. Used by 16,979 projects. Process execution standard.                             |
| ts-morph           | HIGH       | npm page, GitHub releases. Version 27.0.2 published 4 months ago (Oct 2025). TypeScript AST manipulation standard. 3,286 projects.                |
| globby             | HIGH       | npm page shows 13.2.1 published 4 days ago (Feb 2026). Active maintenance, based on fast-glob with gitignore support.                             |
| ignore             | MEDIUM     | npm page shows it's widely used (by eslint, gitbook). No recent version info found, but stable and complete library.                              |
| picocolors         | MEDIUM     | npm page shows 1.1.1 published 1 year ago. Stable and complete (hasn't needed updates), but not actively developed. Widely used by PostCSS, SVGO. |
| fs/promises        | HIGH       | Native Node.js API. Node.js 22+ is requirement per AGENTS.md. Complete async fs API available.                                                    |

## Version Currency Notes

All versions verified as of February 11, 2026:

- **Recent updates (within 30 days)**: zod (4.3.6, 20 days ago), @clack/prompts (1.0.0, 15 days ago), globby (13.2.1, 4 days ago)
- **Stable recent (2-6 months)**: ofetch (1.5.1, 3 months ago), execa (9.6.1, 2 months ago), eventsource-parser (3.0.6, 5 months ago), ts-morph (27.0.2, 4 months ago)
- **Stable mature (1+ year)**: picocolors (1.1.1, 1 year ago) - no updates needed, complete library

All versions are current for 2026 development.

## Sources

### HTTP Client & Streaming

- [ofetch - npm](https://www.npmjs.com/package/ofetch)
- [ofetch · Packages · UnJS](https://unjs.io/packages/ofetch/)
- [GitHub - unjs/ofetch](https://github.com/unjs/ofetch)
- [eventsource-parser - npm](https://www.npmjs.com/package/eventsource-parser)
- [GitHub - rexxars/eventsource-parser](https://github.com/rexxars/eventsource-parser)
- [Using server-sent events - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [How to Stream Updates with Server-Sent Events in Node.js](https://oneuptime.com/blog/post/2026-01-24-nodejs-server-sent-events/view)
- [Axios vs Fetch: Which is Best for HTTP Requests](https://apidog.com/blog/axios-vs-fetch/)
- [GitHub - sindresorhus/ky](https://github.com/sindresorhus/ky)

### Validation

- [zod - npm](https://www.npmjs.com/package/zod)
- [Intro | Zod](https://zod.dev/)
- [How to Validate Data with Zod in TypeScript](https://oneuptime.com/blog/post/2026-01-25-zod-validation-typescript/view)
- [TypeScript vs Zod: Clearing up validation confusion - LogRocket Blog](https://blog.logrocket.com/when-use-zod-typescript-both-developers-guide/)

### CLI Tools

- [@clack/prompts - npm](https://www.npmjs.com/package/@clack/prompts)
- [Elevate Your CLI Tools with @clack/prompts](https://www.blacksrc.com/blog/elevate-your-cli-tools-with-clack-prompts)
- [How to create a cli with clack](https://pheralb.dev/post/clack-prompts)
- [execa - npm](https://www.npmjs.com/package/execa)
- [GitHub - sindresorhus/execa](https://github.com/sindresorhus/execa)
- [A Practical Guide to Execa for Node.js](https://betterstack.com/community/guides/scaling-nodejs/execa-cli/)

### AST & File Matching

- [ts-morph - npm](https://www.npmjs.com/package/ts-morph)
- [ts-morph - Documentation](https://ts-morph.com/)
- [GitHub - dsherret/ts-morph](https://github.com/dsherret/ts-morph)
- [AST-based refactoring with ts-morph](https://kimmo.blog/posts/8-ast-based-refactoring-with-ts-morph/)
- [globby - npm](https://www.npmjs.com/package/globby)
- [GitHub - sindresorhus/globby](https://github.com/sindresorhus/globby)
- [ignore - npm](https://www.npmjs.com/package/ignore)

### Terminal Styling

- [picocolors - npm](https://www.npmjs.com/package/picocolors)
- [GitHub - alexeyraspopov/picocolors](https://github.com/alexeyraspopov/picocolors)
- [Using console colors with Node.js - LogRocket Blog](https://blog.logrocket.com/using-console-colors-node-js/)

### Agent Frameworks (context/patterns only)

- [OpenAI Agents SDK TypeScript](https://openai.github.io/openai-agents-js/)
- [Quickstart - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/quickstart)
- [Claude Agent SDK Complete Tutorial](https://blog.wenhaofree.com/en/posts/articles/claude-agent-sdk-tutorial/)
- [GitHub - mastra-ai/mastra](https://github.com/mastra-ai/mastra)
