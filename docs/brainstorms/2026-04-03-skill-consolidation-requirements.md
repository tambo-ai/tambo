---
date: 2026-04-03
topic: skill-consolidation
---

# Consolidate Branch Skills into 2-3 Robust Skills

## Problem Frame

The `seth/ui-ux-agents-and-skills-complete` branch adds 6 skills, 1 agent, and 1 Charlie playbook for Tambo Cloud dashboard development. Four of these skills overlap significantly: the component factory duplicates content from settings-component-patterns (UI layer), api-resource-lifecycle (error handling), and feature-dependency-graph (gating). The accessibility concerns are split across a skill, a script, and a playbook with overlapping regex logic. This fragmentation means agents bounce between multiple skills for a single workflow, and maintaining duplicated content across files creates drift risk.

## Requirements

**Skill Consolidation**

- R1. Merge `tambo-cloud-component-factory`, `settings-component-patterns`, `settings-feature-placement`, and `feature-dependency-graph` into a single `tambo-cloud-feature-builder` skill
- R2. The merged feature-builder skill covers the full workflow: placement decision, dependency/capability checks, full-stack implementation (DB through UI), UI patterns, and verification
- R3. Consolidate `accessibility-checklist` skill content into a single self-contained skill (keep the name `accessibility-checklist`)
- R4. Keep `api-resource-lifecycle` as a standalone skill (it applies beyond settings)
- R5. Keep `info-hierarchy-auditor` agent; update it to reference `tambo-cloud-feature-builder` as its source of truth for correct structure

**Scripts and Verification**

- R6. Remove all shell scripts (`scan-a11y.sh`, `check-settings-section.sh`, `validate-new-section.sh`) from skill directories
- R7. Replace scripts with inline verification checklists in each skill that list the specific patterns/files an agent should check
- R8. Verification checklists include the grep patterns and file paths the scripts currently check, presented as instructions the agent executes directly

**Charlie Playbook**

- R9. Keep the `accessibility-scan` Charlie playbook as a separate file
- R10. Update the playbook to reference the consolidated `accessibility-checklist` skill as its source of truth for what to scan and fix

**Cleanup**

- R11. Delete the 4 merged skill directories (`settings-component-patterns/`, `settings-feature-placement/`, `feature-dependency-graph/`, `tambo-cloud-component-factory/`)
- R12. Delete all script files from the remaining skill directories
- R13. Preserve the `real-implementation.md` reference from `tambo-cloud-component-factory` by moving it into the new `tambo-cloud-feature-builder` skill directory

## Success Criteria

- Agent adding a new Tambo Cloud feature only needs to load one skill (`tambo-cloud-feature-builder`) instead of four
- Agent doing accessibility work only needs one skill plus the existing Charlie playbook
- No duplicated content across skills; each concept lives in exactly one place
- All verification logic that was in scripts is captured as inline checklists in the relevant skill
- Existing Charlie playbook still functions for weekly automation

## Scope Boundaries

- Not rewriting skill content from scratch; restructuring and deduplicating existing content
- Not changing the `ai-sdk-model-manager`, `compound-components`, or `creating-styled-wrappers` skills (those are on main, not part of this branch's work)
- Not changing the agent's behavior or capabilities; only updating its references
- Not adding new coverage; consolidating what exists

## Key Decisions

- **Merge into 2-3 bigger skills over keeping modular**: The 4 settings/feature skills answer one question ("how do I add a feature?") and fragmenting them creates friction without meaningful reuse benefit
- **Drop scripts in favor of inline checklists**: Agents can grep/read directly; maintaining separate shell scripts is overhead for what amounts to pattern-matching instructions
- **Charlie playbook stays separate**: It's a different trigger mechanism (recurring automation vs. on-demand guidance); coupling it into the skill would conflate two concerns
- **api-resource-lifecycle stays standalone**: CRUD patterns apply beyond settings; merging it would over-scope the feature-builder

## Outstanding Questions

### Deferred to Planning

- [Affects R2][Needs research] What is the right section ordering within the merged feature-builder skill? Should it follow the implementation flow (DB first) or the decision flow (placement first)?
- [Affects R7][Technical] Should verification checklists be a dedicated `## Verification` section at the end of each skill, or inline after each layer/topic?
- [Affects R10][Technical] What specific changes does the Charlie playbook need to reference the skill instead of reimplementing scan logic?

## Next Steps

All blocking questions resolved. Proceed to `/ce:plan` for structured implementation planning.
