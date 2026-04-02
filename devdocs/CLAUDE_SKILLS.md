# Claude Code Skills

This document describes the custom Claude Code skills available for maintaining this codebase.

## What are Claude Code Skills?

Claude Code skills are specialized prompts that give Claude detailed instructions for specific workflows. They're defined in `SKILL.md` files with YAML frontmatter and can be invoked directly or triggered automatically when relevant.

## Available Skills

### AI SDK Model Manager

**When to use:** After AI providers announce new models, monthly maintenance checks, or when TypeScript errors about model IDs appear.

**Details:** See `.claude/skills/ai-sdk-model-manager/SKILL.md`

> Note: Weekly release summaries now live as Charlie proactive playbooks under `.charlie/playbooks/`.

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
