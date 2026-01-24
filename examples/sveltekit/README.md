# Tambo + SvelteKit Example

This example demonstrates how to integrate Tambo with SvelteKit
using API routes instead of a browser SDK.

## Why API Routes?

- Keeps secrets on the server
- Works with SSR
- Avoids bundler issues
- Matches Tambo's architecture

## How it works

- `/api/tambo` handles requests on the server
- The Svelte page calls the API using `fetch`

## Running locally

```bash
npm install
npm run dev

