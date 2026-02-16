# Phase 6: CLI Integration - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire `--magic` flag into `tambo init` to run the full intelligent init pipeline: analyzeProject → generatePlan → confirmPlan → executeCodeChanges. All existing `tambo init` behavior (auth, project setup, API key) is preserved — `--magic` adds to it, doesn't replace it.

</domain>

<decisions>
## Implementation Decisions

### Pipeline flow

- `--magic` activates after normal `tambo init` auth/project setup completes
- If user runs `tambo init --magic` on an uninitialized project, run full init first, then magic pipeline seamlessly
- After normal `tambo init` (without --magic), suggest: "Run tambo init --magic to auto-configure components"
- Re-running `--magic` on an already-initialized project works additively — re-analyzes and suggests new components/tools, skips what's already set up

### Progress & output

- Step-by-step spinner during analysis: "Analyzing framework...", "Detecting components...", "Finding tools..."
- After analysis, show summary first ("Found: 3 components, 2 tools, 1 provider setup"), then interactive checklist
- During code execution, phase-level progress only: "Installing dependencies...", "Modifying files...", "Verifying setup..."
- On success, show recap of what was done (files modified, deps installed) plus next steps ("Run npm run dev")

### Error recovery UX

- If codebase analysis fails (e.g., can't detect framework): prompt user "Could not detect framework. Continue anyway?"
- If a file modification fails during execution: skip and continue with remaining items, report failures at end
- If dependency installation fails: add deps to package.json anyway, tell user to install manually later
- At the end, summarize all failed/skipped items with specific fix commands the user can run

### Flag design

- `--magic` and `--yes` are separate flags that combine: `--magic --yes` auto-approves high-confidence items
- `--magic` alone still shows confirmation checklist for user approval
- No `--dry-run` flag — the confirmation step already serves as preview (users can deselect everything)
- No scope filtering (e.g., `--only components`) — `--magic` always runs the complete pipeline
- API key comes from existing tambo init config or TAMBO_API_KEY env var only — no `--api-key` flag

### Claude's Discretion

- Exact spinner/progress library choice
- Summary formatting and layout
- How to detect "already set up" items for additive re-runs
- Wording of error messages and fix suggestions

</decisions>

<specifics>
## Specific Ideas

- After normal init, suggest --magic so users discover it naturally
- Dep install failure should be non-blocking — add to package.json and let user handle install
- Error summary at end should include copy-pasteable fix commands

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 06-cli-integration_
_Context gathered: 2026-02-16_
