---
name: dev-worktrees
description: Creates git worktree workspaces for isolated development. Accepts Linear issue IDs (e.g., TAM-1234) or task descriptions to generate properly named branches. Handles worktree creation, Claude settings symlink, and dependency installation. Triggers on "new workspace", "create worktree", "start working on TAM-XXXX", or requests to set up an isolated dev environment.
---

# Dev Worktrees

Create a git worktree with proper branch naming, Claude settings sync, and dependency installation.

## Input

- **Linear issue ID** (matches `<linear_prefix>-\d+`, case-insensitive): Fetch issue title from Linear, build branch name from it.
- **Task description** (any other text): Generate a kebab-case branch name from the description.
- **No input**: Ask what they're working on before continuing.

## Preferences

Stored in `<main-repo>/.claude/dev-worktrees.local.md` as YAML frontmatter. Read at start of every run; use defaults silently if file is missing. Do not create automatically.

```markdown
---
worktree_base: /Users/lachlan/.claude-worktrees/tambo
linear_prefix: TAM
install_command: npm install
---
```

| Key               | Default                                    | Description                                            |
| ----------------- | ------------------------------------------ | ------------------------------------------------------ |
| `worktree_base`   | `$HOME/.claude-worktrees/<repo-basename>/` | Absolute path where worktrees are created (no `~`)     |
| `linear_prefix`   | `TAM`                                      | Linear issue prefix (case-insensitive)                 |
| `install_command` | `npm install`                              | Dependency install command, executed as-is in worktree |

If a user asks to change a preference, update or create the file in the main repo, preserving other values. Always write `worktree_base` as a fully resolved absolute path.

## Workflow

### 1. Get GitHub username

```bash
op plugin run -- gh api user -q .login
```

### 2. Build branch name

**Linear issue** (e.g., `TAM-1234`):

1. Fetch with `mcp__linear__get_issue` using the issue identifier.
2. Branch: `<username>/<issue-id-lowercase>-<kebab-title>`
   Example: `TAM-1234` with title "Add Dark Mode Toggle" → `lachieh/tam-1234-add-dark-mode-toggle`

**Task description**:

1. Convert to kebab-case, truncate description to ~60 chars.
2. Branch: `<username>/<kebab-description>`
   Example: "fix login redirect" → `lachieh/fix-login-redirect`

### 3. Resolve paths

Run `git worktree list` to find the main repo path (entry on `main` branch).

Worktree path: `<worktree_base>/<branch-name-without-username-prefix>`
Example: branch `lachieh/tam-1234-add-dark-mode` → `<worktree_base>/tam-1234-add-dark-mode`

### 4. Create worktree

```bash
git fetch origin main
git worktree add <worktree-path> -b <branch-name> origin/main
```

If the branch already exists, ask to check out the existing branch instead.

### 5. Symlink Claude settings

Link `<main-repo>/.claude/settings.local.json` into the worktree. Both paths must be fully resolved absolutes from `git worktree list`.

```bash
mkdir -p "<worktree-path>/.claude"

TARGET="<main-repo>/.claude/settings.local.json"
LINK="<worktree-path>/.claude/settings.local.json"

if [ ! -e "$TARGET" ]; then
  claudeSettingsStatus="skipped (missing settings)"
elif [ -e "$LINK" ] && [ ! -L "$LINK" ]; then
  echo "Warning: $LINK exists and is not a symlink; skipping" >&2
  claudeSettingsStatus="skipped (conflict)"
else
  ln -sf "$TARGET" "$LINK" || { echo "Symlink failed; aborting" >&2; exit 1; }
  claudeSettingsStatus="symlinked"
fi
```

Status is exactly one of: `symlinked`, `skipped (missing settings)`, `skipped (conflict)`. On symlink failure, abort — do not print the summary.

### 6. Install dependencies

`install_command` is a local preference and may include shell metacharacters (e.g., `&&`). Treat `.claude/dev-worktrees.local.md` as trusted-local-only input and execute `install_command` via a shell in the worktree directory (do not attempt to split it into argv tokens).

```bash
(cd "<worktree-path>" && <install_command>)
```

### 7. Print summary

```
Workspace ready:

  worktree:        <full-worktree-path>
  branch:          <full-branch-name>
  node modules:    installed
  claude settings: <claudeSettingsStatus>
```
