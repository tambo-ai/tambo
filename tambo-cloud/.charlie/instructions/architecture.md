This project is divided into two main apps:

- `apps/web` - a Next.js app that handles all the UI for the application, allowing customers to interact with the application. This app allows them to create and configure projects. This app has its own private TRPC API that talks to the database, and most operations do not talk to the Tambo API directly. Do not create new /api endpoints in this app.

- `apps/api` - The Tambo API server. A Nest-based OpenAPI server that handles all the business logic for the application, allowing end-users (not customers) to create and advance chat threads. The API talks directly to the database.

There are many shared libraries in this repository used by both apps:

- `packages/db` - The database schema and migrations, as well as some common database operations.
- `packages/core` - Shared utilities for the application. This is generally pure
  business logic that should never interact with the database, and rarely even
  makes API calls.
  - Authentication & OAuth (OAuth validation, MCP auth, email domain utilities)
  - Data processing (JSON handling, encryption/decryption, type utilities)
  - AI/agent tools (tool management, MCP client, agent utilities)
  - Validation & strictness (JSON schema validation, strict tool call handling)
  - Threading & communication (thread management, communication utilities)
  - Templates & constants (reusable templates, shared constants)
  - Project management (project utilities, component decision logic)
- `packages/backend` - The code that talks to the LLM and handles the llm-side of streaming and advancing threads.

There are also some shared libraries that are only part of development:

- `packages/eslint-config` - The ESLint configuration for the application.
- `packages/typescript-config` - The TypeScript configuration for the application.

When developing code, follow these guidelines:

- try to keep the code as simple and readable as possible, generally using functional programming patterns and avoiding classes.
- avoid mutable patterns - instead of using .sort(), use .toSorted(). Instead of modifying an array or object in place, create a new one using the spread operator, etc.
- never alter data passed to functions - instead of modifying an parameter value in place, return an updated object.
- avoid code duplication - instead of copying and pasting code, create a helper function.
- When sharing code:
  - if it is only useful within the current package, put it in the utils folder for that packages.
  - if a helper function is generally useful across packages, consider putting in packages/core.
  - if it is specific to LLM interaction, consider putting in packages/backend.
  - if it is specific to database operations, consider putting in packages/db.
