# Tambo Templates

Starter templates for building AI-powered apps with Tambo.

## Official Templates

| Template                                                                         | Description         | Stack            |
| -------------------------------------------------------------------------------- | ------------------- | ---------------- |
| [tambo-template](https://github.com/tambo-ai/tambo-template)                     | Default starter     | Next.js + Tambo  |
| [tambo-template-tanstack](https://github.com/tambo-ai/tambo-template-tanstack)   | TanStack Router     | Vite + TanStack  |
| [analytics-template](https://github.com/tambo-ai/analytics-template)             | Analytics dashboard | Next.js + Charts |
| [betterauth-tambo-example](https://github.com/tambo-ai/betterauth-tambo-example) | Auth integration    | BetterAuth       |

## Contributing a Template

We have a high quality bar for merging templates. Focus on quality over quantity.

Want to add a template? Open a PR that adds a new folder to this directory.

### PR Requirements

Your PR must include:

1. **A new folder** in `community/templates/` named after your template (e.g., `community/templates/remix-clerk-starter/`)
2. **Working code** that runs with `npm install && npm run dev` from within the template folder
3. **README.md** inside your template folder with:
   - What the template demonstrates
   - Setup instructions
   - Screenshot or GIF (upload to GitHub by dragging into the PR, then use that link)
4. **Video demo** - Link to a short video demo in the README and PR description. You can [upload videos directly to GitHub](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files) by dragging into a comment, then copy the generated link.

### Keep It Simple

Templates should be focused and minimal:

- **1-3 technologies** is ideal. A template showing "Next.js + Clerk + Tambo" is better than one with 8 different libraries.
- **One tool per job** - pick ONE auth provider, ONE database, ONE styling solution. Templates with multiple options for the same thing will be rejected.
- **Minimal dependencies** - only include what's necessary to demonstrate the integration.
- **Clean code** - no commented-out code, no unused files, no placeholder TODOs.

### Design Requirements

Design quality should match Tambo's component design. Or better.

### Tambo Integration

We're not expecting a ton of Tambo code. Just **one example** that proves the integration works:

- **Auth template** - show that auth works with Tambo
- **Database template** - one component that can add or display records via AI
- **Framework template** - existing Tambo components work and are styled correctly in that framework

The video should show a conversation with the AI using your integration. Proper component/tool registration with clear descriptions is required.

### README Quality

Your template's README must include:

- **One-sentence description** - what this template is for.
- **Screenshot** - showing the app running with Tambo UI visible.
- **Video link** - demonstrating the AI interaction.
- **Prerequisites** - what accounts/API keys are needed (e.g., "You'll need a Clerk account").
- **Setup steps** - numbered, copy-pasteable commands.
- **What's included** - bullet list of the technologies and what they're used for.

### What Gets Rejected

- Kitchen-sink templates that try to include everything
- Broken or incomplete setups
- Missing video demo
- Poor documentation
- Ugly or unstyled UI
- Not responsive
- Generic "todo app" without meaningful Tambo integration

### Template Folder Structure

```
community/templates/
├── your-template-name/
│   ├── README.md          # Setup instructions + screenshot
│   ├── package.json
│   ├── src/
│   │   └── components/
│   │       └── tambo/     # Tambo component directory
│   └── ...
```

### Ideas for Templates

- **Frameworks** - Remix, Expo, Astro, or other React frameworks
- **Auth** - Clerk, Supabase Auth, NextAuth
- **Database** - Prisma, Drizzle, Convex
- **Backend** - tRPC, Hono
- **Use cases** - Real-time apps, dashboards, specific domains
