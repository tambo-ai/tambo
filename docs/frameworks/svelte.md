	# Svelte / SvelteKit Support

Tambo can be used with Svelte and SvelteKit without requiring
a browser-specific SDK.

## Recommended Approach

Use SvelteKit API routes to communicate with Tambo's backend
or core services.

### Benefits

- Secure (no client-side secrets)
- SSR-friendly
- Framework-agnostic
- Easy to maintain

## Example

A minimal SvelteKit example is available at:

examples/sveltekit

This pattern is recommended for all Svelte-based applications.

