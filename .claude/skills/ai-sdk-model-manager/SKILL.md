---
name: ai-sdk-model-manager
description: Manages AI SDK model configurations - updates packages, identifies missing models, adds new models with research, and updates documentation
---

# AI SDK Model Manager

This skill helps maintain AI SDK model configurations in the Tambo Cloud codebase. It automates the process of keeping model definitions up-to-date with the latest AI SDK releases.

## What This Skill Does

1. **Updates AI SDK Packages** - Checks and updates @ai-sdk/openai, @ai-sdk/google, @ai-sdk/groq, and other provider packages to their latest versions
2. **Identifies Missing Models** - Compares TypeScript definitions in the SDKs against configured models to find newly available models
3. **Researches Models** - Gathers information about new models including capabilities, context windows, pricing, and use cases
4. **Prompts User** - Asks which models to add before making changes
5. **Adds Models** - Updates model configuration files with proper TypeScript types and metadata
6. **Updates Documentation** - Updates relevant docs and README files to reflect new model availability

## When to Use This Skill

Use this skill when:

- You want to check if AI SDK packages need updating
- New models have been released by OpenAI, Google, Anthropic, or other providers
- You're getting TypeScript errors about model IDs not being in SDK types
- You want to ensure Tambo supports the latest models

## Files This Skill Works With

- `packages/core/src/llms/models/*.ts` - Model configuration files
- `packages/backend/package.json` - AI SDK dependencies (source of truth for versions)
- `docs/content/docs/models/*.mdx` - Model documentation
- `README.md` - Main documentation file

## Process

### Step 1: Update AI SDK Packages

Check current versions and update to latest:

```bash
cd packages/backend
npm outdated | grep '@ai-sdk'
npm install @ai-sdk/openai@latest @ai-sdk/google@latest @ai-sdk/groq@latest @ai-sdk/anthropic@latest @ai-sdk/mistral@latest
```

### Step 2: Identify Missing Models

For each provider, inspect the TypeScript definitions:

```bash
# Check what models are in the SDK types
cat node_modules/@ai-sdk/openai/dist/index.d.ts | grep 'type.*ModelId'
cat node_modules/@ai-sdk/google/dist/index.d.ts | grep 'type.*ModelId'
cat node_modules/@ai-sdk/groq/dist/index.d.ts | grep 'type.*ModelId'
```

Compare against current model configurations in:

- `packages/core/src/llms/models/openai.ts`
- `packages/core/src/llms/models/gemini.ts`
- `packages/core/src/llms/models/groq.ts`
- `packages/core/src/llms/models/anthropic.ts`
- `packages/core/src/llms/models/mistral.ts`

### Step 3: Research New Models

**Use the researcher subagent to gather information about each missing model:**

```
Launch a researcher subagent to find:
- Official documentation link
- Model capabilities (reasoning, vision, function calling, etc.)
- Context window size (inputTokenLimit)
- Pricing tier
- Best use cases
- Release date and status (experimental, stable, deprecated)
```

The researcher subagent has access to web search and can efficiently gather this information for multiple models in parallel.

### Step 4: Prompt User

Present findings:

```
Found the following new models in updated AI SDK packages:

OpenAI:
- gpt-6-preview (200k context, experimental reasoning model)
- gpt-4.2-turbo (1M context, improved function calling)

Google:
- gemini-3.5-pro (2M context, advanced reasoning)

Which models would you like to add? (all/none/specific)
```

Wait for user response before proceeding.

### Step 5: Add Selected Models

**Consider launching parallel subagents to add models to each provider file:**

For models spread across multiple providers (OpenAI, Google, Groq), launch separate subagents to edit each file concurrently. This is faster than doing them sequentially.

For each model being added, ensure these required fields:

- `apiName`: Exact model ID string from SDK
- `displayName`: Human-friendly name
- `status`: "untested" | "tested" | "known-issues"
- `notes`: Brief description of capabilities and use cases
- `docLink`: Official provider documentation URL
- `tamboDocLink`: "https://docs.tambo.co"
- `inputTokenLimit`: Context window size in tokens
- `modelSpecificParams`: Any special parameters (reasoning, thinking, etc.)

Follow existing patterns in each file and ensure model IDs match SDK type definitions exactly.

Example:

```typescript
"gpt-6-preview": {
  apiName: "gpt-6-preview",
  displayName: "gpt-6-preview",
  status: "untested",
  notes: "Experimental next-generation reasoning model with extended context",
  docLink: "https://platform.openai.com/docs/models/gpt-6-preview",
  tamboDocLink: "https://docs.tambo.co",
  inputTokenLimit: 200000,
  modelSpecificParams: reasoningParameters,
},
```

### Step 6: Verify TypeScript

Run type checking to ensure all model IDs are valid:

```bash
cd packages/core
npm run check-types
```

If there are type errors, fix model IDs to match SDK definitions exactly.

### Step 7: Update Documentation

**Consider using subagents to update documentation in parallel:**

If updating multiple documentation files, launch parallel subagents to handle:

1. **README.md** - Update the "Supported LLM Providers" section if new providers or significant models were added
2. **docs/content/docs/models/\*.mdx** - Add new models to appropriate documentation pages with:
   - Model name and description
   - Key capabilities
   - Context window
   - Example use cases
   - Links to provider docs

### Step 8: Run Quality Checks

Before completing:

```bash
cd packages/core
npm run lint
npm run check-types
npm run test
```

### Step 9: Create Pull Request

**Create a PR with proper conventional commit format:**

```bash
gh pr create --title "feat(models): add [model names] support" --body "$(cat <<'EOF'
Updated AI SDK packages and added support for newly released models:

Models added:
- [list models here]

Package updates:
- @ai-sdk/openai: X.X.X → X.X.X
- @ai-sdk/groq: X.X.X → X.X.X

All type checks passing, documentation updated.
EOF
)"
```

**PR title format:** `feat(models): add [model names] support`

Use `feat(models):` for new models or `deps(core):` for package updates only.

## Guidelines

- **Use subagents for efficiency** - Launch researcher subagents for gathering information and parallel subagents for editing multiple files
- **Always research before adding** - Don't guess at model capabilities or context limits
- **Match SDK types exactly** - Model IDs must match the TypeScript definitions in node_modules
- **Mark new models as "untested"** - Let the team test before marking as "tested"
- **Include official doc links** - Always link to provider's official documentation
- **Be conservative** - Only add models the user explicitly approves
- **Update docs comprehensively** - Don't just update code, update all relevant documentation

## Error Handling

If you encounter:

- **Type errors after adding models** - Double-check the model ID matches the SDK's TypeScript definition exactly
- **Missing model in SDK** - The provider may not have released it yet, suggest waiting for next SDK update
- **Conflicting model names** - Use the SDK's preferred naming convention
- **Unknown context limits** - Research provider docs or mark as "unknown" and note it needs verification

## Notes

- This skill should be run periodically (monthly or when new models are announced)
- Always check the git diff before committing to ensure only intended changes were made
- Some models may have special requirements (API access, pricing tier, etc.) - note these in the model's `notes` field
- If a model is renamed in the SDK, update both the key and apiName, and consider adding a deprecation note to the old entry
