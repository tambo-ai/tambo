# Tambo Plugin for Claude Code

Build agents that speak your UI.

## Installation

```bash
# Add the marketplace and install (one time)
/plugin marketplace add https://github.com/tambo-ai/tambo
/plugin install tambo
```

## Available Skills

| Skill                    | Description                             | Triggers                                     |
| ------------------------ | --------------------------------------- | -------------------------------------------- |
| `tambo:generative-ui`    | Build generative UI apps from scratch   | "new project", "generative UI", "create app" |
| `tambo:build-with-tambo` | Build with Tambo in existing React apps | "add Tambo", "existing project", "integrate" |

## Usage

Skills are automatically selected based on your question, or invoke directly:

```
/tambo:generative-ui              # Build new generative UI apps
/tambo:build-with-tambo           # Build with Tambo in existing projects
```

Deeper implementation guides are linked from `build-with-tambo` and live in `plugins/tambo/skills/build-with-tambo/references/` (components, rendering, threads, tools/context, CLI, and registry workflows).

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
