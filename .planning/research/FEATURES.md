# Feature Landscape

**Domain:** AI-powered CLI init/setup tools
**Researched:** 2026-02-11
**Confidence:** HIGH

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature                         | Why Expected                                                                                                           | Complexity | Notes                                                                                                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Codebase Detection**          | Users expect tool to understand their framework (Next.js, Vite, Remix, CRA) and project structure (src/, app/, pages/) | Medium     | shadcn uses getProjectType to detect Next.js router type and folder structure. Should detect TypeScript, package manager, existing providers. **Critical for plan quality.**                                          |
| **Interactive Plan Review**     | Users need to see what will happen before it happens. Universal pattern in AI coding tools.                            | Low        | Claude Code uses Plan Mode (read-only analysis → plan → user approval → execute). Aider shows diffs before applying. V0 generates preview. **Never auto-execute without user confirmation.**                          |
| **Diff Display Before Changes** | Users need to see exact file changes (unified diff format) before they're applied                                      | Medium     | Aider shows search/replace blocks. Cursor shows inline diffs. Standard expectation from git workflows. Format: unified diff with context lines.                                                                       |
| **Batch Confirmation**          | Users expect to review all changes at once, not confirm each file individually                                         | Medium     | Pattern: show checklist → user reviews → confirm batch → execute all. CLI tools use `--yes` flags for automation. Present as scannable checklist with expand/collapse.                                                |
| **Undo/Rollback Capability**    | Users need escape hatch if init goes wrong                                                                             | High       | Git integration standard (Aider commits each change). AgentOps provides rollback for production agents. Refact Agent has conversation-scoped rollback. **Minimum: git integration. Better: snapshot before changes.** |
| **Non-Interactive Mode**        | CI/CD and scripts need `--yes`/`--skip-prompts` flag to run without interaction                                        | Low        | create-next-app, Vite all support `--yes`. Standard for any CLI tool that prompts. **Required for adoption in automated workflows.**                                                                                  |
| **Error Recovery Guidance**     | When operations fail, users expect clear messages and suggested fixes                                                  | Medium     | Modern CLIs provide auto-fix suggestions with confidence scores (0.8+ = auto-apply). AWS/Azure CLIs document common errors. **Must show actionable next steps, not just stack traces.**                               |
| **Dependency Installation**     | Users expect CLI to install required packages (provider, client, etc.)                                                 | Low        | All framework CLIs handle this. Detection of package manager (npm/yarn/pnpm/bun) required. Handle peer dependency conflicts gracefully.                                                                               |
| **Post-Install Verification**   | Users need confirmation that setup actually worked                                                                     | Medium     | Smoke tests verify critical functionality. Docker-based installers verify CLI availability. **Minimum: check files exist, imports valid. Better: run smoke test.**                                                    |
| **Incremental Setup**           | Users may run init multiple times, should handle existing installations gracefully                                     | Medium     | shadcn's `--overwrite` flag. Detection of existing Tambo setup, offer to update vs fresh install. **Don't break existing config.**                                                                                    |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature                                         | Value Proposition                                                                                         | Complexity | Notes                                                                                                                                                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-Powered Component Recommendations**        | Suggests which Tambo components to add based on detected UI patterns (forms, dashboards, chat interfaces) | High       | Analyze existing React components to find integration opportunities. Differentiated from shadcn's manual selection. **Uses LLM for codebase understanding.** Example: detects form libraries → recommends useForm tool integration. |
| **Auto-Detection of Integration Opportunities** | Finds existing functions/APIs that could become Tambo tools without user having to think about it         | High       | Scans codebase for candidate functions (API calls, data fetchers, form handlers). Presents as "Found 5 functions that could be tools". **Reduces activation energy, speeds time-to-value.**                                         |
| **Interactable Auto-Discovery**                 | Identifies existing UI components that could be made interactable (buttons, forms, data tables)           | High       | Pattern recognition for common component types. Suggests minimal code changes to add onClick={assignInteractable}. **Makes existing UIs instantly AI-controllable.**                                                                |
| **Multi-Step Plan with Rationale**              | Shows not just what will happen, but WHY each step matters                                                | Medium     | Cursor's Plan Mode includes reasoning. Claude Code explains plan steps. Format: "1. Add TamboProvider to layout.tsx - Required for all Tambo hooks to function". **Builds user confidence in AI recommendations.**                  |
| **Dry-Run Mode**                                | Full simulation showing file changes without writing anything                                             | Low        | Standard CLI pattern (`--dry-run`). Shows unified diffs for all changes. Let users preview everything. **Low complexity, high value for trust building.**                                                                           |
| **Progressive Disclosure**                      | Start with simple questions, reveal advanced options only when needed                                     | Medium     | Avoid overwhelming users. Pattern: basic setup → "Want to customize?" → advanced options. shadcn uses this approach. **Improves activation for new users.**                                                                         |
| **Confidence Scoring for Recommendations**      | Show confidence level for each auto-detected integration opportunity                                      | Medium     | "High confidence: UserProfile component → could be interactable (85%)". Users can filter by confidence. **Transparency reduces AI skepticism.**                                                                                     |
| **Auto-Fix for Common Setup Errors**            | When setup fails, automatically tries known fixes (dependency conflicts, import paths)                    | High       | Modern recovery systems use confidence scoring (0.8+ = auto-apply). Falls back to suggestions for <0.8 confidence. **Reduces support burden.**                                                                                      |
| **Setup Health Check Command**                  | Post-setup `tambo doctor` command that validates entire installation                                      | Medium     | Checks: provider mounted, components registered, API key valid, tools callable. Reports actionable fixes. **Reduces "it doesn't work" support tickets.**                                                                            |
| **Migration from Manual Setup**                 | Detects manual Tambo installation, offers to upgrade to managed setup                                     | High       | Scans for manual provider code, existing tools. Preserves user customizations. **Critical for existing users upgrading.**                                                                                                           |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature                                   | Why Avoid                                                                                         | What to Do Instead                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Auto-Execute Without Confirmation**          | Violates user trust. AI coding tools that auto-modify code without approval face severe backlash. | Always show plan first. Require explicit confirmation. Support `--yes` for automation only.                 |
| **Opaque AI Decision Making**                  | Users distrust black-box recommendations. "The AI decided to add these components" fails.         | Show reasoning. Explain WHY each recommendation. Provide confidence scores. Let users understand logic.     |
| **Over-Engineering Initial Setup**             | Adding 20 components and 50 tools on first init overwhelms users and hides value.                 | Start minimal. Recommend 2-3 components max. Show path to add more later. Progressive value delivery.       |
| **Modifying User Code Without Markers**        | Changes to user files should be clearly marked so they can find/remove them later.                | Add comments: `// Added by tambo init`. Use consistent formatting. Document all changes in summary.         |
| **Silent Failures**                            | Swallowing errors or falling back silently masks issues and creates mysterious bugs.              | Fail loudly with clear messages. Never use silent fallbacks for critical operations. Validate at each step. |
| **Requiring Cloud Connection for Local Setup** | Init should work offline after initial auth. Cloud dependency blocks local dev.                   | Cloud for templates/registry only. All analysis/modification runs locally. Cache templates.                 |
| **One-Size-Fits-All Recommendations**          | Recommending same components to every project ignores context.                                    | Analyze actual codebase. Tailor to detected patterns. Show why recommendation fits their use case.          |
| **Breaking Changes to Generated Code**         | Once init runs, changing output format breaks existing users.                                     | Version output. Clear deprecation path. Never change file structure without major version bump.             |

