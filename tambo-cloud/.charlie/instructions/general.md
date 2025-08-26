# General Guidelines for All Pull Requests

Follow these rules whenever you open a PR in this repository.  
Keep PRs focused, well-documented, and easy for reviewers to verify.

---

## 1. Dependency, Lint, and Format Rules

Charlie may not do the following: (but humans can)

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

````md
Fixes #217

When a PR closes or fixes a Linear issue, reference it in the description using the exact wording **`Fixes TAM-<issue-key>`**.
Example:

```md
Fixes TAM-123
```
````

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

---

## 5. Database Schema Guidance

**The project uses [Drizzle ORM](https://orm.drizzle.team/docs/overview) for all database schema definition and migrations.**

- The canonical schema lives at `packages/db/src/schema.ts`.  
  Any table or column changes **must** be made in this file.
- Never edit SQL migration files by hand unless absolutely necessary; instead update the TypeScript schema and regenerate migrations with:

  ```bash
  npm run db:generate   # shorthand for `drizzle-kit generate`
  ```

- _Never_ generate migrations by hand, always use the above command.

- Prisma is **not** used anywhere in this repository, so never create `.prisma` files, never run Prisma CLI commands, and never install Prisma-related packages.

Following these guidelines keeps the Drizzle schema, generated SQL migrations, and application types in perfect sync.
