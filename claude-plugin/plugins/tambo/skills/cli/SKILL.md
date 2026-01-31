---
name: Tambo CLI
description: Use this skill when working with the Tambo CLI for project setup and component management. The CLI is agent-friendly with non-interactive mode, exit codes, and guidance errors. Triggers on "tambo init", "tambo add", "tambo list", "full-send", "create-tambo-app", "npx tambo", "non-interactive", "CI mode".
---

# Tambo CLI

Agent-friendly CLI for project setup and component management. Auto-detects non-interactive environments.

## Non-Interactive Mode

The CLI detects non-interactive environments and returns guidance instead of hanging:

```bash
# In CI or piped environments, this returns guidance (exit 2) instead of prompting
npx tambo init
# Error: Project name required.
# Run one of:
#   tambo init --project-name=myapp    # Create new project
#   tambo init --project-id=abc123     # Use existing project
```

### Detection Logic

Non-interactive when ANY of these are true:

- `process.stdin.isTTY` is false (piped input)
- `process.stdout.isTTY` is false (piped output)
- `CI` environment variable is set
- `GITHUB_ACTIONS=true`

Override with `FORCE_INTERACTIVE=1` (requires real TTY).

### Exit Codes

| Code | Meaning                                               |
| ---- | ----------------------------------------------------- |
| 0    | Success                                               |
| 1    | Error (network, invalid args, etc.)                   |
| 2    | User action required - check stderr for exact command |

## Commands for Agents

### Initialize Project

```bash
# Option 1: Direct API key (simplest for agents)
npx tambo init --api-key=sk_...

# Option 2: Create new project (requires prior auth)
npx tambo init --project-name=myapp

# Option 3: Use existing project
npx tambo init --project-id=abc123

# Skip all prompts with defaults
npx tambo init --yes --project-name=myapp
```

### Add Components

```bash
npx tambo add form --yes                    # Skip confirmation
npx tambo add form graph --yes              # Multiple components
npx tambo add form --prefix=src/components  # Custom directory
npx tambo add form --dry-run                # Preview changes
npx tambo add form --legacy-peer-deps       # For dependency conflicts
```

**Available components**: `message-thread-full`, `message-thread-panel`, `message-thread-collapsible`, `control-bar`, `form`, `graph`, `canvas-space`, `input-fields`

### List Components (No Prompts)

```bash
npx tambo list --yes
```

### Create New App

```bash
npx tambo create-app my-app --template=standard
```

### Authentication

```bash
npx tambo auth login --no-browser   # Prints URL instead of opening browser
npx tambo auth status               # Check current auth (no prompts)
```

### Full Setup (One Command)

```bash
npx tambo full-send    # Complete setup with components
```

## Agent Docs

The CLI auto-creates/updates `AGENTS.md` with Tambo documentation:

```bash
npx tambo add form --yes   # Also updates AGENTS.md
```

The generated section includes CLI commands formatted for non-interactive use.

## Key Flags Summary

| Flag             | Commands        | Purpose                       |
| ---------------- | --------------- | ----------------------------- |
| `--yes`, `-y`    | init, add, list | Skip all prompts              |
| `--api-key`      | init            | Direct API key input          |
| `--project-name` | init            | Create new project            |
| `--project-id`   | init            | Use existing project          |
| `--no-browser`   | auth login      | Output URL instead of opening |
| `--dry-run`      | add             | Preview without installing    |
| `--prefix`       | add, list       | Custom component directory    |
