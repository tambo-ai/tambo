---
description: "Create a developer-focused user story for React SDK features"
argument-hint: "<feature description>"
model: inherit
allowed-tools: [Task, AskUserQuestion, Read, Glob, Grep]
---

# Story Command

You will create a comprehensive, developer-focused user story for a React SDK feature request. The story will include technical context, acceptance criteria, and pseudo-code examples to guide implementation.

## Task

Use the Task tool with `subagent_type="react-story-writer"` to invoke the react-story-writer agent with the following feature request:

**Feature Request**: $ARGUMENTS

The agent will analyze the codebase, understand existing patterns, and produce a detailed user story with pseudo-code that matches the project's architecture and conventions.
