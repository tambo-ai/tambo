# AGENTS.md - cli-v1 (tambov1)

**Read root @../AGENTS.md` first.** This adds cli-v1-specific rules.

## What This Is

Non-interactive-first CLI for Tambo. Will replace `cli/`. Executable: `tambov1`.

**Philosophy:** Non-interactive always works. Interactive is sugar for humans.

## Key Files

- `src/cli.ts` - entry point, command routing
- `src/commands/` - command implementations
- `src/utils/` - utilities (output.ts, tty.ts, etc.)
- `src/constants/` - shared constants
- `src/templates/` - project templates

## Core Rules

- **TTY detection:** Use `process.stdout.isTTY` - prompts only when TTY present
- **Non-interactive first:** Every command works without prompts when given proper args
- **Structured results:** Return typed object with `success`, `errors`, command-specific fields
- **Never throw** from command handlers
- **JSON output:** Data commands must support `--json`
- **ESM only:** Built as ESM module

## Patterns

- **Framework:** Use citty's `defineCommand`
- **Output:** All console output through `src/utils/output.ts`
- **Imports:** Minimize imports from `cli/`
- **Errors:** Include `suggestedCommands`, use `getSafeErrorMessage()` to redact paths

## Command Naming

- **Verbs** for actions: `init`, `install`, `create-app`
- **Nouns with subcommands** for resources: `auth login`, `project list`

## Development Process

Doc-first approach: write docs before code (see ../docs/AGENTS.md).

## Testing

**Non-interactive safety (CRITICAL):**
Commands using `inquirer.prompt` MUST have tests verifying:

- `inquirer.prompt` never called when `isTTY()` is false
- Returns guidance JSON instead of hanging when args missing
- Completes successfully when all required args provided

See `src/__tests__/non-interactive-safety.test.ts` for required tests.
Canonical examples: `init.test.ts`, `create-app.test.ts`

**Patterns:**

- Use `memfs` for filesystem mocking
- Mock external deps: `child_process`, `inquirer`, network calls
- Test both success and error cases

## Adding a Command

1. Create `src/commands/your-command.ts` using `defineCommand`
2. Return structured result object
3. Support `--json` if returning data
4. Add to `src/cli.ts` subCommands
5. Add unit tests (including non-interactive safety if using prompts)

**Non-interactive-first, human-second.**
