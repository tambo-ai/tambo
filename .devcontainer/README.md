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
3. Wait for the container to build and `npm install` to complete

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

All containers connect to Supabase PostgreSQL on your host via `host.docker.internal:54322`. The `DATABASE_URL` is pre-configured.

## Cleanup

Remove a worktree when done:

```bash
# From main repo
git worktree remove ../tambo-feature-x
```

The associated devcontainer will be cleaned up automatically when you close the window.
