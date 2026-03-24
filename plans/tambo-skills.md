# Tambo Skills

**Date:** 2026-03-24
**Branch:** `avi/tambo-skills`

## Problem

When a developer integrates Tambo into their app, they configure the agent with a system prompt (custom instructions). But as the app grows, that prompt becomes a dumping ground for every behavior they want the agent to have: how to handle scheduling, how to talk about pricing, what to do when a user asks for help, how to fill out forms, etc.

This doesn't scale. The context window fills up. Instructions conflict. The agent gets confused. And worst of all, if a product person wants to tweak how the agent handles a specific task, they have to ask an engineer to edit the system prompt.

**Skills solve this.** A skill is a focused set of instructions for a specific task. Instead of one giant prompt, you have modular pieces that the agent loads when relevant. A product person can add, edit, or disable skills from the dashboard without touching code.

### What does "working" look like?

1. Product person goes to the Tambo dashboard, clicks "Add Skill"
2. They paste a SKILL.md file (or just type instructions with a name and description)
3. The agent now knows how to do that thing
4. They can see in the observability panel whether the skill was triggered
5. If the agent isn't behaving right, they edit the skill and try again

That's it. No code changes, no deploys, no engineer in the loop.

## v1 Scope

**Dashboard-only. No SDK changes.**

v1 is a place in the project dashboard where you manage skill text. Skills are stored in the DB and sent to the LLM provider on each request. We use the provider's own skill/tool routing (Anthropic and OpenAI both have this) instead of building our own router.

### What a skill is (v1)

A skill has three fields:

- **Name** -- identifies the skill (e.g., "scheduling-assistant")
- **Description** -- short summary the LLM reads to decide relevance (e.g., "Helps users schedule and manage calendar events")
- **Instructions** -- the full text the agent receives when the skill is active

That's the whole data model. No version, no tools, no components, no state schema, no config bag.

### How skills get created

**Option A: Paste SKILL.md**
User pastes a SKILL.md file (standard Agent Skills format with YAML frontmatter). We parse the frontmatter to extract name and description, store the full text as instructions. Like Vercel's env file drop-in.

```yaml
---
name: scheduling-assistant
description: Helps users schedule and manage calendar events
---

When a user wants to schedule a meeting:
1. Ask for the participants
2. Check availability using the calendar tool
3. Propose available time slots
4. Confirm and create the event
```

**Option B: Form fields**
User fills in name, description, and instructions in separate fields on the dashboard. Simpler but less portable.

We should support both. Paste auto-fills the form fields from frontmatter.

### How skills reach the LLM

On each run request:

1. API loads all enabled skills for the project from the DB
2. Skills are sent to the LLM provider using their native skill/context API
3. The provider handles routing (which skills are relevant to this message)
4. We don't build our own router

**Important:** Alec pointed out that Anthropic and OpenAI both have skill APIs. We should use those instead of building threshold-based routing ourselves. Their routing is a competitive advantage they're investing in -- we shouldn't try to compete with that.

**Open question:** How exactly do we send skills to each provider? Need to investigate the specific APIs:

- Anthropic: how does their skill/context injection work?
- OpenAI: how does their equivalent work?
- Other providers (Groq, Mistral, etc.): do they have something similar, or do we fall back to system prompt injection?

### Dashboard UI

**Skills list page** (`/project/[id]/skills`)

- List of all skills for the project
- Enable/disable toggle per skill
- "Add Skill" button
- Edit / delete actions

**Add/edit skill page**

- Paste SKILL.md textarea (parses frontmatter into fields below)
- Name field
- Description field
- Instructions field (markdown editor)
- Save / cancel

**Seth will design this** -- keeping it simple, similar to how custom instructions work today but for multiple named skills.

### DB Storage

Simple addition to the existing schema:

- `id`, `projectId`, `name`, `description`, `instructions` (text), `enabled` (boolean), `createdAt`, `updatedAt`
- Unique constraint on (`projectId`, `name`)
- Operations in `packages/db/src/operations/skills.ts`
- CRUD endpoints at `/v1/projects/:projectId/skills`

Could also be a JSONB column in a generic config table. Either works for v1 -- the important thing is it's simple and we can query by project.

