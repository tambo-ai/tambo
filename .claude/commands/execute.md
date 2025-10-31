---
description: "Orchestrate implementation through parallel subagents"
argument-hint: "<task description>"
model: inherit
allowed-tools: [Task, TodoWrite, Read, Grep, Glob]
---

Use the Task tool with `subagent_type="execution-orchestrator"` to orchestrate the implementation of the following task through parallel subagents:

**Task:** $ARGUMENTS

See `.claude/agents/execution-orchestrator.md` for detailed orchestration guidance including:

- Breaking down work into phases
- Smart parallelization strategies
- Sequential dependency handling
- Validation and error fixing patterns
