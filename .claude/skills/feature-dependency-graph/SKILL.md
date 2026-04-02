---
name: feature-dependency-graph
description: Documents which Tambo Cloud features depend on other features. Use when adding features that depend on configuration, checking provider capabilities, building UI that conditionally shows/hides settings, or when the user mentions "provider support", "feature gating", "capability check", "agent mode vs LLM mode", "skills supported", or "adding a new provider".
metadata:
  internal: true
---

# Feature Dependency Graph

Maps which Tambo Cloud features depend on others. Check the source files to verify tables are current before acting on them.

## Gotchas

- Skills are silently skipped at runtime when the provider doesn't support them -- this is intentional, not a bug. A project can have skills configured for when the user switches providers.
- LangGraph is in the agent provider registry but marked `isSupported: false`. The UI shows it as "coming soon" via `getAgentProviderLabel()`, not by hiding the option.
- "OpenAI Compatible" providers require a base URL but don't support skills or custom model selection from a predefined list -- they use free-text model IDs instead.
- The `parallelToolCalls` and `strictJsonSchema` LLM parameters only exist for some providers. The UI must conditionally render these based on the provider config, not just hide/show a single params form.
- MCP server support and Agent mode are mutually exclusive right now. When building features that touch both, gate on `isAgentMode` early.

## Known Dependencies

| Feature           | Depends On        | Constraint                                               | Gate Location                        |
| ----------------- | ----------------- | -------------------------------------------------------- | ------------------------------------ |
| Skills            | LLM Provider      | OpenAI or Anthropic only                                 | `skills-section.tsx:45`              |
| Skills            | API Key           | User-provided or fallback key must exist                 | `skills.ts:49-53`                    |
| Skills            | LLM Mode          | Not available in Agent mode                              | Implicit (provider must be LLM type) |
| MCP Servers       | LLM Mode          | Disabled in Agent mode                                   | `available-mcp-servers.tsx:98`       |
| Model Selection   | LLM Provider      | Available models determined by provider                  | `llm.config.ts:8-63`                 |
| Custom LLM Params | LLM Provider      | `parallelToolCalls`, `strictJsonSchema` vary by provider | `llm.config.ts`                      |
| Agent URL         | Agent Mode        | Required when `AiProviderType.AGENT` selected            | `agent-settings.tsx`                 |
| Agent Providers   | Provider Registry | LangGraph marked `isSupported: false`                    | `agent-registry.ts:10-24`            |

### Independent Features (no dependencies)

These features work with all providers and modes:

- Tool Call Limit
- Custom Instructions
- OAuth Token Validation
- API Keys

## Provider Capabilities

| Provider          | Skills | MCP Servers | Custom Models | Requires Base URL |
| ----------------- | ------ | ----------- | ------------- | ----------------- |
| OpenAI            | Yes    | Yes         | No            | No                |
| Anthropic         | Yes    | Yes         | No            | No                |
| Gemini            | No     | Yes         | No            | No                |
| Mistral           | No     | Yes         | No            | No                |
| Cerebras          | No     | Yes         | No            | No                |
| OpenAI Compatible | No     | Yes         | Yes (custom)  | Yes               |
| Agent Mode        | No     | No          | N/A           | Yes (agent URL)   |

**Source files (authoritative -- verify tables against these before acting):**

- `packages/core/src/llms/llm.config.ts` -- LLM provider configs
- `packages/core/src/agent-registry.ts` -- Agent provider support flags
- `packages/backend/src/services/skills/provider-skill-client.ts` -- Skills provider support (`SKILL_PROVIDERS`)

## UI Patterns for Dependent Features

Never silently hide a feature because its dependency is unmet. Show it in a disabled/informational state. Use one of these three patterns:

1. **Warning alert** -- feature section is visible but limited. Name the dependency and how to resolve it. Disable buttons/toggles in the section.

   ```tsx
   // skills-section.tsx -- provider doesn't support skills
   <Alert variant="warning">
     <AlertTriangle className="h-4 w-4" />
     <AlertDescription>
       Skills are currently supported with OpenAI and Anthropic models. Your
       project uses {providerName}. Switch to a supported model to enable
       skills.
     </AlertDescription>
   </Alert>
   ```

2. **Disabled card** (`opacity-60`) -- entire section is non-functional due to mode.

   ```tsx
   // available-mcp-servers.tsx -- agent mode active
   <Card className="opacity-60">
     <CardContent>
       <p>MCP Servers are disabled while Agent mode is enabled.</p>
     </CardContent>
   </Card>
   ```

3. **"Coming soon" in dropdowns** -- specific options not yet supported. Use `disabled` prop + label suffix.
   ```tsx
   // agent-settings.tsx
   <Combobox
     items={AGENT_PROVIDER_REGISTRY.map((provider) => ({
       value: provider.type,
       label: getAgentProviderLabel(provider.type),
       disabled: !provider.isSupported,
     }))}
   />
   ```

## API-Side Gating

Backend code must also respect feature dependencies. Do not assume the UI prevents invalid requests.

### Skills gating

```typescript
// apps/api/src/skills/skills.service.ts
supportsSkills(providerName: string): boolean {
  return providerSupportsSkills(providerName);
}

// apps/api/src/threads/threads.service.ts
const providerSkills = skillApiKey
  ? await this.skillsService.ensureProviderSkillsForRun({ ... })
  : undefined;
```

Skills are silently skipped (not errored) when the provider doesn't support them. This is intentional -- a project can have skills configured for when the user switches back to a supported provider.

### Adding a new capability gate

When adding a new feature that depends on provider capabilities:

1. Add the capability check to the provider config (`packages/core/src/llms/llm.config.ts` or similar)
2. Add the UI gate in the component (warning alert + disabled controls)
3. Add the API gate in the service (skip or error based on whether the operation is destructive)
4. Update this skill's dependency table and provider capabilities table

## Adding a New Provider

When adding a new LLM provider:

1. Add config to `packages/core/src/llms/llm.config.ts`
2. Determine which features it supports (skills, MCP, custom models)
3. Update `SKILL_PROVIDERS` in `packages/backend/src/services/skills/provider-skill-client.ts` if it supports skills
4. Update this skill's provider capabilities table
5. Test that UI components correctly show/hide features for the new provider
