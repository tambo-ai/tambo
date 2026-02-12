# Magic CLI Init

## What This Is

An AI-powered replacement for Tambo's CLI `init` command that intelligently analyzes a user's codebase, builds a recommended installation plan (components to register, tools to create, interactables to integrate), and executes the changes via an agent loop. Includes building `@tambo-ai/client-core` — a headless TypeScript client for the Tambo API that the CLI uses internally.

## Core Value

The CLI should feel magic — run one command and your app is Tambo-enabled with the right components registered, tools created, and a working chat widget, all tailored to what's actually in the codebase.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Build `@tambo-ai/client-core` package (headless Tambo API client)
- [ ] client-core: create and manage threads
- [ ] client-core: send messages and receive responses
- [ ] client-core: handle tool call/result execution loop
- [ ] client-core: stream responses from the API
- [ ] CLI uses client-core to create a "setup" thread within the project
- [ ] CLI reviews codebase architecture (framework, state management, routing, data flow)
- [ ] CLI identifies specific components that could be made AI-controllable
- [ ] Model builds a recommended installation plan (components, tools, interactables)
- [ ] CLI presents batch checklist via simple prompts for user confirmation
- [ ] Model executes confirmed changes via tool calls (edit_file, create_file)
- [ ] Result: TamboProvider added to root layout
- [ ] Result: Selected components registered with Tambo
- [ ] Result: Tool definitions generated and registered
- [ ] Result: Working chat widget added to the app
- [ ] Result: Interactables integrated into existing components

### Out of Scope

- Modifying the existing `@tambo-ai/react` SDK — client-core is new; react-sdk refactor to use it is future work
- Rich TUI (ink-style) — simple inquirer/prompts is sufficient
- Non-React frameworks — React only for now

## Context

- Tambo is an open-source drop-in agent for React that speaks your UI
- The existing CLI already handles login, API key provisioning, and basic project scaffolding
- The Tambo Cloud API provides model inference with free tier usage
- Users already have an API key after `tambo login` — the init command can use it immediately
- The model handles all code modifications via tool calls — the CLI is an agent runtime

## Constraints

- **Tech stack**: Must work within the existing Turborepo monorepo structure
- **Package**: client-core must not depend on React — pure TypeScript, usable in Node
- **API**: Uses the existing Tambo Cloud API for inference
- **Auth**: Relies on existing CLI auth flow (API key already available after login)
- **Dependencies**: Don't add new deps without explicit approval

## Key Decisions

| Decision                                    | Rationale                                                                           | Outcome   |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | --------- |
| Build client-core as separate package       | Eventually replaces API layer in react-sdk; CLI needs non-React access to Tambo API | — Pending |
| Model handles code changes via tool calls   | More flexible than templates; adapts to any codebase structure                      | — Pending |
| Batch checklist for confirmation            | Shows full plan at once; user checks what they want; cleaner than step-by-step      | — Pending |
| Replace existing init (not new command)     | Init should just be smart by default                                                | — Pending |
| Use @tambo-ai/typescript-sdk in client-core | SDK already handles auth, retries, pagination — don't reimplement                   | Decided   |
| Use @tanstack/query-core for caching        | Framework-agnostic cache for threads/messages; works in CLI and React               | Decided   |

---

_Last updated: 2026-02-12 after architecture change (typescript-sdk + TanStack)_
