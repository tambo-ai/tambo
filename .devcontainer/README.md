# Devcontainer Setup

This devcontainer configuration supports running multiple parallel development sessions using git worktrees.

## Prerequisites

1. **Supabase**: Start the local Supabase dev stack on your host:

   ```bash
   supabase start
   ```

   Verify it's running with `supabase status` (PostgreSQL runs on port 54322)

2. **Cursor/VS Code**: Install the "Dev Containers" extension

## Using with Git Worktrees

Each worktree gets its own isolated devcontainer. This enables parallel AI agents or developers to work simultaneously without conflicts.

### Create a worktree

```bash
# From the main repo
git worktree add ../tambo-feature-x feature-branch
```

### Open in Cursor/VS Code

1. Open the worktree folder in Cursor/VS Code
2. When prompted, click "Reopen in Container"
3. Wait for the container to build and `npm ci` to complete

### Port Handling

When multiple containers run simultaneously, each tries to forward ports 8260-8263. The IDE automatically assigns alternative ports when conflicts occur:

- **First container**: 8260, 8261, 8262, 8263
- **Second container**: 8264+, or whatever is available

Check the "Ports" panel in VS Code/Cursor to see actual mappings.

### Running Dev Servers

Servers don't start automatically. Run them manually when needed:

```bash
# Tambo Cloud (web + API)
npm run dev:cloud

# React SDK (showcase + docs)
npm run dev

# Individual services
npm run dev:web      # Just Next.js web app (port 8260)
npm run dev:api      # Just NestJS API (port 8261)
npm run dev:docs     # Just docs site (port 8263)
```

### Database Connection

By default, containers connect to Supabase PostgreSQL on your host via `host.docker.internal:54322`.

If you want to use a different database, you can override `DATABASE_URL` by exporting it on your host before opening the devcontainer.

### Authentication & Configuration

The devcontainer automatically mounts your host authentication credentials so you don't need to log in again:

- **SSH keys** (`~/.ssh`) - Git operations use your existing SSH keys (read-only)
- **Git config** (`~/.gitconfig`) - Your git username, email, and settings (read-only)
- **GitHub CLI** (`~/.config/gh`) - Your `gh` authentication persists across container rebuilds
- **Claude Code** (`~/.config/claude`) - Your Claude sessions and login persist across rebuilds

**Starship prompt** is automatically configured on first container creation with a fast, minimal config optimized for large monorepos (`.config/starship.toml`). Open a new terminal to see the improved prompt with git branch, Node version, and more.

### Attaching from External Terminal

You can attach to the devcontainer from any terminal outside of VS Code/Cursor:

**Quick attach (from repo directory):**

```bash
docker exec -it $(docker ps -q --filter "label=devcontainer.local_folder=$(pwd)") bash
```

**Find and attach manually:**

```bash
# List all devcontainers
docker ps --filter "label=devcontainer.config_file"

# Attach to a specific container
docker exec -it <container-id> bash
```

**Pro tip - add an alias to your `~/.zshrc` or `~/.bashrc`:**

```bash
alias devcontainer='docker exec -it $(docker ps -q --filter "label=devcontainer.local_folder=$(pwd)") bash'
```

Then from any repo directory, just run `devcontainer` to jump into that repo's container.

## Cleanup

Remove a worktree when done:

```bash
# From main repo
git worktree remove ../tambo-feature-x
```

The associated devcontainer will be cleaned up automatically when you close the window.
