# Stainless → stlc: SDK generation migration plan

Status: investigation complete; migration path confirmed (stlc). Execution pending.
Last updated: 2026-06-03.

## Why

Anthropic acquired Stainless (announced 2026-05-18) and is sunsetting all
hosted Stainless products. **Hard deadline: September 1st, 2026** — after that
the Stainless API and build infrastructure shut off for our account and the
`stainless-sdks` staging repos become read-only.

Stainless provides a sanctioned replacement: **stlc**, a source-available CLI
that replicates the platform — it generates/updates existing Stainless SDKs
from the OpenAPI spec + `stainless.yml`, runs locally and in our CI. License is
perpetual, internal-use only (no redistribution, no commercial resale, no
AI/ML training use), provided as-is. Migration support from the Stainless team
is available until 2026-09-01 via Slack or transition@stainless.com.

Account-specific transition guide: <https://app.stainless.com/hydra-ai/transition/docs/overview>.
A full text capture of all 18 guide pages plus the exported project bundle is
cached in `devdocs/stainless-transition/` (so no Stainless login is needed to
reference them).

- [Anthropic announcement](https://www.anthropic.com/news/anthropic-acquires-stainless)
- [TechCrunch coverage](https://techcrunch.com/2026/05/18/anthropic-has-acquired-the-dev-tools-startup-used-by-openai-google-and-cloudflare/)

## Current state (verified 2026-06-03)

- Pipeline still running: `stainless-app[bot]` released
  `@tambo-ai/typescript-sdk` **0.96.2** on 2026-06-03. The monorepo pins
  0.96.1 (`apps/web`, `packages/client`, `packages/ui-registry`,
  `packages/react-ui-base`).
- Flow today: `apps/api` generates the OpenAPI spec from NestJS Swagger
  (`npm run generate-config`); `.github/workflows/stainless-cloud.yml` uploads
  it to Stainless project **`hydra-ai`** on push to `deploy`; Stainless
  regenerates the SDK, opens a release PR in
  [`tambo-ai/typescript-sdk`](https://github.com/tambo-ai/typescript-sdk), and
  publishes to npm on merge.
- **Project bundle exported and saved** at
  `devdocs/stainless-transition/stainless-hydra-ai.zip`, containing:
  - `stainless/openapi.json` (109 KB spec snapshot)
  - `stainless/openapi.stainless.yml` (9.7 KB — the full Stainless config,
    previously only in Stainless Studio; now recovered)
  - `stainless/custom-code/typescript/…custom-code.json` — a tracking pointer
    (base/integrated SHAs). The actual custom code lives as git refs in the
    staging repo, which is why mirroring it preserves custom code.
- Targets per the config:
  - `typescript` → production `tambo-ai/typescript-sdk`, staging
    `stainless-sdks/hydra-ai-typescript` (exists, accessible, active today),
    npm publish via OIDC.
  - `python` → production `tambo-ai/python-sdk`, which **does not exist** (404).
    The python target was configured but never shipped. Decide during
    migration: drop the target or stand it up properly.
- Org access already activated for `stlc`, `stlc-typescript`, and
  `stlc-python` (per the transition guide's install matrix).

## Target architecture (mirrors how the SaaS works today)

Three GitHub Actions stages, all owned by us:

1. **Generate** (`stlc-generate.yml` in the config repo — this monorepo):
   spec change merges → `stlc build` regenerates SDKs → pushes to each staging
   repo's `main`. Optional PR-time preview posts SDK diffs on spec PRs.
2. **Promote** (`stlc-promote.yml` in each staging repo): staging `main`
   advances → opens/updates a release PR against the production repo.
3. **Release** (`release-please.yml` + `publish-npm.yml` in each production
   repo): promote PR merges → version bump, changelog, tag, npm publish.

Daily loop after migration: change the API → regenerate spec → `stlc build`.
Estimated one-time effort per the guide: 1–2 hours for our shape (1 active SDK

- a little custom code), mostly GitHub setup.

## Prerequisites (gather before starting)

- GitHub org admin on `tambo-ai` (uninstall Stainless GitHub App, add secrets,
  create repos).
- **`SDK_WRITE_TOKEN`**: fine-grained PAT — Contents r/w, Pull requests r/w,
  Workflows r/w — scoped to the config repo, staging repo(s), and production
  repo(s). Powers promote + doubles as `RELEASE_PLEASE_TOKEN`.
- **`STLC_READ_TOKEN`**: classic PAT with `repo` scope, used in CI to clone
  the private `stainless/stlc*` packages. Can only be minted after accepting
  the GitHub invites (request via the transition guide "Activate stlc access"
  page).
- Node.js **24+** for running stlc (repo standard is Node >=22 — CI jobs that
  run stlc need 24; check `mise.toml` implications).
- `unzip` on PATH; TypeScript toolchain for local builds.

## Migration steps (from the account-specific guide, adapted to us)

0. **Pre-flight**: merge any open Stainless release PRs on
   `tambo-ai/typescript-sdk` (aligns `next` and `main`); stop editing custom
   code in Stainless Studio from bundle-download onward; decide what to do
   with the dead `python` target.
1. **Activate access**: each team member who needs stlc requests GitHub
   invites via the guide, accepts them, then mints `STLC_READ_TOKEN`. Mark
   "migration started" in the Stainless dashboard (org admin).
2. **Install**: `npm install -g git+https://github.com/stainless/stlc.git
git+https://github.com/stainless/stlc-typescript.git` (HTTPS auth via
   `gh auth setup-git`).
3. **Initialize**: create private staging repo (suggested
   `tambo-ai/typescript-sdk-staging`), mirror `stainless-sdks/hydra-ai-typescript`
   into it (preserves history + custom-code tracking refs). Then, in the
   config repo, `stlc init --from-cloud ./stainless-hydra-ai.zip` — download a
   **fresh** bundle at execution time; the one cached in devdocs is a
   point-in-time backup. When prompted, set the typescript `staging_repo` to
   the new repo. Decide where the workspace lives — the guide suggests the
   repo that owns the spec, i.e. this monorepo (a `stainless/` dir at root).
4. **First build**: `stlc build --commit "feat: initial stlc build"`,
   `stlc test`, then `stlc build --push`. Commit
   `stainless/custom-code/` tracking files to the config repo.
5. **Validate parity**: `git diff HEAD~1 HEAD` in the SDK repo (stlc-build vs
   app-built commit) and `git diff origin/main HEAD` vs published SDK.
   Header/format drift is fine; type/signature/behavior drift is not — escalate
   to transition@stainless.com before cutover.
6. **Automate**: wire the three workflows (templates in the cached guide pages
   `codegen.txt`, `promote.txt`, `release.txt`), add secrets, then dry-run a
   full round trip with a trivial spec change.
7. **Cutover**: remove `STAINLESS_API_KEY` secret and delete
   `.github/workflows/stainless-cloud.yml`; uninstall the Stainless GitHub App
   from the `tambo-ai` org; mark migration complete in the dashboard
   (choose **read-only**, not shutdown, so bundle exports stay retrievable);
   update `RELEASING.md` and `AGENTS.md`.

## Repo changes in this monorepo (when executing)

- Add `stainless/` workspace (spec, `stainless.yml`, custom-code tracking,
  `workspace.json`) — replaces the config that lived in Stainless Studio.
- Replace `.github/workflows/stainless-cloud.yml` with
  `.github/workflows/stlc-generate.yml` (+ `.github/actions/setup-stlc`).
  Note the trigger likely moves from "push to `deploy`" to "spec change merged"
  — keep the spec snapshot in-repo and regenerated via
  `npm run generate-config` so the workflow can diff it.
- Update `RELEASING.md` (API client + Stainless Studio sections) and
  `AGENTS.md` references.

## Open decisions

1. Drop or ship the `python` target (no production repo exists today).
2. Workspace location: this monorepo root vs a dedicated config repo.
3. Staging repo naming (`tambo-ai/typescript-sdk-staging` suggested).
4. Long-term: stlc is unsupported after 2026-09-01. It buys us continuity;
   re-evaluate Speakeasy/Fern/TypeSpec emitters only if stlc becomes a
   maintenance burden later.
