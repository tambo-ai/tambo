# Requirements: Magic CLI Init

**Defined:** 2026-02-11
**Core Value:** The CLI should feel magic — run one command and your app is Tambo-enabled with the right components registered, tools created, and a working chat widget, all tailored to what's actually in the codebase.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Client Core SDK

- [ ] **SDK-01**: Developer can create a TamboClient instance with API key and base URL
- [ ] **SDK-02**: Developer can create, list, get, and delete threads via client
- [ ] **SDK-03**: Developer can send messages to a thread and receive responses
- [ ] **SDK-04**: Developer can stream responses in real-time via SSE
- [ ] **SDK-05**: Developer can define tools with schemas and register them with the client
- [ ] **SDK-06**: Client handles tool call/result loop automatically (send tool results back, get next response)
- [ ] **SDK-07**: Client retries failed requests with exponential backoff
- [ ] **SDK-08**: Client recovers from dropped streaming connections
- [ ] **SDK-09**: All public APIs have full TypeScript types with inference

### Codebase Analysis

- [ ] **SCAN-01**: CLI detects React framework in use (Next.js, Vite, Remix, CRA)
- [ ] **SCAN-02**: CLI detects TypeScript vs JavaScript configuration
- [ ] **SCAN-03**: CLI detects project structure (src/, app/, pages/, components/)
- [ ] **SCAN-04**: CLI detects existing providers in layout/root files
- [ ] **SCAN-05**: CLI identifies existing React components that could be made AI-controllable (interactables)
- [ ] **SCAN-06**: CLI identifies existing functions/API calls that could become Tambo tools
- [ ] **SCAN-07**: CLI detects package manager in use (npm, yarn, pnpm, bun)

### Plan Generation

- [ ] **PLAN-01**: Model generates installation plan based on codebase analysis
- [ ] **PLAN-02**: Plan recommends specific components to register with Tambo
- [ ] **PLAN-03**: Plan recommends tools to create from detected functions/APIs
- [ ] **PLAN-04**: Plan recommends interactables to integrate into existing components
- [ ] **PLAN-05**: Each recommendation includes rationale explaining WHY it was suggested
- [ ] **PLAN-06**: Each recommendation includes confidence score

### User Confirmation

- [ ] **CONF-01**: CLI presents full plan as a batch checklist via simple prompts
- [ ] **CONF-02**: User can select/deselect individual items from the plan
- [ ] **CONF-03**: CLI shows unified diffs for each file change before execution
- [ ] **CONF-04**: CLI supports `--yes` flag for non-interactive mode

### Code Execution

- [ ] **EXEC-01**: Model executes confirmed changes via tool calls (edit_file, create_file)
- [ ] **EXEC-02**: CLI installs required dependencies using detected package manager
- [ ] **EXEC-03**: Result: TamboProvider added to root layout
- [ ] **EXEC-04**: Result: Selected components registered with Tambo
- [ ] **EXEC-05**: Result: Tool definitions generated and registered
- [ ] **EXEC-06**: Result: Working chat widget added to the app
- [ ] **EXEC-07**: Result: Interactables integrated into existing components
- [ ] **EXEC-08**: CLI verifies setup after execution (files exist, imports valid)
- [ ] **EXEC-09**: CLI displays clear error messages with suggested fixes on failure

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Resilience

- **RESL-01**: Undo/rollback capability (git snapshot before changes)
- **RESL-02**: Incremental setup (handle re-running init on existing installation)
- **RESL-03**: Auto-fix for common setup errors (dependency conflicts, import paths)

### Advanced

- **ADV-01**: Dry-run mode (`--dry-run` flag for preview without execution)
- **ADV-02**: Setup health check command (`tambo doctor`)
- **ADV-03**: Migration from manual Tambo setup to managed setup
- **ADV-04**: Progressive disclosure (simple flow first, advanced options on request)

## Out of Scope

| Feature                           | Reason                                                          |
| --------------------------------- | --------------------------------------------------------------- |
| Modifying @tambo-ai/react SDK     | client-core is new; react-sdk refactor to use it is future work |
| Rich TUI (ink-style)              | Simple prompts sufficient; avoids heavy dependency              |
| Non-React frameworks              | React only for v1; Vue/Svelte/etc later                         |
| Auto-execute without confirmation | Violates user trust — always show plan first                    |
| Multi-agent coordination          | Single agent loop is simpler and more reliable                  |
| Offline codebase analysis         | Cloud API required for model inference                          |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement               | Phase | Status |
| ------------------------- | ----- | ------ |
| (populated by roadmapper) |       |        |

**Coverage:**

- v1 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30 ⚠️

---

_Requirements defined: 2026-02-11_
_Last updated: 2026-02-11 after initial definition_