### Observability

When a skill is triggered during a run, it should show up in the observability/thread history panel. This is how the product person knows if their skill is working:

- "Skill triggered: scheduling-assistant"
- They can see the skill instructions that were injected
- If the skill wasn't triggered when it should have been, they know to improve the description

This is not end-user-facing. It's for the team managing the agent.

## What's NOT in v1

| Feature                                | Why not now                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineSkill()` in SDK / TamboProvider | Start with dashboard. SDK integration is v2 after we validate the concept.                                                                      |
| Custom skill routing                   | Use the LLM provider's routing. Don't compete with Anthropic/OpenAI on this.                                                                    |
| Skill state / persistence              | Just instructions for now. State adds complexity before we know it's needed.                                                                    |
| Tools/components inside skills         | Skills are text. If the instructions say "use the calendar tool", and that tool is registered, the agent will use it. No formal binding needed. |
| Marketplace / GitHub distribution      | Validate skills work first, then think about sharing.                                                                                           |
| End-user skill visibility              | Skills are a behind-the-scenes config. End users don't need to see them.                                                                        |
| Slash command picker                   | v2 -- needs SDK changes.                                                                                                                        |
| Workflow step sequences                | v2 -- complex, not validated as needed.                                                                                                         |
| Directory convention / CLI scaffold    | v2 -- when SDK-side skills exist.                                                                                                               |

## Implementation

### Phase 1: DB + API

- Add skills schema/table to `packages/db`
- DB operations: `createSkill`, `getSkill`, `listSkills`, `updateSkill`, `deleteSkill`, `toggleSkill`
- NestJS CRUD endpoints at `/v1/projects/:projectId/skills`
- DTOs with class-validator, ProjectAccessOwnGuard

### Phase 2: LLM Integration

- Investigate Anthropic/OpenAI skill APIs -- how do we send skills?
- Modify the decision loop to load project skills from DB and inject them
- For providers without skill APIs: fall back to appending skill instructions to the system prompt with clear delimiters
- Add skill trigger events to the run stream (for observability)

### Phase 3: Dashboard UI

- Skills list page with enable/disable toggles
- Add/edit page with SKILL.md paste support + form fields
- Frontmatter parsing (use `gray-matter` or similar)
- Seth designs this

Can run in parallel with Phase 2 since it only needs Phase 1 API endpoints.

## Risks

| Risk                                          | Mitigation                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Provider skill APIs might not do what we need | Fall back to system prompt injection with delimiters. Every provider supports that.       |
| Too many skills = too many tokens             | This is why providers are building routing. If needed, we can add our own later.          |
| Skills conflict with each other               | Product person manages this. They can see all skills and disable ones that conflict.      |
| SKILL.md parsing edge cases                   | Keep it simple. If frontmatter parsing fails, just store the whole thing as instructions. |

## v2 Ideas (after v1 ships and we get feedback)

- **SDK-side skills** -- `defineSkill()` in code, TamboProvider integration, skills that include tools/components
- **Skill state** -- persistent data scoped to a skill within a thread
- **Marketplace** -- browse and install skills from GitHub repos
- **Slash commands** -- typing `/` in message input opens skill picker
- **Workflow skills** -- multi-step sequences with tool + UI per step
- **Skill creator** -- AI-powered: "analyze my app and suggest skills"
- **T-stack / intentions** -- skills in package.json via npm install (Alec investigating this)
- **Observability deep dive** -- which skills are triggering, how often, success rate

## Open Questions

1. **How do Anthropic/OpenAI skill APIs actually work?** Need to investigate before Phase 2. If they just want text blobs, great. If they need structured data, we adapt.

2. **Dedicated table vs generic config table?** Leaning toward dedicated `skills` table for simplicity and queryability since we know the schema.

3. **Frontmatter parsing library** -- `gray-matter` is the standard. Already used in the ecosystem. Small dep, CLI-only for now but could be used in API too.

4. **How do skills show up in observability?** Need to define what a "skill triggered" event looks like in the run stream.

5. **Should we support skill creation through Claude Code?** Michael Magan suggested this -- "read through my app and create skills." Could be a powerful onboarding flow. Separate from v1 but worth thinking about.
