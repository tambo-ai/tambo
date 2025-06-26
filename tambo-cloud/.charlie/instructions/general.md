# General Guidelines for All Pull Requests

Follow these rules whenever you open a PR in this repository.  
Keep PRs focused, well-documented, and easy for reviewers to verify.

---

## 1. Dependency, Lint, and Format Rules

- **Do NOT** add, upgrade, or remove dependencies unless the task explicitly says so.
- **Do NOT** change the configuration of tools such as Prettier, ESLint, or TypeScript unless the task explicitly says so.
- Always run the Charlie quick-fix command before pushing:

  ```bash
  npx charlie fix
  ```

  This will execute:

  ```bash
  npm run lint -- --fix   # auto-fix eslint issues
  npm run format          # run Prettier
  ```

---

## 2. Conventional Commits

Use the conventional-commits style in every commit message:

- `feat:` for a new feature (may introduce breaking changes)
- `fix:` for a bug fix (may introduce breaking changes)
- `chore:` for changes that neither fix a bug nor add a feature (e.g. dependency bumps)
- `refactor:` for internal code changes that neither fix bugs nor add features
- `perf:` for performance improvements
- `test:` for adding or updating tests
- `docs:` for documentation-only changes

---

## 3. GitHub Issue References

When a PR closes or fixes a GitHub issue, reference it in the description using the exact wording **`Fixes #<number>`**.  
Example:

```md
Fixes #217
```

---

## 4. Local Verification Checklist

Run these commands locally and ensure they pass **before** opening or updating a PR:

```bash
# 1. Type-check the entire repo
npm run check-types

# 2. Lint & format (Charlie will auto-fix)
npx charlie fix

# 3. Run unit & integration tests
npm test

# 4. Verify database migrations build
npm run drizzle:generate -- --schema packages/db/src/schema \
  --out packages/db/migrations
```

The migrations output directory **must remain exactly**  
`packages/db/migrations` so that CI can detect and apply new migrations automatically.
