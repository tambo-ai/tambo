# Tambo Skills

**Date:** 2026-03-24
**Branch:** `avi/tambo-skills`

## Problem

When a developer integrates Tambo into their app, they configure the agent with a system prompt (custom instructions). As the app grows, that prompt becomes a dumping ground -- how to handle scheduling, how to talk about pricing, what to do when someone asks for help, how to fill out forms, etc.

This doesn't scale. The context window fills up, instructions conflict, the agent gets confused. And if a product person wants to tweak how the agent handles a specific task, they have to ask an engineer to edit the system prompt and deploy.

**Skills solve this.** A skill is a focused set of instructions for a specific task. Instead of one giant prompt, you have modular pieces. A product person can add, edit, or disable skills from the dashboard without touching code.

### What does "working" look like?

1. Product person goes to the Tambo dashboard, clicks "Add Skill"
2. They paste a SKILL.md file (or we help them generate one)
3. The agent now knows how to do that thing
4. They can see in the observability panel whether the skill was triggered
5. If the agent isn't behaving right, they edit the skill and try again

No code changes, no deploys, no engineer in the loop.

## v1 Scope

**Dashboard-only. No SDK changes.**

A place in the project dashboard to manage skills. Skills are stored in the DB and injected into the system prompt on each request.

### What a skill is

A skill has three fields:

- **Name** -- identifies the skill (e.g., "scheduling-assistant")
- **Description** -- short summary so the team knows what it does
- **Instructions** -- the full text that gets injected into the agent's context

That's it. No version, no tools, no components, no state schema.

### How skills get created

User pastes a SKILL.md file into the dashboard. We parse the YAML frontmatter to extract name and description, and the body becomes the instructions.

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

If the frontmatter parsing fails for whatever reason, we just store the whole thing as instructions and let them fill in name/description manually.

### How skills reach the LLM

I looked into whether Anthropic or OpenAI have "skill APIs" where you upload skills and the provider handles routing. **They don't.** There's no such thing. Every provider just gives you system prompts and tool definitions. If you want the agent to know about skills, you put them in the system prompt yourself.

So for v1:

1. API loads all enabled skills for the project from the DB
2. Each skill's instructions get appended to the system prompt with delimiters
3. All enabled skills are included on every request (no routing)

```
[Skill: scheduling-assistant]
When a user wants to schedule a meeting:
1. Ask for the participants
...
[End Skill: scheduling-assistant]

[Skill: pricing-faq]
When a user asks about pricing:
...
[End Skill: pricing-faq]
```

If the skill count gets high enough that this bloats the context window, we can add routing later (a lightweight LLM call to pick relevant skills, or embedding-based matching). But for v1 most projects will have a handful of skills and it won't matter.

Anthropic does have prompt caching (`cache_control: {"type": "ephemeral"}`) which means we can cache the skill block across requests so we're not re-tokenizing the same text every time. Worth using if we're on Anthropic.

### Dashboard UI

**Skills list page** (`/project/[id]/skills`)

- List of all skills for the project
- Enable/disable toggle per skill
- "Add Skill" button
- Edit / delete actions

**Add/edit skill page**

- Paste SKILL.md textarea (parses frontmatter into name/description/instructions)
- Name, description, instructions shown as editable fields after parsing
- Save / cancel

Seth will design this.

### DB Storage

- `id`, `projectId`, `name`, `description`, `instructions` (text), `enabled` (boolean), `createdAt`, `updatedAt`
- Unique constraint on (`projectId`, `name`)
- Operations in `packages/db/src/operations/skills.ts`
- CRUD endpoints at `/v1/projects/:projectId/skills`

### Observability

When skills are included in a run, it should show up in the observability/thread history panel:

- Which skills were injected for this run
- The product person can see if the skill instructions are actually reaching the agent
- If the agent isn't behaving right on a specific task, they can check whether the relevant skill was enabled

This is for the team managing the agent, not end users.

## What's NOT in v1

| What                                            | Why not                                                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `defineSkill()` in SDK / TamboProvider          | Dashboard first. SDK integration later after we validate the concept.                                                  |
| Skill routing (picking which skills to include) | Just include all enabled skills. Routing is an optimization for when someone has 20+ skills.                           |
| Skill state                                     | Skills are just text. State adds complexity before we know anyone needs it.                                            |
| Tools/components inside skills                  | If the instructions say "use the calendar tool" and that tool exists, the agent will use it. No formal binding needed. |
| Marketplace / GitHub distribution               | Validate that skills work at all before thinking about sharing them.                                                   |
| End-user skill visibility                       | Skills are config. End users don't see them.                                                                           |
| Slash command picker                            | Needs SDK changes. v2.                                                                                                 |
| Workflow step sequences                         | Complex, unvalidated. v2.                                                                                              |

## Implementation

### Phase 1: DB + API

- Add skills table to `packages/db`
- DB operations: `createSkill`, `getSkill`, `listSkills`, `updateSkill`, `deleteSkill`, `toggleSkill`
- NestJS CRUD endpoints at `/v1/projects/:projectId/skills`
- DTOs with class-validator, ProjectAccessOwnGuard

### Phase 2: System Prompt Injection

- Modify the decision loop to load project skills from DB
- Append enabled skills to the system prompt with clear delimiters
- Add skill injection info to the run stream (for observability)
- Look into Anthropic prompt caching for the skill block

### Phase 3: Dashboard UI

- Skills list page with enable/disable toggles
- Add/edit page with SKILL.md paste and frontmatter parsing
- Frontmatter parsing with `gray-matter`
- Seth designs this

Phase 3 can run in parallel with Phase 2 since it only needs Phase 1 API endpoints.

## Risks

| Risk                              | Mitigation                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Too many skills = too many tokens | Most projects will have a few skills. If it becomes a problem, add routing later. Anthropic prompt caching helps with cost. |
| Skills conflict with each other   | Product person manages this. They can see all skills and disable ones that conflict.                                        |
| Frontmatter parsing edge cases    | If parsing fails, store the whole thing as instructions. Don't block on bad formatting.                                     |
| Agent ignores skill instructions  | This is a prompt engineering problem, not a technical one. We can help with description/instruction quality guidance.       |

## v2 Ideas

- **SDK-side skills** -- `defineSkill()` in code, TamboProvider integration, skills with tools/components
- **Skill routing** -- lightweight LLM call or embedding match to pick relevant skills when there are many
- **Skill state** -- persistent data scoped to a skill within a thread
- **Marketplace** -- browse and install skills from GitHub repos
- **Slash commands** -- `/` in message input opens skill picker
- **Workflow skills** -- multi-step sequences with tool + UI per step
- **Skill creator** -- AI generates skills by analyzing the app (Claude Code flow)
- **T-stack / intentions** -- skills via npm install (Alec is looking into this)

## Open Questions

1. **Dedicated table vs generic config table?** Leaning dedicated `skills` table since we know the schema and it's easier to query.

2. **Should the skill description be used by the LLM for anything?** Right now it's just for the dashboard UI. But if we add routing later, the description would be what the router reads. Worth storing separately from instructions even if we don't use it in v1.

3. **Prompt caching** -- worth investigating Anthropic's prompt caching for the skill block. If skills don't change often, we can cache them and save tokens.

4. **How do skills show up in observability?** Need to define what "skill was included in this run" looks like in the run stream / thread history.

5. **Skill creation through Claude Code** -- Michael suggested "read my app and generate skills." Could be a strong onboarding flow. Separate from v1 but worth thinking about.