## Feature Dependencies

```
Codebase Detection → AI-Powered Component Recommendations
Codebase Detection → Auto-Detection of Integration Opportunities
Codebase Detection → Interactable Auto-Discovery

Interactive Plan Review → Multi-Step Plan with Rationale
Interactive Plan Review → Confidence Scoring for Recommendations
Interactive Plan Review → Dry-Run Mode

Dependency Installation → Post-Install Verification
Dependency Installation → Setup Health Check Command

Error Recovery Guidance → Auto-Fix for Common Setup Errors

Incremental Setup → Migration from Manual Setup
```

## MVP Recommendation

### Phase 1: Core Init Flow (Must Ship)

Prioritize table stakes that build trust and enable basic workflow:

1. **Codebase Detection** - Detect framework, TypeScript, folder structure, existing providers
2. **Interactive Plan Review** - Show checklist of changes before execution
3. **Diff Display Before Changes** - Unified diffs for every file modification
4. **Batch Confirmation** - Single approval for all changes
5. **Dependency Installation** - Install @tambo-ai/react, @tambo-ai/client-core with correct package manager
6. **Post-Install Verification** - Verify files created, imports valid
7. **Error Recovery Guidance** - Clear error messages with next steps
8. **Non-Interactive Mode** - `--yes` flag for CI/CD

