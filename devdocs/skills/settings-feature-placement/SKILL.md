---
name: settings-feature-placement
description: >-
  Guide placement of new features in the Tambo Cloud dashboard information hierarchy. Covers the
  project vs agent settings split, feature dependencies, and route placement. Use when: (1) adding
  new settings sections, (2) adding new pages or tabs, (3) deciding where a feature belongs in
  navigation, (4) adding features that depend on other features' configuration.
metadata:
  internal: true
---

# Settings Feature Placement

Determine where new features belong in the Tambo Cloud dashboard. Placement should be obvious 80% of the time; ask the user when it is not.

## Navigation Structure

```
Dashboard (/)
  Project List | Create Project

Project (/{projectId})
  Overview Tab         -- stats, daily messages chart, API key status
  Observability Tab    -- thread monitoring, message inspection
  Settings Tab         -- all project and agent configuration
```

### Settings Sections (current order)

| #   | Section             | Category | Component                                        |
| --- | ------------------- | -------- | ------------------------------------------------ |
| 1   | API Keys            | Project  | `project-details/api-key-list.tsx`               |
| 2   | LLM Providers       | Agent    | `project-details/provider-key-section.tsx`       |
| 3   | Custom Instructions | Agent    | `project-details/custom-instructions-editor.tsx` |
| 4   | Skills              | Agent    | `project-details/skills-section.tsx`             |
| 5   | MCP Servers         | Agent    | `project-details/available-mcp-servers.tsx`      |
| 6   | Tool Call Limit     | Agent    | `project-details/tool-call-editor.tsx`           |
| 7   | User Authentication | Project  | `project-details/oauth-settings.tsx`             |

**Container:** `apps/web/components/dashboard-components/project-settings.tsx`

## Placement Decision Tree

1. **Configures AI agent behavior?** (model selection, prompts, tools, memory, context) -> **Agent** category in Settings, grouped with LLM Providers through Tool Call Limit.

2. **Configures project infrastructure?** (API keys, auth, team access, billing, webhooks) -> **Project** category in Settings, grouped with API Keys and User Authentication.

3. **Monitoring or debugging view?** (logs, traces, metrics, errors) -> **Observability** tab.

4. **High-level summary or status?** (health, activity, quick-start) -> **Overview** tab.

5. **Standalone workflow unrelated to a single project?** (account settings, org management) -> New top-level route outside `[projectId]` layout. Discuss with team first.

6. **None of the above?** -> Ask the user. State which categories were considered and why none fit.

## Feature Dependencies

```mermaid
graph TD
    LLM[LLM Providers] --> Skills
    LLM --> MCP[MCP Servers]
    LLM --> CustomInstructions[Custom Instructions]
```

| Feature                      | Depends On          | Constraint                      |
| ---------------------------- | ------------------- | ------------------------------- |
| Skills                       | LLM Provider        | Only OpenAI and Anthropic       |
| MCP Servers                  | LLM Provider        | Availability varies by provider |
| Custom Instructions override | Custom Instructions | Toggle must be enabled          |

When adding a dependent feature:

1. Check whether the dependency is configured
2. Show a clear message explaining what to set up first
3. Link to the dependency's settings section
4. Show the feature in a disabled/informational state, never silently hide it

**Reference:** `project-details/skills-section.tsx` checks `SKILLS_SUPPORTED_PROVIDERS`.

## Route Structure

```
apps/web/app/(authed)/(dashboard)/
  page.tsx                    -- Dashboard hub (project list)
  [projectId]/
    layout.tsx                -- Project tabs (Overview, Observability, Settings)
    page.tsx                  -- Overview tab
    observability/page.tsx    -- Observability tab
    settings/page.tsx         -- Settings tab
```

- Project-scoped pages go under `[projectId]/`
- New top-level tabs update `[projectId]/layout.tsx` and `apps/web/components/mobile-drawer.tsx`
- Settings subsections are scrollable sections within `settings/page.tsx`, NOT separate routes
- Non-project routes go under `(authed)/` outside `(dashboard)/[projectId]/`

## Adding a New Settings Section

1. Determine category using the decision tree
2. Check for feature dependencies
3. Create the component per `settings-component-patterns` skill
4. Register in `project-settings.tsx`: add ref, sidebar nav (desktop + mobile), section div, `withTamboInteractable()` wrapper
5. Wire up tRPC route/mutation with standard toast pattern
6. Add dependency handling if applicable (disabled state, warning, link to prerequisite)

## Adding a New Top-Level Tab

Confirm with the team first. Current tabs (Overview, Observability, Settings) have been stable.

1. Update `[projectId]/layout.tsx` tab triggers
2. Create route directory under `[projectId]/`
3. Update mobile navigation in `apps/web/components/mobile-drawer.tsx`
