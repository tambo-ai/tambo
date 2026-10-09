# Tambo shutdown: npm deprecation commands

Tambo Cloud keeps running until October 31, 2026; after that the hosted API stops responding. User data is deleted November 30, 2026. Announcement: https://tambo.co/blog/posts/tambo-is-shutting-down

These commands mark every published Tambo npm package as deprecated. **Do not run them before the shutdown date** (October 31, 2026) unless the team decides otherwise. Run them after the final release of each package has been published, because `npm deprecate` applies to already-published versions only.

## Published packages

Package names come from each `package.json`. The first five are published from this repo by `.github/workflows/release-please.yml`; `@tambo-ai/typescript-sdk` is published from its own repo (see `RELEASING.md`).

| Package                    | Source in this repo       |
| -------------------------- | ------------------------- |
| `@tambo-ai/react`          | `react-sdk/`              |
| `@tambo-ai/client`         | `packages/client/`        |
| `@tambo-ai/react-ui-base`  | `packages/react-ui-base/` |
| `tambo`                    | `cli/`                    |
| `create-tambo-app`         | `create-tambo-app/`       |
| `@tambo-ai/typescript-sdk` | external repo             |

Workspaces without `"private": true` that are **not** published to npm (confirmed with `npm view`, which returns 404): `@tambo-ai-cloud/backend`, `@tambo-ai-cloud/test-mcp-server`, `@tambo-ai/docs`, and the root `@tambo-ai/repo`. No action needed for them.

## Deprecation message

```text
Tambo Cloud shut down on October 31, 2026 and this package is no longer maintained. Tambo is open source and can be self-hosted: https://github.com/tambo-ai/tambo/blob/main/SELF-HOSTING.md. Details: https://tambo.co/blog/posts/tambo-is-shutting-down. The team now builds Charming: https://usecharming.com
```

## Commands

Requires an npm account with publish rights on each package (`npm whoami` to check, `npm login` if needed; 2FA prompts for an OTP, or pass `--otp=<code>`).

```bash
MSG="Tambo Cloud shut down on October 31, 2026 and this package is no longer maintained. Tambo is open source and can be self-hosted: https://github.com/tambo-ai/tambo/blob/main/SELF-HOSTING.md. Details: https://tambo.co/blog/posts/tambo-is-shutting-down. The team now builds Charming: https://usecharming.com"

npm deprecate "@tambo-ai/react@*" "$MSG"
npm deprecate "@tambo-ai/client@*" "$MSG"
npm deprecate "@tambo-ai/react-ui-base@*" "$MSG"
npm deprecate "tambo@*" "$MSG"
npm deprecate "create-tambo-app@*" "$MSG"
npm deprecate "@tambo-ai/typescript-sdk@*" "$MSG"
```

## Things to decide before running

- The SDK packages (`@tambo-ai/react`, `@tambo-ai/client`, `@tambo-ai/typescript-sdk`) still work against a self-hosted Tambo backend. Deprecating them makes every install print a warning, including for self-hosters. If the team wants self-hosting to feel supported, consider deprecating only `tambo` and `create-tambo-app` (which default to Tambo Cloud onboarding), or use a message that points self-hosters at the repo without saying "no longer maintained".
- `@*` deprecates all published versions. To target only a range, replace `*` with a semver range such as `<=1.3.0`.

## Verify

```bash
npm view @tambo-ai/react deprecated
npm view tambo deprecated
```

## Undo

Pass an empty message to remove a deprecation:

```bash
npm deprecate "tambo@*" ""
```
