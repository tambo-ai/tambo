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
date_updated: 2026-03-01
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
2. Propagate version updates to dependent packages' `package.json` files
3. Update `package-lock.json` workspace entries via `PackageLockJson` updaters

Without it, release-please only updates the bumped package's own `package.json` — dependents still reference the old (potentially unpublished) version, and the lockfile is left out of sync.

Note: The plugin performs targeted JSON updates to version strings in the lockfile, but does not run a full `npm install` resolution. This means integrity hashes and resolved URLs may not be fully updated. A backup sync workflow is recommended to ensure full lockfile consistency.

## Solution

### Step 1: Add node-workspace Plugin

In `release-please-config.json`, add the `node-workspace` plugin. Also ensure `always-link-local: true` is set.

```json
{
  "always-link-local": true,
  "plugins": [{ "type": "node-workspace" }]
}
```

This ensures that when a workspace dependency is bumped, all packages that depend on it get their `package.json` dependency references updated and receive a patch version bump.

### Step 2: Add Backup Sync Workflow

Create `.github/workflows/release-please-sync-lockfile.yml` that:

- Triggers on `pull_request` events (`labeled`, `synchronize`) targeting `main`
- Only runs on PRs from release-please bot with "autorelease: pending" label
- Runs `npm install --package-lock-only` to regenerate the lockfile
- Commits and pushes changes if the lockfile was modified

This acts as a safety net because the plugin's lockfile update is a targeted JSON edit, not a full `npm install` resolution pass.

### Step 3: Remove CI Workaround

Remove any `frozen: false` workarounds from CI workflows. The setup-tools action defaults to `frozen: true` (uses `npm ci`).

## Prevention

### Warning Signs

- CI fails on release PRs with `ERESOLVE` or `ETARGET` errors
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

- [ ] `node-workspace` plugin enabled in release-please config
- [ ] `always-link-local: true` set
- [ ] Backup sync workflow in place
- [ ] CI uses `npm ci` (no `frozen: false` workarounds)

## Related Files

- `.config/release-please/release-please-config.json` - Main configuration
- `.config/release-please/.release-please-manifest.json` - Version tracking
- `.github/workflows/release-please.yml` - Release workflow
- `.github/workflows/release-please-sync-lockfile.yml` - Lockfile sync workflow
- `.github/actions/setup-tools/action.yml` - CI setup action
- `RELEASING.md` - Release documentation

## References

- [release-please issue #1993: Root package-lock.json not updated](https://github.com/googleapis/release-please/issues/1993) — fixed via PRs #2088 and #2107
- [release-please issue #1939: v3 lockfile "" package not updated](https://github.com/googleapis/release-please/issues/1939) — fixed via PRs #1940 and #1969
- [release-please manifest docs](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)
- [node-workspace plugin source](https://github.com/googleapis/release-please/blob/main/src/plugins/node-workspace.ts)
