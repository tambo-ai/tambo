# fix: Label workflows not working on forked PRs

## Overview

The `automation-labels.yml` workflow fails to apply labels on PRs from forked repositories. This is a known GitHub Actions security limitation where the `pull_request` event grants only read-only `GITHUB_TOKEN` permissions for fork PRs.

## Problem Statement

When external contributors open PRs from forks:

1. The workflow triggers with `pull_request` event
2. GitHub restricts `GITHUB_TOKEN` to read-only for security (prevents malicious code from modifying the repo)
3. The `gh pr edit --add-label` command fails with: `GraphQL: Resource not accessible by integration (addLabelsToLabelable)`
4. PRs from forks have no automatic labels applied

**Affected PRs:** #1904, #1903, #1901, #1892, #1889, #1888, #1887, #1886 (all from external contributors)

## Root Cause

```yaml
# .github/workflows/automation-labels.yml (current)
on:
  pull_request: # <-- This event has read-only token for forks
    types: [opened, synchronize, reopened, edited, labeled, unlabeled]
```

Even with declared permissions:

```yaml
permissions:
  pull-requests: write # <-- GitHub overrides this to "read" for fork PRs
```

## Security Research Findings

### The `tj-actions/changed-files` Risk

The original plan assumed `tj-actions/changed-files` uses GitHub API. **This is incorrect.** According to the action's documentation:

> "Leverages either GitHub's REST API or Git's native diff command to determine changed files."

The default mode uses `git diff`, which **requires checkout**. Additionally:

**March 2025 Supply Chain Attack**: `tj-actions/changed-files` was compromised, leaking secrets from ~23,000 repositories. This highlights the risk of using third-party actions that require elevated permissions.

### Safe Pattern According to GitHub Security Lab

From [GitHub Security Lab](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/):

> "The reason to introduce the `pull_request_target` trigger was to enable workflows to label PRs (e.g., 'needs review') or to comment on the PR. The intent is to use the trigger for PRs that do not require dangerous processing."

**Key principle**: "When the PR contents are treated as passive data, i.e., not in a position of influence over the build/testing process, it is safe."

### What Makes `pull_request_target` Safe

1. **Workflow file comes from base branch** - attackers cannot modify the workflow
2. **No checkout = no code execution** - without `actions/checkout`, no malicious code can run
3. **Context data is safe** - PR title, labels, author from `github.event` are metadata, not executable

## Proposed Solution: GitHub API-Only Approach

Replace `tj-actions/changed-files` + checkout with **GitHub's REST API** via `actions/github-script`. This:

- Eliminates the need for checkout
- Removes dependency on compromised third-party action
- Uses GitHub's native API (max 3000 files, sufficient for labeling)

### Solution Comparison

| Approach                              | Checkout Required | Third-party Actions | Security Risk          |
| ------------------------------------- | ----------------- | ------------------- | ---------------------- |
| Current (`pull_request` + tj-actions) | Yes               | Yes                 | Low (read-only token)  |
| `pull_request_target` + tj-actions    | Yes               | Yes                 | **HIGH** (pwn request) |
| `pull_request_target` + GitHub API    | **No**            | No                  | **Low** (API-only)     |

## Technical Approach

### Changes to `.github/workflows/automation-labels.yml`

#### 1. Change trigger for PR events only

```yaml
# Before
on:
  pull_request:
    types: [opened, synchronize, reopened, edited, labeled, unlabeled]

# After
on:
  pull_request_target:
    types: [opened, synchronize, reopened, edited, labeled, unlabeled]
```

Keep `issues:` and `push:` triggers unchanged.

#### 2. Replace `tj-actions/changed-files` with GitHub API

```yaml
# Before (in meta job)
- name: Check out code
  uses: actions/checkout@v4

- name: Determine Areas
  uses: tj-actions/changed-files@v47
  with:
    files_yaml: ...

# After (use GitHub API - no checkout for file detection)
- name: Determine Areas via API
  id: files_changed
  uses: actions/github-script@v7
  with:
    script: |
      const { data: files } = await github.rest.pulls.listFiles({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.payload.pull_request.number,
        per_page: 100
      });

      const changedPaths = files.map(f => f.filename);

      // Area detection logic (matching current files_yaml patterns)
      const areaPatterns = {
        api: /^apps\/api\//,
        web: /^apps\/web\//,
        showcase: /^showcase\//,
        cli: /^cli\//,
        db: /^packages\/db\//,
        core: /^packages\/core\//,
        backend: /^packages\/backend\//,
        'react-sdk': /^react-sdk\//,
        documentation: /\.(md|mdx)$|^docs\/|^devdocs\//,
        github_actions: /^\.github\/(workflows|actions)\//,
        config: /^packages\/(eslint|typescript)-config\/|turbo\.json|mise\.toml/
      };

      const areas = [];
      for (const [area, pattern] of Object.entries(areaPatterns)) {
        if (changedPaths.some(p => pattern.test(p))) {
          areas.push(area);
        }
      }

      core.setOutput('changed_keys', JSON.stringify(areas));
```

