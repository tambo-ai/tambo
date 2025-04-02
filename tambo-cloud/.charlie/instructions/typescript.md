Try to use the latest version of TypeScript and the latest version of the libraries you are using.

Try to use immutable patterns when possible:

- Use `const` over `let`, and even avoid `let` when possible.
- Never use `var`
- Never reassign parameter values
- Try not to alter objects, instead create a new object with the new values

When any function returns a Promise, make sure it is async, and use `await` when calling it.

Generally avoid disabling eslint rules.

Avoid introducing intermediate "helper" types or interfaces for internal functions, try to use inferred types from the db schema, trpc schema, etc.

Do not make generic "index.ts" files that just import everything from a directory - consumers should import types/functions/hooks/etc. directly.
