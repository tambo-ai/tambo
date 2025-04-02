Use TRPC for all API calls, do not use fetch or other HTTP clients.

Try to avoid a lot of back and forth API calls between the browser and the server.

When an API handler makes multiple database queries, try to batch them together in a single query or within a transaction.
