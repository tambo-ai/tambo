---
description: "Research and create implementation plan"
argument-hint: "<feature request>"
model: inherit
allowed-tools: [Task, AskUserQuestion, Read, Glob, Grep, WebSearch, WebFetch]
---

Create a comprehensive implementation plan for the following feature request:

**Feature Request:** $ARGUMENTS

Follow this workflow:

1. **Clarify Requirements**: Ask natural questions to understand scope, requirements, constraints, user needs, edge cases, and technical preferences.

2. **Confirm Understanding**: After clarifications, summarize requirements and get confirmation.

3. **Initial Research**: Use the Task tool with `researcher` agent to analyze the codebase for existing technologies, architecture patterns, files to modify, and integration points.

4. **Deep Research**: Launch multiple parallel `researcher` agents to investigate specific aspects (technologies, APIs, codebase deep-dives).

5. **Synthesize Plan**: Use the Task tool with `planner` agent to create the final implementation plan at `.claude/.plans/[feature-name].md`, passing all research findings.

See `.claude/agents/planner.md` and `.claude/agents/researcher.md` for detailed agent guidance.
