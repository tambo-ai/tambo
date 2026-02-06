---
name: dev-worktrees
description: "This skill should be used when creating a new git worktree workspace for development. It accepts an optional Linear issue ID (e.g., TAM-1234) or task description to generate a properly named branch. It creates the worktree, symlinks Claude settings, installs dependencies, and prints a formatted summary. Triggers on 'new workspace', 'create worktree', 'start working on TAM-XXXX', or any request to set up a new isolated development environment."
---

# Dev Worktrees

Create a new git worktree with proper branch naming, Claude settings sync, and dependency installation.

## Input Handling

The skill receives optional input after the command:

- **Linear issue ID** (matches pattern `<linear_prefix>-\d+`, case-insensitive): Fetch the issue title from Linear and build a branch name from it.
- **Task description** (any other text): Generate a kebab-case branch name from the description.
- **No input**: Ask the user what they're working on before continuing. Do not proceed until they provide a Linear issue ID or task description.

## Preferences

User preferences are stored in `.claude/dev-worktrees.local.md` in the **main repo** (not in worktrees). This file is created once and persists across sessions.

### Preferences file format

```markdown
---
worktree_base: /Users/lachlan/.claude-worktrees/tambo
linear_prefix: TAM
install_command: npm install
---
```

### Available preferences

| Key | Default | Description |
|-----|---------|-------------|
| `worktree_base` | (see below) | Absolute path where worktrees are created. Must be a fully resolved path — no `~` or `$HOME`. |
| `linear_prefix` | `TAM` | Linear issue prefix to match (case-insensitive) |
| `install_command` | `npm install` | Command to install dependencies |

### Loading preferences

At the start of every run, check if `<main-repo>/.claude/dev-worktrees.local.md` exists. If it does, read the YAML frontmatter and use the values as overrides for the defaults above. If it does not exist, use the defaults silently — do not create the file automatically.

### Setting preferences

If the user asks to change a preference (e.g., "use a different worktree directory"), update or create `.claude/dev-worktrees.local.md` in the main repo with the new value, preserving any other existing preferences.

**Important:** `worktree_base` must always be written as a fully resolved absolute path (e.g., `/Users/jane/.claude-worktrees/tambo`). Never write `~`, `$HOME`, or any other unexpanded variable into the value.

## Workflow

### 1. Determine GitHub Username

Run the following to get the GitHub username:

```bash
op plugin run -- gh api user -q .login
```

### 2. Build the Branch Name

#### If Linear issue (e.g., `TAM-1234`):

1. Fetch the issue using the `mcp__linear__get_issue` tool with the issue identifier (e.g., `TAM-1234`).
2. Extract the issue title from the response.
3. Convert the title to kebab-case: lowercase, replace spaces and special characters with hyphens, collapse consecutive hyphens, trim leading/trailing hyphens.
4. Construct the branch name: `<github-username>/<issue-id-lowercase>-<kebab-title>`
   - Example: Input `TAM-1234`, title "Add Dark Mode Toggle" → `lachieh/tam-1234-add-dark-mode-toggle`

#### If task description:

1. Convert the description to kebab-case using the same rules above.
2. Truncate to a reasonable length (max ~60 chars for the description portion).
3. Construct the branch name: `<github-username>/<kebab-description>`
   - Example: Input "fix login redirect" → `lachieh/fix-login-redirect`

### 3. Determine Paths

Run `git worktree list` to find:

- **Main repo path**: The entry on the `main` branch (this is the primary repo, not a worktree).
- **Worktree base directory**: Use the `worktree_base` preference if set. Otherwise resolve the default: `$HOME/.claude-worktrees/<main-repo-basename>/`.

Derive the **worktree directory name** from the branch name by stripping the `<username>/` prefix:
- Branch `lachieh/tam-1234-add-dark-mode` → directory name `tam-1234-add-dark-mode`

Full worktree path: `<worktree-base>/<directory-name>`

### 4. Create the Worktree

```bash
git fetch origin main
git worktree add <worktree-path> -b <branch-name> origin/main
```

If the branch already exists, ask the user if they want to check out the existing branch instead.

### 5. Symlink Claude Settings

Check if `<main-repo>/.claude/settings.local.json` exists.

If it exists:

```bash
mkdir -p <worktree-path>/.claude
ln -s <main-repo>/.claude/settings.local.json <worktree-path>/.claude/settings.local.json
```

If it does not exist, skip silently. Record the result for the summary.

### 6. Install Dependencies

Run the `install_command` preference (default: `npm install`) in the worktree directory:

```bash
npm install --prefix <worktree-path>
```

### 7. Print Summary

Print a clean formatted summary:

```
Workspace ready:

  worktree:        <full-worktree-path>
  branch:          <full-branch-name>
  node modules:    installed
  claude settings: <symlinked | not found (skipped)>
```
