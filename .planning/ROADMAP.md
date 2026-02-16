# Roadmap: Magic CLI Init

## Overview

Transform the Tambo CLI into an intelligent installation assistant by building a headless client SDK and agent orchestrator that analyzes codebases, generates intelligent recommendations, presents confirmation UI, and executes file modifications to integrate Tambo components. The journey flows from foundation (SDK protocol adapter) through intelligence (codebase analysis and AI planning) to execution (safe file modification with rollback).

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Client Core SDK** - Build headless TypeScript client for Tambo API communication
- [ ] **Phase 2: Codebase Analysis** - Detect framework, structure, and integration opportunities
- [x] **Phase 3: Plan Generation** - AI-powered recommendations with rationale and confidence scoring
- [x] **Phase 4: User Confirmation** - Interactive approval flow with diff preview
- [ ] **Phase 5: Code Execution** - Safe file modification with rollback and verification
- [ ] **Phase 6: CLI Integration** - Wire --magic flag into tambo init for intelligent initialization

## Phase Details

### Phase 1: Client Core SDK

**Goal**: Developer can interact with Tambo API through a headless TypeScript client with thread management, streaming responses, and tool execution loop.

**Depends on**: Nothing (first phase)

**Requirements**: SDK-01, SDK-02, SDK-03, SDK-04, SDK-05, SDK-06, SDK-07, SDK-08, SDK-09

**Success Criteria** (what must be TRUE):

1. Developer can create TamboClient instance with API key and make authenticated requests
2. Developer can create threads, send messages, and receive streaming responses in real-time
3. Developer can register tools with Zod schemas and client handles tool call/result loop automatically
4. Client retries failed requests and recovers from dropped streaming connections without data loss
5. All APIs are fully typed with TypeScript inference working in IDEs

**Plans:** 5 plans

Plans:

- [x] 01-01-PLAN.md — Package setup, types, TamboClient with retry logic
- [x] 01-02-PLAN.md — Thread CRUD and message sending
- [x] 01-03-PLAN.md — Refactor to use @tambo-ai/typescript-sdk + @tanstack/query-core
- [x] 01-04-PLAN.md — SSE streaming with reconnection recovery (using typescript-sdk)
- [x] 01-05-PLAN.md — Tool registry and automatic execution loop

### Phase 2: Codebase Analysis

**Goal**: CLI scans user's project and detects framework, structure, existing providers, and integration opportunities without requiring any manual configuration.

**Depends on**: Phase 1

**Requirements**: SCAN-01, SCAN-02, SCAN-03, SCAN-04, SCAN-05, SCAN-06, SCAN-07

**Success Criteria** (what must be TRUE):

1. CLI correctly identifies React framework variant (Next.js App/Pages Router, Vite, Remix, CRA) from project files
2. CLI detects TypeScript configuration, project structure patterns, and package manager in use
3. CLI locates root layout files and existing provider components automatically
4. CLI identifies existing React components that could become Tambo interactables
5. CLI identifies existing functions or API calls that could become Tambo tools

**Plans:** 3 plans

Plans:

- [x] 02-01-PLAN.md — Types, filesystem helpers, framework detection, and structure detection
- [x] 02-02-PLAN.md — AST-based provider and component detection with ts-morph
- [x] 02-03-PLAN.md — Tool candidate detection and analyzeProject() orchestrator

### Phase 3: Plan Generation

**Goal**: Model analyzes codebase scan results and generates intelligent installation plan with specific component/tool/interactable recommendations, each with rationale and confidence score.

**Depends on**: Phase 2

**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06

**Success Criteria** (what must be TRUE):

1. Model generates installation plan based on detected codebase patterns
2. Plan recommends specific components to register with clear rationale for each
3. Plan recommends tools to create from detected functions/APIs with implementation guidance
4. Plan recommends interactables to integrate with existing component paths
5. Each recommendation includes confidence score and explanation of WHY it was suggested

**Plans:** 2 plans

Plans:

- [x] 03-01-PLAN.md — Types, Zod schemas, and prompt builder
- [x] 03-02-PLAN.md — JSON extraction and generatePlan orchestrator

### Phase 4: User Confirmation

**Goal**: User reviews full installation plan as interactive checklist, previews diffs for each change, and explicitly approves before any code modification occurs.

**Depends on**: Phase 3

**Requirements**: CONF-01, CONF-02, CONF-03, CONF-04

**Success Criteria** (what must be TRUE):

1. CLI presents complete plan as batch checklist using clean prompt UI
2. User can select or deselect individual items from generated plan
3. CLI shows unified diff for each file change before execution begins
4. CLI supports non-interactive mode with --yes flag for CI/CD workflows

**Plans:** 2 plans

Plans:

- [x] 04-01-PLAN.md — Types, diff generator, and diff display utilities
- [x] 04-02-PLAN.md — Plan presenter (checklist) and confirmPlan orchestrator

### Phase 5: Code Execution

**Goal**: Model executes confirmed changes via tool calls with atomic operations, dependency installation, verification, and clear error recovery guidance.

**Depends on**: Phase 4

**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07, EXEC-08, EXEC-09

**Success Criteria** (what must be TRUE):

1. Model executes file edits and creates new files via tool calls matching approved plan
2. CLI installs required dependencies using detected package manager automatically
3. TamboProvider is added to root layout file with correct import path
4. Selected components are registered with Tambo using correct registration patterns
5. Tool definitions are generated and registered with proper schemas
6. Working chat widget is added to app with correct positioning and styling
7. Interactables are integrated into existing components with proper props
8. CLI verifies setup after execution (files exist, imports resolve, no syntax errors)
9. CLI displays actionable error messages with suggested fixes when operations fail

**Plans:** 2 plans

Plans:

- [ ] 05-01-PLAN.md — Types, atomic file operations, backup/restore, dependency installer
- [ ] 05-02-PLAN.md — Verification, error formatting, execution orchestrator

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase                | Plans Complete | Status      | Completed  |
| -------------------- | -------------- | ----------- | ---------- |
| 1. Client Core SDK   | 5/5            | Complete    | 2026-02-12 |
| 2. Codebase Analysis | 3/3            | Complete    | 2026-02-12 |
| 3. Plan Generation   | 2/2            | Complete    | 2026-02-13 |
| 4. User Confirmation | 2/2            | Complete    | 2026-02-13 |
| 5. Code Execution    | 0/TBD          | Not started | -          |
| 6. CLI Integration   | 0/TBD          | Not started | -          |

### Phase 6: CLI Integration

**Goal:** Wire `--magic` flag into `tambo init` to run the full intelligent init pipeline: analyzeProject → generatePlan → confirmPlan → executeCodeChanges.

**Depends on:** Phase 5

**Requirements:** EXEC-03 through EXEC-09 (integration of all phase 1-5 modules into the CLI command)

**Success Criteria** (what must be TRUE):

1. Running `tambo init --magic` in a Next.js project triggers codebase analysis, plan generation, user confirmation, and code execution
2. The `--magic --yes` flag auto-approves high-confidence recommendations without interactive prompts
3. All existing `tambo init` behavior (auth, project setup, API key) is preserved — `--magic` adds to it, doesn't replace it
4. Errors in any pipeline stage show actionable messages and don't leave partial state

**Plans:** 2 plans

Plans:

- [ ] 06-01-PLAN.md — Magic init orchestrator with pipeline, UX, and re-run detection
- [ ] 06-02-PLAN.md — Wire --magic flag into CLI and init command
