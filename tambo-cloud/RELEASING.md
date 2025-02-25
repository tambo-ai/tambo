This document describes the process for releasing a new version of the various Hydra repos and packages.

## Release Instructions

### Hydra API Client (`@hydra-ai/client`)

The Hydra API is built in the `apps/api` directory of the main site. When the APIs are updated, a new version of the OpenAPI JSON specification will be served up at `/api-json` (e.g. https://api.hydra.sh/api-json). This means that you must do a release of the Main Site (see below) in order to update the Hydra API client. Once this is done:

1. When a new version of the Hydra API is deployed to Railway, Stainless will automatically detect the changes and create a release PR in the [hydra-ai-node repository](https://github.com/use-hydra-ai/hydra-ai-node/pulls).
2. You can wait for Stainless to notice the new API (it polls once every hour) or you can force a refresh by clicking the "Release Flow" button in Stainless Studio.
3. A developer must review and approve the release PR.
4. Once approved and merged, Stainless will automatically publish the new version to https://www.npmjs.com/package/@hydra-ai/client. You can watch progress at https://github.com/use-hydra-ai/hydra-ai-node/actions/workflows/publish-npm.yml

### React SDK (`@hydra-ai/react`)

Once the Hydra API client is updated, the React SDK can be updated.

1. After `@hydra-ai/client` is published to NPM, update the dependency in the [hydra-ai-react repository](https://github.com/use-hydra-ai/hydra-ai-react). There are two ways to do this:
   - Kick off a full Dependabot update at https://github.com/use-hydra-ai/hydra-ai-react/settings/dependency_updates
   - Manually update the dependency by running:
     ```bash
     npx npm-check-updates -u @hydra-ai/client
     ```
2. Create and merge a PR with the dependency update. You may have to fix types and tests to reflect changes in the Hydra API.
3. The release-please action will create a release PR to bump the version.
4. Once approved and merged, release-please will publish the new version to https://www.npmjs.com/package/@hydra-ai/react. You can watch progress at https://github.com/use-hydra-ai/hydra-ai-react/actions/workflows/release-please.yml

### Main Site (`hydra-ai-site`)

When you update either or both of the Hydra client SDKs, you must also update the dependencies in the [hydra-ai-site repository](https://github.com/use-hydra-ai/hydra-ai-site) to ensure that the smoketests are using the latest versions of the Hydra client SDKs.

1. **OPTIONAL:** After both `@hydra-ai/client` and `@hydra-ai/react` are published, update the dependencies in the [hydra-ai-site repository](https://github.com/use-hydra-ai/hydra-ai-site) either:
   - Through Dependabot at https://github.com/use-hydra-ai/hydra-ai-site/network/updates
   - Or manually by running:
     ```bash
     npx npm-check-updates -u @hydra-ai/client @hydra-ai/react
     ```
2. Create and merge a PR with the dependency updates.
3. The release-please action will create a release PR to bump the version.
4. Once approved and merged, release-please will trigger a deployment to Vercel. You can watch progress:
   - Merge to `deploy`: https://github.com/use-hydra-ai/hydra-ai-site/actions/workflows/release-please.yml
   - Release to Vercel: https://vercel.com/hydra-ai/hydra-ai-landing/deployments
   - Release to Railway: https://railway.com/project/f6706075-78e8-4b8f-93ff-a07ef6da36d9/service/720e5a60-8fb2-4bca-ad76-38b983649287?environmentId=cb7ad6ef-d499-4792-8656-780891015359

## Notes

### Release Please

All of the Hydra repos are managed using [release-please](https://github.com/googleapis/release-please).

In general, the process is as follows for any repo:

1. When new PRs are merged, release-please will automatically create or update a
   new release candidate on the `main` branch. New PRs _must_ be named using
   [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
   Generally this means prefixing the PR title with either `fix` if it's a bug
   fix, `feat` if it's a new feature, or `chore` if it's a refactor or other
   change that doesn't add or remove any functionality.
2. A PR will be automatically created or updated that updates the version of the
   Hydra packages in the `package.json` files.
3. When the release PR is merged, release-please will create a new release on
   GitHub and either:
   - If it is a library, it will create a new release and push it to NPM.
   - If it is an app, it will create a new release and push it to Vercel/Railway

### Stainless Studio

- If you want to jump the gun and try out a local version of the Hydra API before an official release:

  1. Grab the OpenAPI spec from your local build:

     ```
     curl http://localhost:3001/api-json | jq -S . | pbcopy
     ```

     (On Mac, `pbcopy` is used to copy the output to the clipboard)

  2. In [Stainless Studio](https://app.stainlessapi.com/hydra-ai/hydra-ai/studio?language=node) switch to your own branch by clicking the dropdown in the top right and click on the "<userid>/dev" branch. Reset if necessary.
  3. In the "OpenAPI Spec" tab, paste the OpenAPI spec and click "Build branch".
  4. When the "Codegen" stage is complete, click on the "Codegen" line and observe any errors or warnings.
  5. For errors in the OpenAPI spec, edit the actual API in the hydra-ai-site repo and copy down `/api-json` from your local build.
  6. For errors and warnings in the `openapi.stainless.yaml` file, edit the file in the hydra-ai-site repo and click "Build branch" again.

**WARNING** Never edit or update the OpenAPI spec in the Stainless Studio `main` branch, and never merge a local OpenAPI spec into the Stainless Studio `main` branch. The `main` branch should only be updated via a release PR in the hydra-ai-site repo.

However, it is fine to update the `openapi.stainless.yaml` file in the Stainless Studio `main` branch, as long as it is using the latest version of the OpenAPI spec from the hydra-ai-site repo.

### Miscellaneous

- The Hydra API is built and deployed to Railway. You can monitor deployment and runtime logs at:
  - `deploy` branch goes to [Production](https://railway.com/project/f6706075-78e8-4b8f-93ff-a07ef6da36d9/service/720e5a60-8fb2-4bca-ad76-38b983649287?environmentId=cb7ad6ef-d499-4792-8656-780891015359)
  - `main` branch goes to [Development](https://railway.com/project/f6706075-78e8-4b8f-93ff-a07ef6da36d9/service/720e5a60-8fb2-4bca-ad76-38b983649287?environmentId=6bee8983-1a4f-4b39-b778-72ec46e18db5)

* We use [Stainless](https://stainlessapi.com/) to automatically generate the the Hydra client SDKs from the OpenAPI spec.
