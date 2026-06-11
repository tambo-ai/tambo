# Package manager configuration

Use repository evidence to replace the `DAEMON.md` configuration placeholders before enabling the daemon. Keep the runtime daemon focused on the configured commands rather than package-manager auto-detection.

## Lockfile hints

| Evidence                  | Package manager |
| ------------------------- | --------------- |
| `pnpm-lock.yaml`          | pnpm            |
| `yarn.lock`               | Yarn            |
| `package-lock.json`       | npm             |
| `bun.lock` or `bun.lockb` | Bun             |

If multiple lockfiles exist, inspect recent commits and package scripts before choosing the configuration. If still ambiguous, stop and ask a human.

## Configuration examples

These examples are starting points. Replace them with repository-specific commands and only use commands that preserve the daemon's patch/minor policy. Do not use `@latest` or major-version update flags unless the daemon policy is explicitly expanded.

pnpm:

```bash
<outdated-command> = pnpm outdated
<runtime-update-command> = pnpm update <runtime-package>
<development-update-command> = pnpm update <dev-package> --dev
<install-command> = pnpm install --lockfile-only
<verification-command> = pnpm test
```

npm:

```bash
<outdated-command> = npm outdated
<runtime-update-command> = npm update <runtime-package>
<development-update-command> = npm update <dev-package> --save-dev
<install-command> = npm install --package-lock-only
<verification-command> = npm test
```

Yarn:

```bash
<outdated-command> = yarn outdated
<runtime-update-command> = yarn up <runtime-package>
<development-update-command> = yarn up <dev-package>
<install-command> = yarn install
<verification-command> = yarn test
```

Bun:

```bash
<outdated-command> = bun outdated
<runtime-update-command> = bun update <runtime-package>
<development-update-command> = bun update <dev-package>
<install-command> = bun install
<verification-command> = bun test
```

Use the repository's own scripts when they are clearer than generic examples.
