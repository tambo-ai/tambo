---
title: "release-please not updating package-lock.json for interdependencies"
category: "build-errors"
tags:
  - release-please
  - monorepo
  - workspace-dependencies
  - package-lock.json
  - npm
  - versioning
  - ci-cd
  - turborepo
severity: high
component: release-please configuration
symptoms:
  - package-lock.json not updated when release-please bumps workspace package versions
  - CI pipeline forced to use npm install instead of npm ci
  - Inconsistent lockfile state in repository
  - Version mismatches between package.json and package-lock.json
date_documented: 2026-01-24
---

# release-please not updating package-lock.json for interdependencies

## Problem

When release-please creates release PRs that bump package versions in a Turborepo monorepo, the root `package-lock.json` is not updated to reflect the new versions for workspace packages.

### Symptoms

- `npm ci` fails on release PRs with version mismatch errors
- CI requires `frozen: false` workaround to use `npm install` instead
- Non-deterministic builds due to `npm install` resolving different versions
- Local/CI environment mismatches

### Original Workaround

```yaml
# .github/actions/setup-tools/action.yml
- name: Setup tools
  uses: ./.github/actions/setup-tools
  with:
    frozen: false # Workaround for release-please lockfile bug
```

## Root Cause

The `release-please-config.json` was missing the `node-workspace` plugin. This plugin is specifically designed to:

1. Build a dependency graph of workspace packages
2. Propagate version updates to dependent packages
3. Update `package-lock.json` workspace entries

Without it, release-please updates `package.json` files but leaves the lockfile out of sync.

## Solution

### Step 1: Add node-workspace Plugin

Add the plugin to `release-please-config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/refs/heads/main/schemas/config.json",
  "always-link-local": true,
  "separate-pull-requests": true,
  "always-update": true,
  "plugins": [
    {
      "type": "node-workspace",
      "updatePeerDependencies": true
    }
  ],
  "packages": {
    "react-sdk": { "component": "react" }
    // ... other packages
  }
}
```

### Step 2: Add Backup Sync Workflow

Create `.github/workflows/sync-lockfile.yml` as a safety net:

```yaml
name: Sync Package Lock

on:
  pull_request:
    types: [labeled, synchronize]
    branches: [main]

jobs:
  sync-lockfile:
    if: "${{ contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}"
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          token: ${{ secrets.RELEASE_PLEASE_TOKEN }}

      - uses: ./.github/actions/setup-tools
        with:
          frozen: false

      - name: Regenerate package-lock.json
        run: npm install --package-lock-only

      - name: Check for changes
        id: check
        run: |
          if git diff --quiet package-lock.json; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit lockfile changes
        if: steps.check.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package-lock.json
          git commit -m "chore: sync package-lock.json"
          git push
```

### Step 3: Remove CI Workaround

Remove `frozen: false` from CI workflows. The setup-tools action defaults to `frozen: true` (uses `npm ci`).

## Why This Works

1. **node-workspace plugin** understands Turborepo workspace dependencies and updates internal package references when versions change

2. **Backup sync workflow** runs on release PRs (identified by `autorelease: pending` label), regenerates the lockfile, and commits changes if needed

3. **Combined effect**: Release PRs have fully synced `package.json` and `package-lock.json` files, so CI passes with deterministic `npm ci`

## Prevention

### Warning Signs

- CI fails on release PRs with `ERESOLVE` errors
- `frozen: false` workarounds appearing in CI config
- Sync-lockfile workflow making no changes when it should
- Manual lockfile regeneration becoming necessary

### Monitoring

```bash
# Verify lockfile is in sync locally
npm install --package-lock-only
git diff package-lock.json  # Should show no changes if in sync
```

### Configuration Checklist

- [ ] `node-workspace` plugin enabled with `updatePeerDependencies: true`
- [ ] `always-link-local: true` set
- [ ] `always-update: true` set
- [ ] Backup sync workflow in place
- [ ] CI uses `npm ci` (no `frozen: false` workarounds)

## Related Files

- `release-please-config.json` - Main configuration
- `.release-please-manifest.json` - Version tracking
- `.github/workflows/release-please.yml` - Release workflow
- `.github/workflows/sync-lockfile.yml` - Backup sync workflow
- `.github/actions/setup-tools/action.yml` - CI setup action
- `RELEASING.md` - Release documentation

## References

- [release-please issue #1993: Root package-lock.json not updated](https://github.com/googleapis/release-please/issues/1993)
- [release-please manifest docs](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)
- [node-workspace plugin source](https://github.com/googleapis/release-please/blob/main/src/plugins/node-workspace.ts)
