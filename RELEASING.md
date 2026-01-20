This document describes the process for releasing new versions of the Tambo packages (React SDK, TypeScript SDK) and the Tambo Cloud apps that now live in this monorepo.

## Release Instructions

### Tambo API Client (`@tambo-ai/typescript-sdk`)

The Tambo API is built in `apps/api`. When the API changes, it exposes a new OpenAPI doc at `/api-json` (for example `https://api.tambo.co/api-json`). Deploying a new API (see "Tambo Cloud" below) is what unlocks a new SDK release. After the deploy:

1. When a new version of the Tambo API is deployed to Railway, Stainless will automatically detect the changes and create a release PR in the [`@tambo-ai/typescript-sdk` repository](https://github.com/tambo-ai/typescript-sdk/pulls).
2. You can wait for Stainless to notice the new API (it polls once every hour) or you can force a refresh by clicking the "Release Flow" button in Stainless Studio.
3. A developer must review and approve the release PR.
4. Once approved and merged, Stainless will automatically publish the new version to https://www.npmjs.com/package/@tambo-ai/typescript-sdk. You can watch progress at https://github.com/tambo-ai/typescript-sdk/actions/workflows/publish-npm.yml

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

### Stainless Studio

- If you want to jump the gun and try out a local version of the Tambo API before an official release:
  1. Grab the OpenAPI spec from your local build:

     ```
     curl http://localhost:8261/api-json | jq -S . | pbcopy
     ```

     (On Mac, `pbcopy` is used to copy the output to the clipboard)

  2. In [Stainless Studio](https://app.stainless.com/hydra-ai/hydra-ai/studio?language=node) switch to your own branch by clicking the dropdown in the top right and click on the "<userid>/dev" branch. Reset if necessary.
  3. In the "OpenAPI Spec" tab, paste the OpenAPI spec and click "Build branch".
  4. When the "Codegen" stage is complete, click on the "Codegen" line and observe any errors or warnings.
  5. For errors in the OpenAPI spec, edit the actual API in `apps/api/` and copy `/api-json` from your local build.
  6. For errors and warnings in the `openapi.stainless.yaml` file, edit the file in this repo and click "Build branch" again.

**WARNING** Never edit or update the OpenAPI spec in the Stainless Studio `main` branch, and never merge a local OpenAPI spec into that branch. The Stainless `main` branch should only be updated via a release PR coming from this repository.

Updating `openapi.stainless.yaml` directly in Stainless Studio `main` is fine so long as it matches the latest spec exported from this repo.

### Miscellaneous

- The Tambo API is built and deployed to Railway. You can monitor deployment and runtime logs at:
  - `deploy` branch goes to [Production](https://railway.com/project/f6706075-78e8-4b8f-93ff-a07ef6da36d9/service/720e5a60-8fb2-4bca-ad76-38b983649287?environmentId=cb7ad6ef-d499-4792-8656-780891015359)
  - `main` branch goes to [Development](https://railway.com/project/f6706075-78e8-4b8f-93ff-a07ef6da36d9/service/720e5a60-8fb2-4bca-ad76-38b983649287?environmentId=6bee8983-1a4f-4b39-b778-72ec46e18db5)

* We use [Stainless](https://stainlessapi.com/) to automatically generate the Tambo client SDKs from the OpenAPI spec.
