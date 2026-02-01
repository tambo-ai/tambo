# Tambo Plugin for Claude Code

Build agents that speak your UI.

## Installation

```bash
# Add the marketplace and install (one time)
/plugin marketplace add tambo-ai/tambo/claude-plugin
/plugin install tambo
```

## Available Skills

| Skill                       | Description                                    | Triggers                                                       |
| --------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| `tambo:components`          | Create generative and interactable components  | "TamboComponent", "withInteractable", "propsSchema"            |
| `tambo:component-rendering` | Handle streaming props and persistent state    | "useTamboStreamStatus", "useTamboComponentState", "propStatus" |
| `tambo:threads`             | Manage threads, suggestions, voice, and images | "useTamboThread", "useTamboSuggestions", "useTamboVoice"       |
| `tambo:tools-and-context`   | Register tools, MCP servers, and context       | "defineTool", "MCP", "contextHelpers", "resources"             |
| `tambo:cli`                 | Project setup and component management         | "tambo init", "tambo add", "non-interactive"                   |

## Usage

Skills are automatically selected based on your question, or invoke directly:

```
/tambo:components           # Generative and interactable components
/tambo:component-rendering  # Streaming and state management
/tambo:threads              # Thread management, suggestions, voice
/tambo:tools-and-context    # Tools, MCP, context helpers
/tambo:cli                  # CLI commands
```

## Managing the Plugin

```bash
/plugin enable tambo        # Enable if disabled
/plugin disable tambo       # Temporarily disable
/plugin uninstall tambo     # Remove completely
```

## Links

- [Documentation](https://docs.tambo.co)
- [Component Showcase](https://ui.tambo.co)
- [GitHub](https://github.com/tambo-ai/tambo)