**Rationale:** These features create minimum viable trust. Users can see what will happen, approve it, execute it, and verify it worked. Without these, users won't trust AI to touch their codebase.

### Phase 2: Intelligence Layer (Differentiation)

Add AI-powered recommendations that provide unique value:

1. **Multi-Step Plan with Rationale** - Explain why each step matters
2. **Progressive Disclosure** - Simple flow for basic setup, advanced options hidden
3. **Dry-Run Mode** - `--dry-run` flag for full preview without execution

**Rationale:** Phase 1 builds trust through transparency. Phase 2 leverages that trust to showcase AI intelligence in understanding codebase and making smart recommendations.

### Phase 3: Advanced Intelligence (Competitive Moat)

Ship features competitors can't easily replicate:

1. **AI-Powered Component Recommendations** - Suggest components based on detected patterns
2. **Auto-Detection of Integration Opportunities** - Find functions that could be tools
3. **Interactable Auto-Discovery** - Identify UI components to make interactable
4. **Confidence Scoring for Recommendations** - Transparent AI reasoning

**Rationale:** Generic init tools can't do this - requires deep understanding of Tambo's component model AND React codebases. High complexity, high value.

### Defer to Post-MVP

**Defer:**

- **Undo/Rollback Capability** - Git integration sufficient initially. Advanced rollback can wait. (HIGH complexity, MEDIUM value for MVP)
- **Incremental Setup** - Handle with `--overwrite` flag initially. Smart merging later. (MEDIUM complexity, LOW value until users run init twice)
- **Migration from Manual Setup** - Only valuable after existing user base. (HIGH complexity, ZERO value at launch)
- **Auto-Fix for Common Setup Errors** - Start with clear error messages. Add auto-fix based on real support tickets. (HIGH complexity, speculative value)
- **Setup Health Check Command** - Defer to separate `tambo doctor` command post-MVP. (MEDIUM complexity, MEDIUM value)

## Headless Client SDK Features

The @tambo-ai/client-core SDK needs different feature set than CLI:

### Table Stakes for Headless SDK

- Thread management (create, list, get, delete)
- Message management (send, stream, history)
- Tool execution handling (define tools, handle callbacks)
- Streaming support (Server-Sent Events, real-time responses)
- Error handling (retry logic, connection recovery)
- TypeScript types (full type safety, inference)

### Differentiators for Headless SDK

- Framework-agnostic (works in Node.js, browser, edge runtimes)
- Streaming primitives (async iterators, event emitters, callbacks - multiple patterns)
- Automatic reconnection (streaming resilience)
- Request/response correlation (track tool calls across stream)
- Built-in caching (thread/message cache for offline)

**Note:** SDK features are standard for API clients. Innovation is in API design (how Tambo structures threads/tools/interactables), not client implementation. SDK should be boring, reliable, typed.

## Implementation Complexity Notes

**Low Complexity:** Standard CLI patterns, existing libraries, well-documented
**Medium Complexity:** Custom logic required, multiple integration points, testing needed
**High Complexity:** AI/LLM integration, complex state management, extensive edge cases

## Validation Strategy

**Table Stakes:** Test against competitor CLIs (shadcn, create-next-app, Cursor). If they have it, we need it.

