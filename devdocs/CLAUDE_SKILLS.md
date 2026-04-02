# Claude Code Skills

This document describes the custom Claude Code skills available for maintaining this codebase.

## What are Claude Code Skills?

Claude Code skills are specialized prompts that give Claude detailed instructions for specific workflows. They're defined in `SKILL.md` files with YAML frontmatter and can be invoked directly or triggered automatically when relevant.

## Available Skills

### AI SDK Model Manager

**When to use:** After AI providers announce new models, monthly maintenance checks, or when TypeScript errors about model IDs appear.

**Details:** See `.claude/skills/ai-sdk-model-manager/SKILL.md`

> Note: Weekly release summaries now live as Charlie proactive playbooks under `.charlie/playbooks/`.

### Settings Component Patterns

**When to use:** When creating or modifying settings sections, editing files in `apps/web/**/settings/` or `apps/web/components/dashboard-components/project-details/`, adding features to the settings page, or reviewing settings-related code. Covers card layout, toasts, confirmation dialogs, destructive styling, and save behaviors.

**Details:** See `devdocs/skills/settings-component-patterns/SKILL.md`

### Accessibility Checklist

**When to use:** When creating or modifying any `.tsx` component in `apps/web`, adding interactive elements (buttons, links, toggles, dialogs), building forms or data entry flows, or reviewing UI code for accessibility. Covers semantic HTML, aria labels, landmarks, forms, dialogs, and keyboard navigation.

**Details:** See `devdocs/skills/accessibility-checklist/SKILL.md`

### Settings Feature Placement

**When to use:** When adding new settings sections, pages, or tabs. When deciding where a feature belongs in navigation or adding features that depend on other features' configuration. Covers the project vs agent settings split, feature dependencies, and route placement.

**Details:** See `devdocs/skills/settings-feature-placement/SKILL.md`

## Creating New Skills

To create a new skill for this repository:

1. Create a directory in `.claude/skills/your-skill-name/`
2. Add a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: A clear description of what this skill does and when to use it (max 200 chars)
---

# Your Skill Name

[Detailed instructions for Claude to follow]

## What This Skill Does

[Bullet points]

## When to Use This Skill

[Scenarios]

## Process

[Step-by-step instructions]

## Guidelines

[Best practices and constraints]
```

3. Copy to user's skills directory for Claude Code to recognize it:

```bash
cp -r .claude/skills/your-skill-name ~/.claude/skills/
```

4. Document it in this file (devdocs/CLAUDE_SKILLS.md)

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
