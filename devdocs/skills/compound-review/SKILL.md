---
name: compound-review
description: After completing a feature or fixing issues, captures lessons learned and updates skills or AGENTS.md. Use when the user says "compound", "what did we learn", or after a feature is shipped.
metadata:
  internal: true
---

# Compound Review

After completing a feature, fixing a batch of issues, or finishing a significant PR, review what happened and capture lessons so the team doesn't repeat mistakes or lose validated approaches.

This is the "compound" step from the compound engineering workflow: plan, work, review, compound.

## When to Use This Skill

- User says "compound", "what did we learn", or "capture lessons"
- After a feature branch is completed and PR is opened
- After a batch of bug fixes or consistency improvements
- After the user confirms a non-obvious approach worked well

## Process

### Step 1: Review What Happened

Look at the work that was just completed:

```bash
# See all commits on this branch
git log main..HEAD --oneline

# See the full diff
git diff main...HEAD --stat
```

For each significant change, note:

- What pattern was followed
- What was surprising or non-obvious
- What mistakes were made and corrected
- What the user confirmed as the right approach

### Step 2: Identify Lessons

Categorize findings into three buckets:

**A. Patterns that should be in a skill** (reusable across features)

- A code pattern that agents should follow every time
- A convention that isn't documented but was validated in this work
- A dependency or ordering constraint that isn't obvious from the code

**B. Rules that should be in AGENTS.md** (codebase-wide standards)

- A naming convention that was established
- A file organization decision that applies broadly
- A "don't do X" rule that came from a mistake in this work

**C. Nothing to capture** (the existing docs covered it)

- If existing skills and AGENTS.md already covered everything, say so and stop

### Step 3: Propose Updates

For each lesson, propose a specific update:

**For skill updates:**

- Name the skill file to update (or propose a new one)
- Show the exact content to add
- Explain why this wasn't already captured

**For AGENTS.md updates:**

- Show the section to update
- Show the exact content to add
- Confirm it's a codebase-wide rule, not a one-off decision

### Step 4: Apply Updates (with user approval)

- Update the relevant skill files
- Update AGENTS.md if applicable
- Update devdocs/CLAUDE_SKILLS.md if a new skill was created

## What to Capture

**Good lessons to capture:**

- "Delete buttons must use `text-destructive`, not `text-red-500`" (specific, actionable)
- "Skills depend on LLM provider -- show a warning when provider is unsupported" (dependency)
- "The team prefers bundled PRs for settings refactors" (process preference)
- "Use `DeleteConfirmationDialog`, not inline AlertDialog" (component choice)

**Bad lessons to capture:**

- "We fixed a bug in file X" (ephemeral, belongs in git history)
- "The settings page has 8 tRPC calls" (observable from code)
- "React uses a virtual DOM" (general knowledge, not project-specific)

## Rules

- Only capture lessons that would help a future agent working on a similar task
- Don't duplicate information already in AGENTS.md or existing skills
- Keep updates minimal -- add a line or paragraph, not a whole new section
- Always show the proposed update to the user before applying it
- If no lessons were learned, say "nothing new to capture" and stop. An empty compound step is a good sign.

## Examples

**Example 1: After fixing settings inconsistencies**

```
Lessons learned:
1. Cancel buttons were styled red in custom-instructions-editor.tsx.
   Only destructive actions (delete/remove) should use red styling.
   -> Update: settings-component-patterns skill, "Destructive Action Styling" section
   -> Added rule: "Cancel/discard buttons are NOT destructive -- do not style them red"

2. No new skills needed. Existing patterns covered everything else.
```

**Example 2: After adding a new settings section**

```
Lessons learned:
1. The withTamboInteractable HOC requires a Zod schema for props, not a TypeScript interface.
   -> Already documented in tambo-cloud-component-factory skill. No update needed.

2. When the section depends on LLM provider, you need to check SKILLS_SUPPORTED_PROVIDERS.
   -> Update: settings-feature-placement skill, "Known Dependencies" table
   -> Added row for the new feature's dependency

3. Nothing new to capture for AGENTS.md.
```