**Differentiators:** Prototype with 3-5 real codebases. Measure:

- Time to first successful init
- User confidence in recommendations
- False positive rate (bad suggestions)
- Value perception vs generic init

**Anti-Features:** Each anti-feature represents failure mode observed in AI coding tools. Review competitor complaints, GitHub issues, user feedback.

## Sources

This research is based on 2026 state-of-the-art for AI coding tools and CLI best practices:

- [Cursor CLI Updates January 2026](https://www.theagencyjournal.com/cursors-cli-just-got-a-whole-lot-smarter-fresh-updates-from-last-week/)
- [V0 vs Cursor: Best AI code generator comparison for 2026](https://blog.tooljet.com/v0-vs-cursor/)
- [shadcn CLI documentation](https://ui.shadcn.com/docs/cli)
- [shadcn-ui codebase analysis](https://medium.com/@ramu.narasinga_61050/shadcn-ui-ui-codebase-analysis-how-does-shadcn-ui-cli-work-part-3-1-834007e6f0b2)
- [The 2026 Guide to Coding CLI Tools: 15 AI Agents Compared](https://www.tembo.io/blog/coding-cli-tools-comparison)
- [Top 5 CLI coding agents in 2026](https://pinggy.io/blog/top_cli_based_ai_coding_agents/)
- [Code Surgery: How AI Assistants Make Precise Edits to Your Files](https://fabianhertwig.com/blog/coding-assistants-file-edits/)
- [Getting Started: Installation | Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [CLI: create-next-app | Next.js](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- [Getting Started | Vite](https://vite.dev/guide/)
- [Aider - AI Pair Programming in Your Terminal](https://aider.chat/)
- [Usage | aider](https://aider.chat/docs/usage.html)
- [Git integration | aider](https://aider.chat/docs/git.html)
- [Claude Code Tutorial for Beginners - Complete 2026 Guide](https://codewithmukesh.com/blog/claude-code-for-beginners/)
- [Claude Code Complete Guide 2026](https://www.jitendrazaa.com/blog/ai/claude-code-complete-guide-2026-from-basics-to-advanced-mcp-2/)
- [Plan-Driven Development | Claude Code Guide](https://deepwiki.com/FlorianBruniaux/claude-code-ultimate-guide/9.1-plan-driven-development)
- [DCG: Destructive Command Guard — Safety Philosophy](https://reading.torqsoftware.com/notes/software/ai-ml/safety/2026-01-26-dcg-destructive-command-guard-safety-philosophy-design-principles/)
- [AI agent security: the complete enterprise guide for 2026](https://www.mintmcp.com/blog/ai-agent-security)
- [Command Line Interface Guidelines](https://clig.dev/)
- [Progressive Disclosure - NN/G](https://www.nngroup.com/articles/progressive-disclosure/)
- [Progressive Disclosure Guidelines | Claude Skills CLI](https://deepwiki.com/spences10/claude-skills-cli/5.3-progressive-disclosure-guidelines)
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [OpenAI SDK vs Vercel AI SDK: Which Should You Choose in 2026](https://strapi.io/blog/openai-sdk-vs-vercel-ai-sdk-comparison)
- [Versioning, Rollback & Lifecycle Management of AI Agents](https://medium.com/@nraman.n6/versioning-rollback-lifecycle-management-of-ai-agents-treating-intelligence-as-deployable-deac757e4dea)
- [Agent Rollback | Refact Documentation](https://docs.refact.ai/features/autonomous-agent/rollback/)
- [What is Smoke Testing [2026]](https://www.browserstack.com/guide/smoke-testing)
- [Smoke Testing in 2026: Essential QA Guide](https://blog.qasource.com/a-complete-guide-to-smoke-testing-in-software-qa)
- [React Frameworks in 2026: Next.js vs Remix vs React Router 7](https://medium.com/@pallavilodhi08/react-frameworks-in-2026-next-js-vs-remix-vs-react-router-7-b18bcbae5b26)
- [React Stack Patterns](https://www.patterns.dev/react/react-2026/)
