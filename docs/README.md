# Tambo AI Documentation

This repository contains the documentation for [Tambo AI](https://tambo.co).

## Development

To run the documentation site locally:

```bash
npm run dev
```

Open http://localhost:3000 to view the documentation.

## Structure

This documentation is built using [Fumadocs.](https://fumadocs.dev/)

- `content/docs/` - Documentation content in MDX format
- `src/app/` - Next.js application routes and layouts, configured with Fumadocs to build pages based on `/content/docs/`
- `src/components/` - React components for the documentation site
- `public/` - Static assets and images

## Design Token Rules

- Documentation examples must match the neutral-first guidance in `TOKENS.md`.
- Prefer `text-foreground` or `text-muted-foreground` for narrative text and captions.
- Only showcase `text-primary` when paired with `bg-primary`; highlight deprecated patterns in callouts rather than production snippets.
- Keep placeholders neutral (`placeholder:text-muted-foreground`) and avoid resurrecting `text-secondary` in docs content or code samples.

## License

MIT License - see the [LICENSE](https://github.com/tambo-ai/tambo/blob/main/LICENSE) file for details.

## Join the Community

Help build tools for the future of user interfaces.

**[Star this repo](https://github.com/tambo-ai/tambo)** to support our work.

**[Join our Discord](https://discord.gg/dJNvPEHth6)** to connect with other developers.
