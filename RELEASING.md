This document describes the process for releasing new versions of the Tambo packages (React SDK, TypeScript SDK) and the Tambo Cloud apps that now live in this monorepo.

## Release Instructions

### Tambo API Client (`@tambo-ai/typescript-sdk`)

The Tambo API is built in `apps/api`; its OpenAPI spec is generated from the NestJS decorators (`npm run generate-config`). The SDK is generated from that spec by **stlc** — Stainless's source-available CLI — running in our own GitHub Actions (the hosted Stainless service was sunset; see "Migrating off hosted Stainless" below). After deploying a new API:

1. A push to the `deploy` branch triggers `.github/workflows/stlc-generate.yml`, which regenerates the OpenAPI spec from `apps/api` and runs `stlc build --push` to regenerate `@tambo-ai/typescript-sdk` and push the generated code to that repo's `main`.
2. The SDK repo's `release-please.yml` opens (or updates) a release PR with the version bump and changelog.
3. A developer reviews and merges the release PR.
4. Merging tags a GitHub Release, which triggers `publish-npm.yml` (OIDC) to publish to https://www.npmjs.com/package/@tambo-ai/typescript-sdk.

The stlc CLI is installed in CI from the private `tambo-ai/stlc-vendor` release (via `.github/actions/setup-stlc`), so generation does not depend on `github.com/stainless`, which is unavailable after 2026-09-01.

### React SDK (`@tambo-ai/react`)

Once the Tambo API client is updated, the React SDK can be updated.

1. After `@tambo-ai/typescript-sdk` is published to NPM, update the dependency in the [@tambo-ai/react repository](https://github.com/tambo-ai/tambo). There are two ways to do this:
   - Kick off a full Dependabot update at https://github.com/tambo-ai/tambo/network/updates
   - Manually update the dependency by running:
     ```bash
     npx npm-check-updates -u @tambo-ai/typescript-sdk
     ```
2. Create and merge a PR with the dependency update. You may have to fix types and tests to reflect changes in the Tambo API.
3. The release-please action will create a release PR to bump the version.
4. Once approved and merged, release-please will publish the new version to https://www.npmjs.com/package/@tambo-ai/react. You can watch progress at https://github.com/tambo-ai/tambo/actions/workflows/release-please.yml

### Tambo Cloud (apps + shared packages in this repo)

When you update either or both SDKs, also update the dependencies that live under `apps/api/` to ensure smoketests reference the latest versions.

1. **OPTIONAL:** After both `@tambo-ai/typescript-sdk` and `@tambo-ai/react` are published, update `apps/api/` dependencies either:
   - Through Dependabot at https://github.com/tambo-ai/tambo/network/updates
   - Or manually by running:
     ```bash
     npx npm-check-updates -u @tambo-ai/typescript-sdk @tambo-ai/react
     ```
2. Create and merge a PR with the dependency updates.
3. The release-please action will create a release PR to bump the version.
4. Once approved and merged, release-please will trigger deployments. Watch progress:
   - Merge to `deploy`: https://github.com/tambo-ai/tambo/actions/workflows/release-please-cloud.yml
   - Release to Vercel: https://vercel.com/tambo-ai/tambo-landing/deployments
   - Release to Railway: https://railway.com/project/f6706075-78e8-4b8f-93ff-a07ef6da36d9/service/720e5a60-8fb2-4bca-ad76-38b983649287?environmentId=cb7ad6ef-d499-4792-8656-780891015359

## Notes

### Release Please

All of the Tambo repos are managed using [release-please](https://github.com/googleapis/release-please).

#### Configuration

The release-please configuration lives in two files:

- `release-please-config.json` - Defines packages, plugins, and changelog sections
- `.release-please-manifest.json` - Tracks current versions for each package

Key configuration:

- **`separate-pull-requests: true`** - Each package gets its own release PR
- **`node-workspace` plugin** - Keeps `package-lock.json` in sync when workspace package versions are bumped
- **`sync-lockfile.yml` workflow** - Backup mechanism that regenerates the lockfile on release PRs

#### Process

In general, the process is as follows for any repo:

1. When new PRs are merged, release-please will automatically create or update a
   new release candidate on the `main` branch. New PRs _must_ be named using
   [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
   Generally this means prefixing the PR title with either `fix` if it's a bug
   fix, `feat` if it's a new feature, or `chore` if it's a refactor or other
   change that doesn't add or remove any functionality.
2. A PR will be automatically created or updated that updates the version of the
   Tambo packages in the `package.json` files.
3. When the release PR is merged, release-please will create a new release on
   GitHub and either:
   - If it is a library, it will create a new release and push it to NPM.
   - If it is an app, it will create a new release and push it to Vercel/Railway

### Migrating off hosted Stainless

Stainless was acquired by Anthropic and is sunsetting all hosted products
(SDK generator, build API, GitHub App, the `stainless-sdks` staging org) on
**2026-09-01**. SDK generation now runs on **stlc**, Stainless's
source-available CLI, in our own CI. The stlc workspace (OpenAPI spec,
`openapi.stainless.yml`, custom-code tracking) lives in `stainless/` in this
repo; the vendored stlc packages live in the private `tambo-ai/stlc-vendor`
repo so CI survives the shutdown.

To preview SDK changes locally before a release:

1. Install stlc (one-time): download the tarballs from the latest
   `tambo-ai/stlc-vendor` release and `npm install -g` them, or see
   `.github/actions/setup-stlc`.
2. Regenerate the spec from your local API:

   ```bash
   OPENAPI_SPEC_FILE=stainless/openapi.json npm run generate-config -w apps/api
   ```

3. Build and inspect the SDK from the `stainless/` workspace:

   ```bash
   stlc build           # generate into ./sdks
   stlc test            # run the SDK test suite
   stlc preview         # preview the SDK + API reference
   ```

Custom code (hand edits to the generated SDK) is sealed via `stlc build` and
tracked under `stainless/custom-code/`; commit those tracking files alongside
spec/config changes. See `plans/2026-06-04-001-feat-stlc-sdk-migration-plan.md`
for the full migration record.

### Miscellaneous

- The Tambo API is built and deployed to Railway. You can monitor deployment and runtime logs at:
  - `deploy` branch goes to [Production](https://railway.com/project/f6706075-78e8-4b8f-93ff-a07ef6da36d9/service/720e5a60-8fb2-4bca-ad76-38b983649287?environmentId=cb7ad6ef-d499-4792-8656-780891015359)
  - `main` branch goes to [Development](https://railway.com/project/f6706075-78e8-4b8f-93ff-a07ef6da36d9/service/720e5a60-8fb2-4bca-ad76-38b983649287?environmentId=6bee8983-1a4f-4b39-b778-72ec46e18db5)

* We use **stlc** (Stainless's source-available CLI, run in our own CI; vendored privately at [`tambo-ai/stlc-vendor`](https://github.com/tambo-ai/stlc-vendor)) to generate the Tambo client SDKs from the OpenAPI spec. The upstream `github.com/stainless` repos are unavailable after 2026-09-01.
