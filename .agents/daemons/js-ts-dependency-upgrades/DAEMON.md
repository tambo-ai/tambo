---
id: js-ts-dependency-upgrades
purpose: Stabilize JavaScript and TypeScript dependency pull requests by applying minimal migration and compatibility fixes when bot-authored dependency updates fail CI.
routines:
  - Trigger only for dependency pull requests authored by `renovate[bot]` or `dependabot[bot]`.
  - Run only when the latest CI status on that pull request is failing.
  - Reproduce failures locally and apply the smallest dependency-scoped fix, including required migration or codemod edits.
  - Commit fixes to the same dependency pull request branch with verification evidence.
deny:
  - Do not proceed while any configuration placeholder remains unresolved.
  - Do not act on non-dependency pull requests or pull requests authored by humans/other bots.
  - Do not run when CI is already green.
  - Do not auto-merge dependency pull requests.
  - Do not perform unrelated refactors, feature work, or broad formatting-only rewrites.
  - Do not broaden upgrade scope beyond what is required to make the dependency pull request pass CI.
  - Do not change dependency range style, package manager, registry configuration, or workspace layout unless migration docs require it.
schedule: "0 8 * * 1"
---

# JavaScript/TypeScript Dependency Upgrade Fixer

## Configuration

Use these repository-specific values:

- Package manager: `npm (workspaces)`
- Dependency manifests: `package.json, apps/*/package.json, packages/*/package.json, cli/package.json, create-tambo-app/package.json, docs/package.json, react-sdk/package.json, showcase/package.json`
- Lockfile: `package-lock.json`
- Install or lockfile refresh: `npm install --package-lock-only --workspaces`
- Verification:
  - `npm run lint`
  - `npm run check-types`
  - `npm test`

## Trigger policy

Proceed only when all conditions are true:

1. the current context is an open dependency pull request
2. the pull request author is `renovate[bot]` or `dependabot[bot]`
3. the latest CI run for that pull request has at least one failing required check

If any condition is false, perform no code changes and leave a concise no-op reason.

## Fix strategy

1. Inspect failing CI checks and identify the dependency upgrade that introduced breakage.
2. Reproduce the failure locally with the closest equivalent command.
3. Apply minimal, dependency-scoped fixes needed to restore compatibility:
   - package API migrations
   - required config/schema updates
   - generated artifacts needed by migration tooling
4. Run install/lockfile refresh if needed.
5. Re-run verification commands relevant to the failing checks (prefer full configured verification set).
6. Commit only dependency-fix and migration-related changes to the same pull request branch.

## Migration requirements

When an upgraded package requires migration work:

- Use official migration paths first (codemods, `migrate` scripts, release-note steps).
- Include migration edits in the same fix commit/pull request branch.
- Keep migrations narrowly scoped to the upgraded packages and broken call sites.
- If migration requires broad architectural changes, stop and hand off with:
  - blocked package/version
  - migration commands attempted
  - exact manual follow-up steps

## Safety constraints

- Keep scope strictly tied to failing dependency pull request CI.
- No unrelated refactors or opportunistic cleanup.
- Avoid touching files outside the dependency/migration blast radius unless required by tooling.
- Do not introduce new dependency upgrade goals while fixing the current failure.

## Verification and reporting

After edits:

1. run `npm install --package-lock-only --workspaces` when lockfile/manifests changed
2. run failing-check equivalents and, when practical, the full set:
   - `npm run lint`
   - `npm run check-types`
   - `npm test`
3. inspect the diff to confirm only dependency and migration-related edits are included

Report commands run, remaining failures, and any follow-up needed.

## Limits

- Max dependency pull requests handled per run: 1
- Max fix commits per run: 1
- No changes outside dependency-fix scope unless required by documented migration tooling

## No-op when

- pull request author is not `renovate[bot]` or `dependabot[bot]`
- pull request is not a dependency update
- CI is already green
- required CI logs are unavailable
- migration would require unrelated, broad refactor work
