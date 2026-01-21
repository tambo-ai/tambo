# Coverage threshold bump (weekly)

## Overview

Run each workspace’s Jest tests with coverage enabled and increase each workspace’s Jest `coverageThreshold.global` values to the higher number supported by current coverage.

Coverage thresholds must be monotonic: never decrease any threshold.

## Creates

- Artifact: GitHub pull request
- Title pattern: "chore(test): bump coverage thresholds (<YYYY-MM-DD>)"

## Limits

- Max artifacts per run: 1 pull request
- Guardrails:
  - Never decrease any coverage threshold (only increase).
  - Only update numeric values inside `coverageThreshold.global` blocks in `jest.config*.ts`.
  - Only update metrics already present in the config (do not add new threshold keys).
  - When bumping a threshold, set it to `floor(measuredPct)` to avoid setting thresholds above current coverage.
  - Do not change test behavior (no changes to test patterns, transforms, `collectCoverageFrom`, etc.).

## Data collection

Today’s date (for PR title, America/Los_Angeles):

```bash
today=$(TZ=America/Los_Angeles date +%F)
echo "$today"
```

Use this `today` value when constructing the PR title.

List Jest configs with thresholds in this repo:

```bash
fd -a '^jest\.config(\..*)?\.ts$' -t f . | sort
```

Run coverage for each Jest project and write results into a unique directory (to avoid `coverageDirectory` collisions):

```bash
rm -rf /tmp/tambo-coverage && mkdir -p /tmp/tambo-coverage

# apps/api
npm -w apps/api run test:cov -- \
  --coverageReporters=json-summary \
  --coverageDirectory=/tmp/tambo-coverage/apps-api

# apps/web
npm -w apps/web run test:cov -- \
  --coverageReporters=json-summary \
  --coverageDirectory=/tmp/tambo-coverage/apps-web

# packages/backend
npm -w packages/backend run test:cov -- \
  --coverageReporters=json-summary \
  --coverageDirectory=/tmp/tambo-coverage/packages-backend

# packages/core
npm -w packages/core run test:cov -- \
  --coverageReporters=json-summary \
  --coverageDirectory=/tmp/tambo-coverage/packages-core

# react-sdk
npm -w react-sdk test -- \
  --coverage \
  --coverageReporters=json-summary \
  --coverageDirectory=/tmp/tambo-coverage/react-sdk

# showcase (Jest unit tests only; keep `node --test` separate)
npm -w showcase run test:unit -- \
  --coverage \
  --coverageReporters=json-summary \
  --coverageDirectory=/tmp/tambo-coverage/showcase

# cli (single command runs all Jest projects)
npm -w cli test -- \
  --coverage \
  --coverageReporters=json-summary \
  --coverageDirectory=/tmp/tambo-coverage/cli
```

Note: the `cli` workspace `test` script currently runs `NODE_OPTIONS=--experimental-vm-modules jest`, so `npm -w cli test -- ...` forwards Jest flags like `--coverageDirectory`. The CLI Jest config uses multiple projects (`node` and `react`); this coverage directory aggregates them into a single report that `coverageThreshold.global` enforces. If the `test` script ever stops being a thin `jest` wrapper, update this playbook to call `jest` directly.

If a new workspace adds Jest coverage thresholds (or test scripts are renamed), update the command list above so every Jest project stays covered.

For each coverage directory, the total percentages are available in `coverage-summary.json`:

```bash
jq '.total | {branches: .branches.pct, lines: .lines.pct, statements: .statements.pct, functions: .functions.pct}' \
  /tmp/tambo-coverage/apps-api/coverage-summary.json
```

## No-op when

- Today is not Monday in America/Los_Angeles:

  ```bash
  test "$(TZ=America/Los_Angeles date +%u)" = "1"
  ```

- The current branch is not `main`:

  ```bash
  test "$(git rev-parse --abbrev-ref HEAD)" = "main"
  ```

- The git remote is not the canonical repo (`tambo-ai/tambo`):

  ```bash
  git remote get-url origin | rg -n 'tambo-ai/tambo'
  ```

- No `coverageThreshold.global` value can be increased.

## Steps

1. Run each Jest project’s tests with coverage enabled (see Data collection).
2. For each `jest.config*.ts`, compare the existing `coverageThreshold.global` values to the measured coverage percentage for that project.
3. For each metric key that exists in both places (`branches`, `lines`, `statements`, `functions`):
   - Compute `measuredFloor = floor(measuredPct)`.
   - Update the threshold to `max(currentThreshold, measuredFloor)`.
4. Create a branch and commit only the threshold increases.
5. Open a pull request titled `chore(test): bump coverage thresholds (<today>)` describing the thresholds bumped (before → after) per project.

## Verify

- No threshold was decreased.
- All Jest suites still pass with the updated thresholds.

## References

- Jest coverage thresholds: https://jestjs.io/docs/configuration#coveragethreshold-object