#### 3. Keep checkout ONLY for jobs that don't need fork code

The `repo-labels` job needs checkout to read `.github/labels.yml` from the base branch. This is safe because:

- With `pull_request_target`, checkout without `ref:` gets base branch code
- The job only syncs label definitions, doesn't execute code

```yaml
# SAFE - repo-labels job
- name: Checkout
  uses: actions/checkout@v4
  # No ref: parameter = checks out base branch, not fork
```

#### 4. Add security comment

```yaml
# SECURITY NOTE: This workflow uses pull_request_target to gain write permissions
# for labeling fork PRs. This is safe because:
# 1. We do NOT checkout fork code (no ref: parameter)
# 2. We use GitHub API for file detection (no tj-actions/changed-files)
# 3. We only read PR metadata (title, author, file paths) - never execute PR code
#
# DO NOT add any step that:
# - Uses ref: ${{ github.event.pull_request.head.sha }}
# - Runs npm install/test/build on checked-out code
# - Executes scripts from the PR
```

### Jobs Requiring Changes

| Job            | Current State               | Change Needed                  |
| -------------- | --------------------------- | ------------------------------ |
| `meta`         | Uses checkout + tj-actions  | Replace with GitHub API script |
| `repo-labels`  | Uses checkout (base branch) | Safe as-is, no fork code       |
| `do-not-merge` | No checkout                 | Safe as-is                     |
| `sync-labels`  | Uses checkout (base branch) | Safe as-is, no fork code       |

### Alternative: Two-Workflow Pattern

If we want maximum security isolation, we could use:

1. **Workflow 1** (`pull_request`): Gather metadata, upload as artifact
2. **Workflow 2** (`workflow_run`): Download artifact, apply labels

**Tradeoffs:**

- More complex (two workflow files)
- Slower (two separate runs)
- Artifact handling needs careful validation

**Recommendation**: The single-workflow API-only approach is simpler and equally secure since we never execute fork code.

## Acceptance Criteria

- [ ] Change `pull_request` to `pull_request_target` for PR-related triggers
- [ ] Replace `tj-actions/changed-files` with `actions/github-script` using GitHub REST API
- [ ] Remove unnecessary checkout from jobs that don't need it
- [ ] Keep checkout in `repo-labels` and `sync-labels` (safe - base branch only)
- [ ] Add security comment explaining `pull_request_target` usage
- [ ] Pin all actions to SHAs with version comments
- [ ] Keep `issues:` trigger unchanged
- [ ] Keep `push:` trigger unchanged
- [ ] Test with a fork PR to verify labels are applied
- [ ] Test with an internal PR to verify no regression

## Testing

### Manual Testing Required

1. **Fork PR test**: Have external contributor open a PR (or use a test fork), verify labels are applied
2. **Internal PR test**: Create PR from branch in main repo, verify labels still work
3. **Area detection test**: Verify file-based labels match expected patterns

### Security Verification

After deployment, verify no fork code is executed:

1. Check workflow runs show base branch checkout (main), not fork branch
2. Verify `tj-actions/changed-files` is no longer used
3. Confirm only GitHub API calls are made for file detection

## Risks & Mitigations

| Risk                           | Likelihood | Impact   | Mitigation                                     |
| ------------------------------ | ---------- | -------- | ---------------------------------------------- |
| Accidental fork code checkout  | Low        | Critical | Security comment, code review                  |
| GitHub API rate limits         | Low        | Low      | 100 files per request sufficient               |
| API file limit (3000)          | Very Low   | Low      | Monorepo unlikely to have 3000 files in one PR |
| Pattern mismatch vs tj-actions | Medium     | Low      | Test file pattern matching thoroughly          |

## References

### Internal

- Workflow file: `.github/workflows/automation-labels.yml`
- Label definitions: `.github/labels.yml`

### External

- [GitHub: Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [GitHub Security Lab: Preventing pwn requests](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/)
- [GitHub REST API: List pull request files](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests-files)
- [tj-actions/changed-files March 2025 compromise](https://snyk.io/blog/reconstructing-tj-actions-changed-files-github-actions-compromise/)
