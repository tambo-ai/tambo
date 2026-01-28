# Tambo Template Generator

A web-based generator for creating **production-ready, Tambo-compliant templates** for the Tambo community.

This tool helps contributors generate complete starter templates that meet Tambo’s quality, documentation, and integration standards - ready to be submitted to `community/templates/` with minimal manual work.

---

## What This Project Does

The Tambo Template Generator guides users through a step-by-step wizard to generate a fully configured starter template, including:

- A complete project structure
- A high-quality README with setup instructions
- TypeScript configuration with strict mode
- ESLint and Prettier configuration
- Optional auth and database integrations
- A working Tambo component or tool example
- Environment variable templates
- A ZIP file ready for submission to the Tambo repository

This project is intended as a **community tool**, not a template itself.

---

## Who This Is For

- Developers contributing templates to the Tambo community
- Maintainers who want consistent, high-quality template submissions
- Anyone building production-ready Tambo starters

---

## Features

- Step-by-step template creation workflow
- Live validation against Tambo community requirements
- Auto-generated README and configuration files
- Conditional generation based on selected tech stack
- ZIP export for easy download and submission
- Enforces “starter, not showcase” principles

---

## Supported Options

### Frameworks

- Next.js
- Remix
- Vite + React
- Expo
- Astro

### Styling

- Tailwind CSS
- CSS Modules
- Styled Components

### Authentication (Optional)

- Clerk
- Supabase Auth
- NextAuth.js

### Database (Optional)

- Prisma
- Drizzle
- Supabase

### Tambo Integration

- Component-focused examples
- Tool-focused examples
- Combined component + tool examples

---

## Generated Output

Each generated template includes:

- `README.md` with setup, prerequisites, and usage
- `package.json` with scripts and dependencies
- `tsconfig.json` with strict TypeScript enabled
- ESLint and Prettier configuration
- `.env.example` with required environment variables
- A working Tambo component with Zod schema
- Proper Tambo registration and type definitions

The output is structured to run successfully with:

```bash
npm install
npm run dev
npm run lint
npm run build
```
## Code Style

This project follows the Tambo repository’s Prettier configuration and passes
`prettier --check` without any formatting issues.