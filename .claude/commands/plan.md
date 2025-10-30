**Step 1: Clarify Requirements**

**Feature Request:** $ARGUMENTS

Before I start planning, I want to make sure I understand what we're building. Let me ask some clarifying questions:

[Ask natural questions like a developer would ask a product person to understand scope, requirements, constraints, user needs, edge cases, and any technical preferences or concerns. Focus on what's unclear or ambiguous about the request.]

---

**Step 2: Confirm Understanding**

[After user provides clarifications, summarize the feature requirements and get confirmation]

---

**Step 3: Initial Codebase Research**

Launch researcher agent:

```
/task researcher "Analyze the codebase to understand:
1. What existing technologies/packages are in use (check package.json, imports, etc.)
2. Current architecture patterns
3. High-level list of files that will likely need modification
4. Key integration points

Feature context: [confirmed requirements]"
```

---

**Step 4: Parallel Deep Research**

Based on the initial research findings, launch multiple researcher agents in parallel:

```
/task researcher "Research how to implement [specific aspect] using [technology X].
Find: key APIs, best practices, implementation patterns, gotchas.
Include documentation links."
```

```
/task researcher "Deep dive into [specific part of codebase].
Analyze: current implementation, what needs to change, dependencies to consider."
```

[Launch 2-8 researchers based on complexity]

---

**Step 5: Synthesize Plan**

Launch planner agent with all research findings:

```
/task planner "Create implementation plan for: [feature name]

Requirements: [confirmed requirements]

Research findings:
- Initial codebase analysis: [summary]
- Technology research: [summary]
- Codebase deep dives: [summary]

Output to .claude/.plans/[feature-name].md"
```
