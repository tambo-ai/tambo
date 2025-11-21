# `@tambo-ai-cloud/db`

## Migrations

Migrations are managed by [Drizzle Migrations](https://orm.drizzle.team/docs/migrations). The workflow below is "Option 3", the first _Code First_ approach in that documentation.

Lets say a developer wants to add a new table to the database.

1. Developer adds a new entry to the `schema.ts` file describing the new table.
   _At this point the database is still unchanged, even though new types will be available to the application._

   This is a good time to commit the changes to the `schema.ts` file locally in case you have to make further tweaks.

2. Developer runs `npm run db:generate` to generate a new migration files, e.g.
   - `migrations/0032_add_new_table.sql`.
   - `migrations/metadata/0032_snapshot.json`.
3. Developer reviews the generated migration file, and edits it **only if necessary**.
   Try to avoid hand-editing the migration file.

   **NOTE** If there is an error in the generated migration file, it is better to delete the migration files, edit the `schema.ts` file, and run `npm run db:generate` again.

4. Developer runs the migration against the database with `npm run db:migrate`.

   **NOTE** Again, if there is an error in the generated migration file, it is better to delete the migration files, edit the `schema.ts` file, and run `npm run db:generate` again.

5. Developer commits the migration files to the repository and creates a PR.
6. When the PR is merged, the migration will be applied to the production database
   via GitHub Actions.
