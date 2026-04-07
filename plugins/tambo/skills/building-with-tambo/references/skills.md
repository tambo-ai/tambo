# Tambo Skills

Project-scoped instructions that customize your Tambo agent's behavior.

## Contents

- [Quick Start](#quick-start)
- [Skill File Format](#skill-file-format) -- YAML frontmatter, naming rules, field limits
- [Managing Skills via CLI](#managing-skills-via-cli) -- list, add, get, update, enable/disable, delete
- [Managing Skills via Dashboard](#managing-skills-via-dashboard)
- [Provider Support](#provider-support) -- OpenAI, Anthropic, model-level requirements
- [When to Use Skills](#when-to-use-skills)

## Quick Start

```bash
# Create a skill file
cat > my-skill.md << 'EOF'
---
name: scheduling-assistant
description: "Helps users manage calendar events and find available time slots"
---

When users ask about meetings or calendar events, check available time slots,
suggest optimal times, and create events with proper descriptions.
EOF

# Upload it to your project
npx tambo skills add my-skill.md

# Verify it's active
npx tambo skills list
```

## Skill File Format

Skills use YAML frontmatter followed by markdown instructions:

```markdown
---
name: scheduling-assistant
description: "Helps users manage calendar events and find available time slots"
---

You are a scheduling assistant. When users ask about meetings or calendar events:

1. Check their available time slots using the calendar tool
2. Suggest optimal meeting times based on participant availability
3. Create calendar events with proper titles and descriptions

Always confirm the timezone before scheduling.
```

Each skill has:

- **name** -- kebab-case identifier (e.g. `scheduling-assistant`)
- **description** -- brief summary of what the skill does (max 2,000 chars)
- **instructions** -- markdown body that tells the agent how to behave (max 100,000 chars)
- **enabled/disabled** toggle -- disabled skills are stored but not injected

### Naming Rules

Names must be kebab-case (lowercase, numbers, hyphens), max 200 characters, unique per project.

## Managing Skills via CLI

The `npx tambo skills` command manages skills from the terminal. Requires authentication (`npx tambo auth login`) and a project API key (`npx tambo init`).

### List skills

```bash
npx tambo skills list
```

### Create a skill from a file

```bash
npx tambo skills add my-skill.md

# Add multiple skills at once
npx tambo skills add skill1.md skill2.md
```

### View a skill

```bash
# Print to stdout
npx tambo skills get scheduling-assistant

# Save to file
npx tambo skills get scheduling-assistant > scheduling-assistant.md
```

### Update a skill

Edit the markdown file, then push the update:

```bash
npx tambo skills update my-skill.md

# Update multiple skills at once
npx tambo skills update skill1.md skill2.md
```

The skill is matched by the `name` in the frontmatter. The name must match an existing skill.

### Enable or disable a skill

```bash
npx tambo skills enable scheduling-assistant
npx tambo skills disable scheduling-assistant
```

Disabled skills remain stored but are not injected into agent responses.

### Delete a skill

```bash
npx tambo skills delete scheduling-assistant

# Skip confirmation prompt (for CI/agents)
npx tambo skills delete scheduling-assistant --force
```

## Managing Skills via Dashboard

Skills can also be managed from the [project dashboard](https://console.tambo.co):

1. Open your project
2. Go to **Settings**
3. Find the **Skills** section (under the Agent category)
4. Create, edit, enable/disable, or delete skills from the UI

## Provider Support

Skills are uploaded to LLM providers and injected at inference time. They require a provider and model that supports skills. Check the project dashboard for current model support.

Currently supported providers: **OpenAI** and **Anthropic**. Not all models from these providers support skills -- the model must have skills support enabled. If the project's model does not support skills, the CLI warns on creation and the skills are stored but not active until the model is switched.

## When to Use Skills

Skills are the right tool when you want to:

- **Customize agent personality** -- tone, style, domain expertise
- **Add domain knowledge** -- industry-specific terminology, workflows, rules
- **Define behavioral guidelines** -- how the agent should use tools, handle edge cases, format responses
- **Scope agent capabilities** -- restrict or focus what the agent does in specific contexts
