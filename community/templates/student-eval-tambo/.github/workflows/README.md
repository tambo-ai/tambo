# GitHub Actions Workflows

This directory contains CI/CD workflows for the repository.

## Workflows

### 1. CI (`ci.yml`)

**Triggers:** Automatically on push and pull requests to main/develop branches

**Jobs:**

- **Lint:** Runs ESLint if configured
- **Type Check:** Validates TypeScript types
- **Test:** Runs test suite if configured
- **Build:** Builds the Next.js application

**Environment Variables:**
The build job includes stub environment variables to allow builds to succeed without actual database or auth configuration.

### 2. Automation / Labels (`labels.yml`)

**Triggers:** Automatically on PR and issue events

**Jobs:**

- **Label Check:** Ensures PRs have at least one label
- **Auto-label:** Automatically adds labels based on changed files

### 3. Docker Build and Push (`docker.yml`)

**Triggers:** Manual only (`workflow_dispatch`)

⚠️ **IMPORTANT:** This workflow is designed for production repositories and is **intentionally disabled** for the starter template.

**Why it's disabled:**

- Template repositories don't have Dockerfiles
- No Docker registry secrets configured
- No production infrastructure assumed

**To enable this workflow:**

1. Add a `Dockerfile` to your project root
2. Configure repository secrets:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `DOCKER_REGISTRY`
3. Run manually from the Actions tab when needed

**Safety Features:**

- Only runs on manual trigger (`workflow_dispatch`)
- Includes `hashFiles('Dockerfile')` check to prevent execution if no Dockerfile exists
- Professional inputs for environment and tag selection

## Required Secrets

For the Docker workflow (when enabled):

- `DOCKER_USERNAME`: Docker registry username
- `DOCKER_PASSWORD`: Docker registry password or access token
- `DOCKER_REGISTRY`: Docker registry URL (e.g., `docker.io/yourorg`)

## Template Usage

When using this as a template:

1. ✅ CI workflow will work out of the box
2. ✅ Labels workflow will work out of the box
3. ⚠️ Docker workflow is opt-in (see above)

All checks will pass on a fresh fork without additional configuration.
