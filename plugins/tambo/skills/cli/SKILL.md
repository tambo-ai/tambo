---
name: cli
description: Tambo CLI reference for project setup and component installation. Agent-friendly with non-interactive mode and exit codes. Use when running tambo init, tambo add, npx tambo commands, or browsing the component library. For guided project creation with tech recommendations, use start-from-scratch skill. For adding Tambo to existing projects, use add-to-existing-project skill.
---

# Tambo CLI

Agent-friendly CLI for project setup and component management.

## Quick Start

```bash
npx tambo init --api-key=sk_...              # Initialize with API key
npx tambo add message-thread-full --yes      # Add a component
npx tambo create-app my-app --template=standard  # New app from template
```

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

## Component Library

Browse and preview all components at [ui.tambo.co](https://ui.tambo.co).

### Available Components

| Component                      | Description                                               |
| ------------------------------ | --------------------------------------------------------- |
| `message-thread-full`          | Complete message thread with all content and interactions |
| `message-thread-panel`         | Message thread in a side panel or modal context           |
| `message-thread-collapsible`   | Message threads that can be expanded or collapsed         |
| `message`                      | Individual messages with markdown support                 |
| `message-input`                | Composes and sends messages in a conversation             |
| `message-suggestions`          | AI-generated suggestions to help users compose responses  |
| `control-bar`                  | Controls and actions in the interface                     |
| `input-fields`                 | Reusable input fields with styles and validation          |
| `graph`                        | Visualizes graph-based data structures                    |
| `form`                         | Collects user input with validation support               |
| `map`                          | Interactive map with clustering and heatmap support       |
| `canvas-space`                 | Displays rendered components from chat messages           |
| `thread-history`               | Chronological history of a conversation thread            |
| `thread-dropdown`              | Dropdown menu for collapsible chat threads                |
| `thread-content`               | Displays messages within a thread                         |
| `scrollable-message-container` | Container that auto-scrolls to new messages               |
| `edit-with-tambo-button`       | Inline AI editor button for interactable components       |
| `elicitation-ui`               | MCP elicitation UI for user input requests                |
| `mcp-components`               | MCP prompt and resource picker buttons                    |

### What You Get

Each component includes:

- **Source code** copied to your project (not a dependency)
- **Tambo integration** pre-configured with hooks
- **Styling** via Tailwind CSS (customizable)
- **TypeScript** with full type definitions

### Example: Full Chat Interface

```bash
npx tambo add message-thread-full control-bar --yes
```

This adds a complete chat UI with:

- Message history display
- AI-generated component rendering
- Input bar with send button
- Streaming status indicators

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
