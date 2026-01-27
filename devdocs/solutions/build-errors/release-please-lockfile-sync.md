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

In `release-please-config.json`, add the `node-workspace` plugin with `updatePeerDependencies: true`. Also ensure `always-link-local: true` and `always-update: true` are set.

### Step 2: Add Backup Sync Workflow

Create `.github/workflows/sync-lockfile.yml` that:

- Triggers on `pull_request` events (`labeled`, `synchronize`) targeting `main`
- Only runs on PRs from release-please bot with "autorelease: pending" label
- Runs `npm install --package-lock-only` to regenerate the lockfile
- Commits and pushes changes if the lockfile was modified

### Step 3: Remove CI Workaround

Remove any `frozen: false` workarounds from CI workflows. The setup-tools action defaults to `frozen: true` (uses `npm ci`).

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
