# Claude Code Skills

This document describes the custom Claude Code skills available for maintaining this codebase.

## What are Claude Code Skills?

Claude Code skills are specialized prompts that give Claude detailed instructions for specific workflows. They're defined in `SKILL.md` files with YAML frontmatter and can be invoked directly or triggered automatically when relevant.

## Available Skills

### AI SDK Model Manager

**When to use:** After AI providers announce new models, monthly maintenance checks, or when TypeScript errors about model IDs appear.

**Details:** See `devdocs/skills/ai-sdk-model-manager/SKILL.md`

> Note: Weekly release summaries now live as Charlie proactive playbooks under `.charlie/playbooks/`.

### Compound Components

**When to use:** When building headless UI primitives, creating Radix-style namespaced compound components, or implementing render props patterns. Separates business logic from styles.

**Details:** See `devdocs/skills/compound-components/SKILL.md`

### Styled Wrappers

**When to use:** When creating styled wrapper components that compose headless/base compound components, refactoring styled components to use base primitives, or implementing opinionated design systems on top of headless components.

**Details:** See `devdocs/skills/creating-styled-wrappers/SKILL.md`

### Settings Component Patterns

**When to use:** When building or modifying any settings UI in `apps/web`, even for implicit tasks like "add a toggle" or "let users delete X." Covers Card layout, toasts, confirmation dialogs, destructive styling, and save behaviors. Includes a validation script. Not for feature placement decisions (use Settings Feature Placement).

**Details:** See `devdocs/skills/settings-component-patterns/SKILL.md`

### Accessibility Checklist

**When to use:** When creating, modifying, or reviewing any `.tsx` component in `apps/web`, even if accessibility isn't explicitly mentioned. Covers semantic HTML, aria labels, landmarks, forms, dialogs, and keyboard navigation. Includes a scan script that finds violations automatically. Not for styling/layout changes without interactive elements.

**Details:** See `devdocs/skills/accessibility-checklist/SKILL.md`

### Settings Feature Placement

**When to use:** When deciding where a new feature belongs in the dashboard, even for implicit requests like "add model selection" or "add a billing page." Covers the project vs agent settings split, feature dependencies, and route structure. Not for how to build the UI (use Settings Component Patterns).

**Details:** See `devdocs/skills/settings-feature-placement/SKILL.md`

## Creating New Skills

To create a new skill for this repository:

1. Create a directory in `devdocs/skills/your-skill-name/`
2. Add a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: A clear description of what this skill does and when to use it (max 1024 chars)
metadata:
  internal: true
---

# Your Skill Name

[Detailed instructions for Claude to follow]
```

3. Document it in this file (devdocs/CLAUDE_SKILLS.md)

## Skill Best Practices

- **Keep skills focused** - One workflow per skill
- **Write clear descriptions** - Claude uses these to auto-invoke skills
- **Include examples** - Show expected inputs and outputs
- **Be specific** - Detail exact commands, file paths, and processes
- **Handle errors** - Include troubleshooting guidance
- **Test thoroughly** - Verify the skill works as documented
- **Update regularly** - Keep skills current with codebase changes

## References

- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
- [Skills Repository](https://github.com/anthropics/skills)
- [Creating Custom Skills](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)
