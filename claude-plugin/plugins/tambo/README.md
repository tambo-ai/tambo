# Tambo Plugin for Claude Code

Build agents that speak your UI.

## Installation

```bash
# Step 1: Add the marketplace (one time)
/plugin marketplace add tambo-ai/tambo/claude-plugin

# Step 2: Install the plugin
/plugin install tambo
```

## Available Skills

| Skill                         | Description                                  | Triggers                                                  |
| ----------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `tambo:generative-components` | Create components dynamically rendered by AI | "create component", "register component", "TamboProvider" |
| `tambo:mcp-integration`       | Set up MCP servers with Tambo                | "MCP", "model context protocol", "external tools"         |
| `tambo:streaming-patterns`    | Implement streaming UIs                      | "streaming", "partial props", "loading states"            |
| `tambo:component-state`       | Manage persistent component state            | "useTamboComponentState", "state persistence"             |
| `tambo:interactables`         | Create pre-placed UI connected to Tambo      | "withInteractable", "bidirectional"                       |
| `tambo:tools`                 | Register tools Tambo can call                | "register tool", "useTamboRegistry"                       |
| `tambo:cli`                   | Project setup and component management       | "tambo init", "tambo add", "tambo auth"                   |

## Usage

Invoke skills directly:

```
/tambo:generative-components    # Help with component creation
/tambo:mcp-integration          # Help with MCP setup
/tambo:streaming-patterns       # Help with streaming UIs
/tambo:component-state          # Help with state management
/tambo:interactables            # Help with interactable components
/tambo:tools                    # Help with tool registration
/tambo:cli                      # Help with CLI commands
```

Or let Claude automatically select the relevant skill based on your question.

## Managing the Plugin

```bash
/plugin enable tambo            # Enable if disabled
/plugin disable tambo           # Temporarily disable
/plugin uninstall tambo         # Remove completely
```

## Links

- [Documentation](https://docs.tambo.co)
- [Component Showcase](https://ui.tambo.co)
- [GitHub](https://github.com/tambo-ai/tambo)
