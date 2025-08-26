TRPC is used in the apps/web app.

The way we use TRPC means most of the parameters and return values are inferred automatically.

In addition, TRPC uses useQuery / useMutation from `@tanstack/query` under the hood, so you can use the same patterns for loading states, caching, etc.

Do not keep separate state for loading, error, etc. Use the hooks and the state will be managed for you.
