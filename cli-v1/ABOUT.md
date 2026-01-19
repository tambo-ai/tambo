# CLI Comparison: cli/ vs cli-v1/

Comparison of the original CLI (`tambo`) and the new agent-first CLI (`tambov1`).

---

## Executive Summary

**cli-v1/** is an **agent-first rewrite** that inverts the traditional CLI paradigm:

| Traditional CLI (cli/)  | Agent-First CLI (cli-v1/)             |
| ----------------------- | ------------------------------------- |
| Interactive is default  | Non-interactive is default            |
| `--yes` to skip prompts | Prompts only when TTY detected        |
| Returns text output     | Returns structured JSON               |
| Fails silently or hangs | Fails fast with guidance              |
| Human-centric           | Agent-centric with human enhancements |

**Core Philosophy:** Non-interactive always works. Interactive is sugar on top for humans.

**Current Status:** cli-v1/ is fully self-contained and ready to replace cli/.

---

## Design Principles

### 1. Non-Interactive by Default

Every command MUST work without any user interaction when given proper arguments. Interactive prompts are convenience features for humans, not requirements.

When running without a TTY (pipes, CI, agents):

- Commands never hang waiting for input
- Missing required args return structured guidance JSON
- All output is machine-parseable

When running with a TTY (human terminal):

- Commands offer interactive prompts with sensible defaults
- Colorful output with spinners and progress indicators
- Guided wizards for complex operations

### 2. Structured Results Always

Every command returns a typed result object:

```typescript
{
  success: boolean;
  errors: string[];
  // command-specific fields
  suggestedCommands: CommandSuggestion[];
}
```

### 3. Fail Fast with Guidance

When required arguments are missing in non-interactive mode, commands return guidance instead of failing silently:

```json
{
  "success": false,
  "reason": "interactive_required",
  "status": { ... },
  "guidance": {
    "description": "What needs to happen",
    "stepsNeeded": ["Step 1", "Step 2"],
    "commands": [{ "command": "...", "description": "..." }],
    "allInOne": { "command": "...", "description": "..." }
  }
}
```

### 4. JSON Output for Data Commands

All commands returning data support `--json` for machine parsing. Action-only commands (like `auth logout`) output minimal JSON.

### 5. TTY-Adaptive Output

- **TTY present:** Colors, spinners, formatted tables, progress bars
- **No TTY:** Plain text, no ANSI codes, structured output

### 6. Suggested Next Commands

Every successful result includes actionable next steps, enabling agents to chain operations.

---

## TTY Detection Logic

cli-v1 determines interactive mode using this logic:

```typescript
// src/utils/tty.ts
function isTTY(): boolean {
  if (!process.stdout.isTTY) return false; // No terminal attached
  if (process.env.CI) return false; // CI environment detected
  if (process.env.TERM === "dumb") return false; // Dumb terminal
  return true;
}
```

**Override mechanisms:**

- `--no-interactive` global flag: Force non-interactive even in TTY
- `FORCE_INTERACTIVE=1` env var: Force interactive (testing only)

---

## Architecture Differences

| Aspect          | cli/ (tambo)       | cli-v1/ (tambov1)               |
| --------------- | ------------------ | ------------------------------- |
| CLI Framework   | meow               | citty                           |
| Prompts         | inquirer (ad-hoc)  | inquirer (behind TTY guards)    |
| Output          | chalk/ora (always) | TTY-adaptive (plain in non-TTY) |
| JSON Output     | Partial            | All data commands               |
| Non-interactive | `--yes` flag       | First-class, auto-detected      |
| Global Override | None               | `--no-interactive` flag         |
| Self-contained  | Yes                | Yes                             |

---

## Command Reference

### Global Flags

These flags work on all commands:

| Flag               | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `--no-interactive` | Disable interactive prompts even in TTY environments |
| `--help`           | Show help for command                                |
| `--version`        | Show CLI version                                     |

---

### Core Commands

Commands for project setup and component management.

| Command                        | Purpose                              | JSON | Dry-run |
| ------------------------------ | ------------------------------------ | :--: | :-----: |
| `tambov1 init`                 | Initialize Tambo in existing project |  ✓   |    ✓    |
| `tambov1 init config`          | Create tambo.ts config only          |  ✓   |         |
| `tambov1 init skill`           | Install tambo skill only             |  ✓   |         |
| `tambov1 full-send`            | Alias for `init`                     |  ✓   |    ✓    |
| `tambov1 install <components>` | Install component(s)                 |  ✓   |    ✓    |
| `tambov1 update [components]`  | Update installed components          |  ✓   |         |
| `tambov1 create-app <name>`    | Create new app from template         |  ✓   |    ✓    |
| `tambov1 create-app templates` | List available templates             |  ✓   |         |
| `tambov1 migrate`              | Migrate ui/ to tambo/                |  ✓   |    ✓    |

**init flags:**

- `--yes, -y` - Run non-interactively (requires `--project-name`)
- `--project-name <name>` - Project name for Tambo Cloud
- `--prefix <path>` - Custom component directory (default: `src/components`)
- `--skip-agent-docs` - Skip installing tambo skill
- `--dry-run` - Preview without making changes
- `--json` - Output as JSON

**install flags:**

- `--prefix <path>` - Custom component directory
- `--legacy-peer-deps` - Use `--legacy-peer-deps` for npm
- `--skip-agent-docs` - Skip installing tambo skill
- `--skip-tailwind` - Skip Tailwind CSS configuration
- `--dry-run` - Preview without installing
- `--json` - Output as JSON

**create-app flags:**

- `--template <name>` - Template to use (`standard`, `analytics`)
- `--install-deps` / `--no-install-deps` - Control dependency installation
- `--init-git` - Initialize git repository
- `--dry-run` - Preview without creating
- `--json` - Output as JSON

---

### Component Management

| Command                          | Purpose                          | JSON |
| -------------------------------- | -------------------------------- | :--: |
| `tambov1 components installed`   | List installed components        |  ✓   |
| `tambov1 components available`   | List all available components    |  ✓   |
| `tambov1 components deps <name>` | Show component dependencies      |  ✓   |
| `tambov1 list`                   | Alias for `components installed` |  ✓   |

---

### Upgrade Commands

Full upgrade functionality with granular subcommands.

| Command                      | Purpose                                            | JSON |
| ---------------------------- | -------------------------------------------------- | :--: |
| `tambov1 upgrade packages`   | Upgrade npm packages (@tambo-ai/react, etc.)       |  ✓   |
| `tambov1 upgrade components` | Upgrade installed Tambo components                 |  ✓   |
| `tambov1 upgrade skill`      | Install/upgrade tambo skill for AI agents          |  ✓   |
| `tambov1 upgrade all`        | Upgrade everything (packages + components + skill) |  ✓   |

**Common upgrade flags:**

- `--legacy-peer-deps` - Use `--legacy-peer-deps` for npm
- `--prefix <path>` - Custom component directory
- `--skip-agent-docs` - Skip skill installation (upgrade all only)
- `--json` - Output as JSON

---

### Authentication Commands

| Command                       | Purpose                          | JSON | Notes                 |
| ----------------------------- | -------------------------------- | :--: | --------------------- |
| `tambov1 auth status`         | Check authentication status      |  ✓   |                       |
| `tambov1 auth login`          | Start device authentication flow |  ✓   | See `--no-wait` below |
| `tambov1 auth logout`         | Clear stored token               |  ✓   |                       |
| `tambov1 auth sessions`       | List active sessions             |  ✓   |                       |
| `tambov1 auth revoke-session` | Revoke a session                 |  ✓   | `--all` to revoke all |

**auth login flags:**

- `--no-wait` - **Agent-friendly:** Return immediately with verification URL instead of waiting for completion
- `--json` - Output as JSON

The `--no-wait` flag is critical for agents:

```bash
# Agent can start auth, get URL, present to user, then poll status
tambov1 auth login --no-wait --json
# Returns: { "verificationUrl": "...", "userCode": "...", "deviceCode": "..." }
```

---

### Project Management Commands

| Command                         | Purpose                       | JSON |
| ------------------------------- | ----------------------------- | :--: |
| `tambov1 project list`          | List all Tambo Cloud projects |  ✓   |
| `tambov1 project create <name>` | Create new project            |  ✓   |
| `tambov1 project api-key <id>`  | Generate API key for project  |  ✓   |

**project api-key flags:**

- `--save` - Save API key to .env file (default: true)
- `--no-save` - Output API key without saving
- `--json` - Output as JSON

---

## Command Mapping from cli/

| Feature            | cli/ (tambo)                | cli-v1/ (tambov1)                | Notes               |
| ------------------ | --------------------------- | -------------------------------- | ------------------- |
| Initialize project | `tambo init`                | `tambov1 init`                   | Same                |
| Full setup         | `tambo full-send`           | `tambov1 full-send`              | Same                |
| Add components     | `tambo add <component>`     | `tambov1 install <component>`    | **Renamed**         |
| List installed     | `tambo list`                | `tambov1 components installed`   | Structure changed   |
| List available     | (part of add)               | `tambov1 components available`   | **New**             |
| Show deps          | N/A                         | `tambov1 components deps <name>` | **New**             |
| Update components  | `tambo update`              | `tambov1 update`                 | Same                |
| Upgrade packages   | `tambo upgrade`             | `tambov1 upgrade packages`       | Subcommand          |
| Upgrade components | `tambo upgrade`             | `tambov1 upgrade components`     | Subcommand          |
| Upgrade skill      | `tambo upgrade`             | `tambov1 upgrade skill`          | Subcommand          |
| Upgrade all        | `tambo upgrade`             | `tambov1 upgrade all`            | Explicit subcommand |
| Create app         | `tambo create-app`          | `tambov1 create-app`             | Same                |
| List templates     | N/A                         | `tambov1 create-app templates`   | **New**             |
| Migrate ui/→tambo/ | `tambo migrate`             | `tambov1 migrate`                | Same                |
| Auth login         | `tambo auth login`          | `tambov1 auth login`             | Added `--no-wait`   |
| Auth logout        | `tambo auth logout`         | `tambov1 auth logout`            | Same                |
| Auth status        | `tambo auth status`         | `tambov1 auth status`            | Same                |
| Auth sessions      | `tambo auth sessions`       | `tambov1 auth sessions`          | Same                |
| Auth revoke        | `tambo auth revoke-session` | `tambov1 auth revoke-session`    | Same                |
| Create project     | N/A                         | `tambov1 project create`         | **New**             |
| List projects      | N/A                         | `tambov1 project list`           | **New**             |
| Generate API key   | N/A                         | `tambov1 project api-key`        | **New**             |
| Create config only | N/A                         | `tambov1 init config`            | **New**             |
| Install skill only | N/A                         | `tambov1 init skill`             | **New**             |

---

## Breaking Changes (if replacing cli/)

### 1. Command Renames

```bash
# OLD (cli/)
tambo add message-thread-full

# NEW (cli-v1/)
tambov1 install message-thread-full
```

### 2. List Command Structure

```bash
# OLD (cli/)
tambo list              # Lists installed components

# NEW (cli-v1/)
tambov1 components installed   # Lists installed
tambov1 components available   # Lists all available
tambov1 list                   # Alias for components installed
```

### 3. Non-Interactive Behavior

**cli/** with `--yes`:

- Auto-selects defaults
- Still runs device auth (displays user code)
- Continues with sensible defaults

**cli-v1/** without TTY:

- Returns JSON guidance when required args are missing
- Requires explicit flags (`--project-name`, etc.)
- Never hangs, never prompts
- Use `--no-interactive` to force this behavior even in TTY

---

## Framework Detection

cli-v1 automatically detects the project framework and applies appropriate configuration.

**Supported Frameworks:**

| Framework        | Detection Method                            | Env Prefix           | Default CSS Path        |
| ---------------- | ------------------------------------------- | -------------------- | ----------------------- |
| Next.js          | `next` package or `next.config.*`           | `NEXT_PUBLIC_`       | `app/globals.css`       |
| Remix            | `@remix-run/*` packages or `remix.config.*` | `null` (server-side) | `app/tailwind.css`      |
| React Router 7   | `react-router` + `react-router.config.*`    | `VITE_`              | `app/app.css`           |
| Astro            | `astro` package or `astro.config.*`         | `PUBLIC_`            | `src/styles/global.css` |
| Vite             | `vite` package or `vite.config.*`           | `VITE_`              | `src/index.css`         |
| Create React App | `react-scripts` package                     | `REACT_APP_`         | `src/index.css`         |

**Detection Order:** More specific frameworks checked first (Next.js → Remix → React Router → Astro → Vite → CRA)

**Key Functions:**

- `detectFramework()` - Returns framework config or null
- `getEnvVarName(baseName)` - Applies correct prefix (e.g., `TAMBO_API_KEY` → `NEXT_PUBLIC_TAMBO_API_KEY`)
- `getGlobalsCssLocations()` - Returns framework-specific CSS search paths
- `findOrGetGlobalsCssPath()` - Finds existing CSS or returns default

---

## Guidance System

When commands are run in non-interactive mode without required arguments, cli-v1 returns structured guidance instead of failing.

### Example: `tambov1 init` Without Required Args

```bash
# Running in CI or piped
tambov1 init --json
```

**Output:**

```json
{
  "success": false,
  "reason": "interactive_required",
  "status": {
    "hasPackageJson": true,
    "hasTamboReact": false,
    "hasTamboTs": false,
    "authenticated": false,
    "hasApiKey": false,
    "hasAgentDocs": false,
    "packageManager": "npm"
  },
  "guidance": {
    "description": "Initialize Tambo in this project",
    "stepsNeeded": [
      "Install @tambo-ai/react",
      "Authenticate with Tambo Cloud",
      "Create project and generate API key",
      "Create config files"
    ],
    "commands": [
      {
        "command": "npm install @tambo-ai/react",
        "description": "Install Tambo React SDK",
        "needed": true
      },
      {
        "command": "tambov1 auth login",
        "description": "Authenticate with Tambo Cloud",
        "needed": true
      },
      {
        "command": "tambov1 project create my-project",
        "description": "Create project in Tambo Cloud",
        "needed": true
      },
      {
        "command": "tambov1 project api-key <project-id>",
        "description": "Generate and save API key (use project ID from previous step)",
        "needed": true
      },
      {
        "command": "tambov1 init config",
        "description": "Create tambo.ts",
        "needed": true
      }
    ],
    "allInOne": {
      "command": "tambov1 init --yes --project-name=my-project",
      "description": "Run full initialization non-interactively"
    }
  }
}
```

### Guidance for `create-app`

```json
{
  "description": "Create a new Tambo app from a template",
  "templates": [
    { "name": "standard", "description": "Tambo + Tools + MCP (recommended)" },
    { "name": "analytics", "description": "Generative UI Analytics Template" }
  ],
  "commands": [
    {
      "command": "tambov1 create-app my-app --template=standard",
      "description": "Create app with standard template"
    },
    {
      "command": "tambov1 create-app my-app --template=analytics",
      "description": "Create app with analytics template"
    }
  ],
  "options": {
    "--install-deps": "Install dependencies (default: true)",
    "--no-install-deps": "Skip dependency installation",
    "--init-git": "Initialize git repository",
    "--json": "Output results as JSON"
  }
}
```

---

## Agent Integration Examples

### Check Project State

```bash
# Get installed components as JSON
tambov1 components installed --json | jq '.components[]'

# Check if specific component is installed
tambov1 components installed --json | jq '.components | map(select(.name == "message-thread-full")) | length > 0'
```

### Initialize Project (Non-Interactive)

```bash
# Full initialization with all required args
tambov1 init --yes --project-name=my-app --json

# Or step by step
tambov1 auth login --no-wait --json  # Get verification URL
# ... user completes auth ...
tambov1 project create my-app --json
tambov1 project api-key <project-id> --json
tambov1 init config --json
tambov1 init skill --json
```

### Install Components

```bash
# Install with dependency resolution
tambov1 install message-thread-full --json

# Preview what would be installed
tambov1 install message-thread-full --dry-run --json | jq '.components, .dependencies'

# Install multiple components
tambov1 install message message-input thread-history --json
```

### Upgrade Workflow

```bash
# Check what needs upgrading (using update for components)
tambov1 components installed --json

# Upgrade packages first
tambov1 upgrade packages --json

# Then components
tambov1 upgrade components --json

# Or do everything at once
tambov1 upgrade all --json
```

---

## Functionality Comparison

### 1. Self-Hosted Mode

cli/ has self-hosted option. **cli-v1/ only supports cloud mode.**

### 2. Interactive Component Selection

cli/'s `full-send` can prompt for starter components. **cli-v1/** runs init directly (simpler flow).

### 3. Version Update Check

Both cli/ and cli-v1/ check npm for newer versions on startup.

---

## Component Registry

cli-v1/ has its own component registry in `src/registry/` with 19 components:

| Component                      | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `message`                      | Single message display with markdown rendering |
| `message-input`                | Text input with dictation and MCP config       |
| `message-suggestions`          | AI-generated message suggestions               |
| `message-thread-full`          | Complete thread UI (depends on many others)    |
| `message-thread-panel`         | Collapsible thread panel                       |
| `message-thread-collapsible`   | Collapsible thread variant                     |
| `thread-content`               | Thread content display                         |
| `thread-history`               | Thread history navigation                      |
| `thread-dropdown`              | Thread selection dropdown                      |
| `scrollable-message-container` | Auto-scrolling message container               |
| `canvas-space`                 | Canvas for generative UI                       |
| `control-bar`                  | Control bar UI                                 |
| `edit-with-tambo-button`       | Edit trigger button                            |
| `elicitation-ui`               | Elicitation/form UI                            |
| `form`                         | Dynamic form component                         |
| `input-fields`                 | Input field components                         |
| `graph`                        | Graph visualization                            |
| `map`                          | Map visualization                              |
| `mcp-components`               | MCP integration components                     |

Each component has:

- `config.json` with dependencies and requirements
- Source files (`.tsx`)
- Automatic dependency resolution via `requires` field

---

### Future Enhancements

1. **Self-hosted mode** - Add support for running local environment and connecting to it for management.
2. **Machine-readable error codes** - Standardized error taxonomy

### Skill Installation via Marketplace (TODO)

**Current implementation:** `tambov1 upgrade skill` copies bundled skill files from CLI package to user's project using `fs.cpSync`.

**Future implementation:** Once the tambo skill is published to a skill marketplace (e.g., `openskills`, `ai-agent-skills`, or Anthropic's official marketplace), replace the current copy logic with marketplace installation:

```bash
# Current (bundled copy)
fs.cpSync(skillSourceDir, targetDir, { recursive: true })

# Future (marketplace)
npx ai-agent-skills install tambo
# or
npx openskills install tambo-ai/tambo-skill
```

**Benefits of marketplace approach:**

- Users get skill updates without CLI upgrade
- Skill versioning independent of CLI versioning
- Discoverability in marketplace listings
- Standard installation across all compatible agents (Claude, Cursor, VS Code, etc.)

**Packages to evaluate:**

- [`openskills`](https://github.com/numman-ali/openskills) - Universal skills loader, same format as Claude Code
- [`ai-agent-skills`](https://libraries.io/npm/ai-agent-skills) - Homebrew for AI skills, multi-agent support
- [`give-skill`](https://libraries.io/npm/give-skill) - Install from git repos

**Migration path:**

1. Publish tambo skill to chosen marketplace
2. Replace `installSkill()` in `src/commands/shared/skill-install.ts` with marketplace install call
3. Keep `--skip-agent-docs` flag for users who prefer manual skill management

---

## Test Coverage

Tests are co-located with source files (`foo.ts` → `foo.test.ts`).

634 tests covering:

- All commands
- Non-interactive safety (critical for agents)
- JSON output parsing
- TTY/non-TTY behavior
- Guidance system output
- Framework detection
